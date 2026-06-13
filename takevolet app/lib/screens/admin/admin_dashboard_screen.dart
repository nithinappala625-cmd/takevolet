import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../main.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool isLoading = true;
  late SupabaseClient supabaseAdmin;

  // Stats
  int totalUsers = 0, totalRooms = 0, totalFlatmates = 0, totalUnlocks = 0;
  int totalRevenue = 0, pendingPayouts = 0;

  // Data lists
  List<Map<String, dynamic>> payouts = [];
  List<Map<String, dynamic>> unlocks = [];
  List<Map<String, dynamic>> users = [];
  List<Map<String, dynamic>> rooms = [];
  List<Map<String, dynamic>> flatmates = [];
  List<Map<String, dynamic>> carousels = [];
  List<Map<String, dynamic>> kycList = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 8, vsync: this);
    supabaseAdmin = SupabaseClient(
      'https://vwcqovrbvhztpkultqjl.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Y3FvdnJidmh6dHBrdWx0cWpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyMDYwOCwiZXhwIjoyMDkzMzk2NjA4fQ.5OKsvAVnHSqhk_wsddohOgbsNhJS1u2oOC1UXWseLn8',
    );
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      // Fetch profiles safely — if aadhar columns don't exist, fall back to basic select
      List<Map<String, dynamic>> usersListRaw = [];
      final adminData = await supabaseAdmin.from('profiles').select('role').eq('id', Supabase.instance.client.auth.currentUser?.id ?? '');
      
      if (adminData.isNotEmpty && adminData.first['role'] == 'admin') {
        usersListRaw = List<Map<String, dynamic>>.from(await supabaseAdmin.from('profiles').select('id, full_name, email, phone, avatar_url, created_at, aadhar_url, aadhar_back_url, kyc_status, contact_balance, location, colony, house_no, profession, members_count'));
      } else {
        // Fallback for demo or non-super admin
        usersListRaw = List<Map<String, dynamic>>.from(await supabaseAdmin.from('profiles').select('id, full_name, email, phone, avatar_url, created_at, contact_balance, location, colony, house_no, profession, members_count'));
      }

      // These core tables must succeed
      final roomsList = await supabaseAdmin.from('rooms').select('id, title, user_id, rent, location, colony, is_available, created_at, images');
      final flatmatesList = await supabaseAdmin.from('flatmates').select('id, title, user_id, rent_share, location, is_available, created_at, images');
      final unlocksList = await supabaseAdmin.from('contact_unlocks').select('id, user_id, room_id, created_at');

      List<Map<String, dynamic>> carouselsList = [];
      try { carouselsList = List<Map<String, dynamic>>.from(await supabaseAdmin.from('carousels').select().order('created_at', ascending: false)); } catch (_) {}
      List<Map<String, dynamic>> payoutsList = [];
      try { payoutsList = List<Map<String, dynamic>>.from(await supabaseAdmin.from('payout_requests').select().order('created_at', ascending: false)); } catch (_) {}

      // KYC submissions — users who have aadhar images
      final kycSubmissions = usersListRaw.where((u) =>
        u['aadhar_url'] != null || u['aadhar_back_url'] != null
      ).toList();

      setState(() {
        users = List<Map<String, dynamic>>.from(usersListRaw);
        rooms = List<Map<String, dynamic>>.from(roomsList);
        flatmates = List<Map<String, dynamic>>.from(flatmatesList);
        unlocks = List<Map<String, dynamic>>.from(unlocksList);
        payouts = payoutsList;
        carousels = carouselsList;
        kycList = List<Map<String, dynamic>>.from(kycSubmissions);

        totalUsers = users.length;
        totalRooms = rooms.length;
        totalFlatmates = flatmates.length;
        totalUnlocks = unlocks.length;
        totalRevenue = totalUnlocks * 105;
        pendingPayouts = payouts.where((p) => p['status'] == 'pending').length;
        isLoading = false;
      });
    } catch (e) {
      debugPrint('Admin load error: $e');
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Panel', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 1,
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: const Color(0xFFD4AF37),
          labelColor: const Color(0xFFD4AF37),
          unselectedLabelColor: Colors.grey,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.dashboard, size: 18), text: 'Overview'),
            Tab(icon: Icon(Icons.payments, size: 18), text: 'Payouts'),
            Tab(icon: Icon(Icons.lock_open, size: 18), text: 'Unlocks'),
            Tab(icon: Icon(Icons.people, size: 18), text: 'Users'),
            Tab(icon: Icon(Icons.home_work, size: 18), text: 'Rooms'),
            Tab(icon: Icon(Icons.group, size: 18), text: 'Flatmates'),
            Tab(icon: Icon(Icons.verified_user, size: 18), text: 'KYC'),
            Tab(icon: Icon(Icons.view_carousel, size: 18), text: 'Carousels'),
          ],
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOverviewTab(),
                _buildPayoutsTab(),
                _buildUnlocksTab(),
                _buildUsersTab(),
                _buildRoomsTab(),
                _buildFlatmatesTab(),
                _buildKycTab(),
                _buildCarouselsTab(),
              ],
            ),
    );
  }

  // ─── OVERVIEW TAB ──────────────────────────────────────────────
  Widget _buildOverviewTab() {
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Revenue Cards Row
          Row(children: [
            Expanded(child: _statCard('₹$totalRevenue', 'Total Revenue', Icons.currency_rupee, Colors.green)),
            const SizedBox(width: 12),
            Expanded(child: _statCard('$pendingPayouts', 'Pending Payouts', Icons.pending_actions, Colors.orange)),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _statCard('$totalUnlocks', 'Total Unlocks', Icons.lock_open, Colors.purple)),
            const SizedBox(width: 12),
            Expanded(child: _statCard('$totalUsers', 'Total Users', Icons.people, Colors.blue)),
          ]),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: _statCard('$totalRooms', 'Rooms Listed', Icons.home, Colors.teal)),
            const SizedBox(width: 12),
            Expanded(child: _statCard('$totalFlatmates', 'Flatmates Listed', Icons.group, Colors.indigo)),
          ]),
          const SizedBox(height: 24),
          const Text('Recent Unlocks', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(height: 8),
          ...unlocks.take(5).map((u) => _unlockTile(u)),
        ],
      ),
    );
  }

  Widget _statCard(String value, String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.25)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 12),
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: color)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
      ]),
    );
  }

  // ─── PAYOUTS TAB ───────────────────────────────────────────────
  Widget _buildPayoutsTab() {
    if (payouts.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.payments_outlined, size: 64, color: Colors.grey[300]),
        const SizedBox(height: 12),
        Text('No payout requests yet', style: TextStyle(color: Colors.grey[500])),
      ]));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: payouts.length,
      itemBuilder: (ctx, i) {
        final p = payouts[i];
        final status = p['status'] ?? 'pending';
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            title: Text('₹${p['amount'] ?? 0}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            subtitle: Text('User: ${p['user_id']?.substring(0, 8) ?? 'N/A'}\n${p['created_at']?.substring(0, 10) ?? ''}'),
            trailing: status == 'pending'
                ? Row(mainAxisSize: MainAxisSize.min, children: [
                    IconButton(
                      icon: const Icon(Icons.check_circle, color: Colors.green),
                      onPressed: () async {
                        await supabaseAdmin.from('payout_requests').update({'status': 'approved'}).eq('id', p['id']);
                        _loadData();
                      },
                    ),
                    IconButton(
                      icon: const Icon(Icons.cancel, color: Colors.red),
                      onPressed: () async {
                        await supabaseAdmin.from('payout_requests').update({'status': 'rejected'}).eq('id', p['id']);
                        _loadData();
                      },
                    ),
                  ])
                : Chip(
                    label: Text(status.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    backgroundColor: status == 'approved' ? Colors.green[50] : Colors.red[50],
                    labelStyle: TextStyle(color: status == 'approved' ? Colors.green : Colors.red),
                  ),
          ),
        );
      },
    );
  }

  // ─── UNLOCKS TAB ───────────────────────────────────────────────
  Widget _buildUnlocksTab() {
    if (unlocks.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.lock_outline, size: 64, color: Colors.grey[300]),
        const SizedBox(height: 12),
        Text('No unlocks yet', style: TextStyle(color: Colors.grey[500])),
      ]));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: unlocks.length,
      itemBuilder: (ctx, i) => _unlockTile(unlocks[i]),
    );
  }

  Widget _unlockTile(Map<String, dynamic> u) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.purple.withOpacity(0.1),
          child: const Icon(Icons.lock_open, color: Colors.purple, size: 20),
        ),
        title: Text('Room: ${u['room_id']?.substring(0, 8) ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text('By: ${u['user_id']?.substring(0, 8) ?? 'N/A'} • ₹105'),
        trailing: Text(u['created_at']?.substring(0, 10) ?? '', style: TextStyle(color: Colors.grey[500], fontSize: 12)),
      ),
    );
  }

  // ─── USERS TAB ─────────────────────────────────────────────────
  Widget _buildUsersTab() {
    if (users.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.people_outline, size: 64, color: Colors.grey[300]),
        const SizedBox(height: 12),
        Text('No users yet', style: TextStyle(color: Colors.grey[500])),
      ]));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: users.length,
      itemBuilder: (ctx, i) {
        final u = users[i];
        final name = u['full_name'] ?? 'Unknown User';
        final email = u['email'] ?? '';
        final phone = u['phone'] ?? '';
        final avatar = u['avatar_url'];
        final joinDate = u['created_at']?.toString().substring(0, 10) ?? '';

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 3))],
            border: Border.all(color: Colors.grey.shade100),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFD4AF37), width: 2),
                  ),
                  child: ClipOval(
                    child: avatar != null
                        ? Image.network(avatar, fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              color: const Color(0xFFD4AF37).withOpacity(0.15),
                              child: Center(child: Text(name[0].toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: Color(0xFFD4AF37)))),
                            ))
                        : Container(
                            color: const Color(0xFFD4AF37).withOpacity(0.15),
                            child: Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: Color(0xFFD4AF37)))),
                          ),
                  ),
                ),
                const SizedBox(width: 14),
                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 4),
                      if (email.isNotEmpty) Row(children: [
                        Icon(Icons.email_outlined, size: 13, color: Colors.grey[500]),
                        const SizedBox(width: 4),
                        Expanded(child: Text(email, style: TextStyle(color: Colors.grey[600], fontSize: 12), overflow: TextOverflow.ellipsis)),
                      ]),
                      if (phone.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Row(children: [
                          Icon(Icons.phone_outlined, size: 13, color: Colors.grey[500]),
                          const SizedBox(width: 4),
                          Text(phone, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                        ]),
                      ],
                    ],
                  ),
                ),
                // Date badge
                Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFD4AF37).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text('Joined', style: TextStyle(color: Colors.grey[600], fontSize: 10, fontWeight: FontWeight.w600)),
                    ),
                    const SizedBox(height: 4),
                    Text(joinDate, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.edit, color: Colors.blue),
                  onPressed: () => _editUserDialog(u),
                )
              ],
            ),
          ),
        );
      },
    );
  }

  void _editUserDialog(Map<String, dynamic> u) {
    final TextEditingController nameCtrl = TextEditingController(text: u['full_name']);
    final TextEditingController phoneCtrl = TextEditingController(text: u['phone']);
    final TextEditingController balanceCtrl = TextEditingController(text: u['contact_balance']?.toString() ?? '0');
    final TextEditingController locCtrl = TextEditingController(text: u['location']);
    final TextEditingController colCtrl = TextEditingController(text: u['colony']);
    final TextEditingController profCtrl = TextEditingController(text: u['profession']);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit User'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Full Name')),
              TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone')),
              TextField(controller: balanceCtrl, decoration: const InputDecoration(labelText: 'Contact Balance')),
              TextField(controller: locCtrl, decoration: const InputDecoration(labelText: 'Location')),
              TextField(controller: colCtrl, decoration: const InputDecoration(labelText: 'Colony')),
              TextField(controller: profCtrl, decoration: const InputDecoration(labelText: 'Profession')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await supabaseAdmin.from('profiles').update({
                  'full_name': nameCtrl.text,
                  'phone': phoneCtrl.text,
                  'contact_balance': int.tryParse(balanceCtrl.text) ?? 0,
                  'location': locCtrl.text,
                  'colony': colCtrl.text,
                  'profession': profCtrl.text,
                }).eq('id', u['id']);
                _loadData();
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User updated successfully')));
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update: $e')));
              }
            },
            child: const Text('Save'),
          )
        ],
      ),
    );
  }

  // ─── ROOMS TAB ─────────────────────────────────────────────────
  Widget _buildRoomsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: rooms.length,
      itemBuilder: (ctx, i) {
        final r = rooms[i];
        final images = (r['images'] as List<dynamic>?)?.cast<String>() ?? [];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: ClipRoundedRect(
              images: images,
            ),
            title: Text(r['title'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('₹${r['rent']}/mo • ${r['location'] ?? ''}'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Switch(
                  value: r['is_available'] ?? true,
                  onChanged: (val) async {
                    await supabaseAdmin.from('rooms').update({'is_available': val}).eq('id', r['id']);
                    _loadData();
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: () => _confirmDelete('rooms', r['id'], r['title'] ?? 'this room'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ─── FLATMATES TAB ─────────────────────────────────────────────
  Widget _buildFlatmatesTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: flatmates.length,
      itemBuilder: (ctx, i) {
        final f = flatmates[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.indigo.withOpacity(0.1),
              child: const Icon(Icons.group, color: Colors.indigo, size: 20),
            ),
            title: Text(f['title'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('₹${f['rent_share']}/mo • ${f['location'] ?? ''}'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Switch(
                  value: f['is_available'] ?? true,
                  onChanged: (val) async {
                    await supabaseAdmin.from('flatmates').update({'is_available': val}).eq('id', f['id']);
                    _loadData();
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: () => _confirmDelete('flatmates', f['id'], f['title'] ?? 'this flatmate listing'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ─── KYC TAB ───────────────────────────────────────────────────
  Widget _buildKycTab() {
    if (kycList.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.verified_user_outlined, size: 64, color: Colors.grey[300]),
        const SizedBox(height: 12),
        Text('No KYC submissions yet', style: TextStyle(color: Colors.grey[500], fontSize: 16)),
        const SizedBox(height: 8),
        Text('Users who submit Aadhar cards will appear here', style: TextStyle(color: Colors.grey[400], fontSize: 13), textAlign: TextAlign.center),
      ]));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: kycList.length,
      itemBuilder: (ctx, i) {
        final u = kycList[i];
        final name = u['full_name'] ?? 'Unknown';
        final aadharFront = u['aadhar_url'];
        final aadharBack = u['aadhar_back_url'];
        final status = u['kyc_status'] ?? 'pending';

        Color statusColor = status == 'approved' ? Colors.green : (status == 'rejected' ? Colors.red : Colors.orange);
        String statusLabel = status == 'approved' ? '✅ Approved' : (status == 'rejected' ? '❌ Rejected' : '⏳ Pending');

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: statusColor.withOpacity(0.3)),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 3))],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: const Color(0xFFD4AF37).withOpacity(0.15),
                    backgroundImage: u['avatar_url'] != null ? NetworkImage(u['avatar_url']) : null,
                    child: u['avatar_url'] == null ? Text(name[0].toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFD4AF37))) : null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Text(u['email'] ?? '', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                  ])),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                    child: Text(statusLabel, style: TextStyle(color: statusColor, fontWeight: FontWeight.w600, fontSize: 12)),
                  ),
                ]),
                const SizedBox(height: 16),
                const Text('Aadhar Documents', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 8),
                Row(children: [
                  // Front
                  Expanded(child: Column(children: [
                    const Text('Front', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 4),
                    GestureDetector(
                      onTap: aadharFront != null ? () => _showFullImage(ctx, aadharFront) : null,
                      child: Container(
                        height: 100,
                        decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey[200]!), color: Colors.grey[100]),
                        clipBehavior: Clip.antiAlias,
                        child: aadharFront != null
                            ? Image.network(aadharFront, fit: BoxFit.cover, width: double.infinity,
                                errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.image_not_supported, color: Colors.grey)))
                            : const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                                Icon(Icons.image_not_supported_outlined, color: Colors.grey),
                                Text('Not submitted', style: TextStyle(fontSize: 10, color: Colors.grey)),
                              ])),
                      ),
                    ),
                  ])),
                  const SizedBox(width: 12),
                  // Back
                  Expanded(child: Column(children: [
                    const Text('Back', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(height: 4),
                    GestureDetector(
                      onTap: aadharBack != null ? () => _showFullImage(ctx, aadharBack) : null,
                      child: Container(
                        height: 100,
                        decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey[200]!), color: Colors.grey[100]),
                        clipBehavior: Clip.antiAlias,
                        child: aadharBack != null
                            ? Image.network(aadharBack, fit: BoxFit.cover, width: double.infinity,
                                errorBuilder: (_, __, ___) => const Center(child: Icon(Icons.image_not_supported, color: Colors.grey)))
                            : const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                                Icon(Icons.image_not_supported_outlined, color: Colors.grey),
                                Text('Not submitted', style: TextStyle(fontSize: 10, color: Colors.grey)),
                              ])),
                      ),
                    ),
                  ])),
                ]),
                if (status == 'pending' && (aadharFront != null || aadharBack != null)) ...[
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(child: OutlinedButton(
                      onPressed: () async {
                        await supabaseAdmin.from('profiles').update({'kyc_status': 'rejected'}).eq('id', u['id']);
                        _loadData();
                      },
                      style: OutlinedButton.styleFrom(foregroundColor: Colors.red, side: const BorderSide(color: Colors.red), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                      child: const Text('Reject'),
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: ElevatedButton(
                      onPressed: () async {
                        await supabaseAdmin.from('profiles').update({'kyc_status': 'approved'}).eq('id', u['id']);
                        _loadData();
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                      child: const Text('Approve'),
                    )),
                  ]),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  void _showFullImage(BuildContext context, String imageUrl) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        backgroundColor: Colors.black,
        insetPadding: EdgeInsets.zero,
        child: Stack(children: [
          SizedBox.expand(child: InteractiveViewer(child: Image.network(imageUrl, fit: BoxFit.contain))),
          Positioned(top: 40, right: 16, child: IconButton(icon: const Icon(Icons.close, color: Colors.white, size: 30), onPressed: () => Navigator.pop(context))),
        ]),
      ),
    );
  }

  // ─── CAROUSELS TAB ─────────────────────────────────────────────
  Widget _buildCarouselsTab() {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddCarouselDialog,
        backgroundColor: const Color(0xFFD4AF37),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: carousels.length,
        itemBuilder: (ctx, i) {
          final c = carousels[i];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  c['image_url'] ?? '',
                  width: 60,
                  height: 40,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(width: 60, height: 40, color: Colors.grey[200], child: const Icon(Icons.image)),
                ),
              ),
              title: Text(c['link_url']?.isNotEmpty == true ? c['link_url'] : 'No link', style: const TextStyle(fontSize: 14)),
              trailing: IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                onPressed: () => _confirmDelete('carousels', c['id'], 'this carousel'),
              ),
            ),
          );
        },
      ),
    );
  }

  void _showAddCarouselDialog() {
    final imgController = TextEditingController();
    final linkController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Carousel'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: imgController, decoration: const InputDecoration(labelText: 'Image URL')),
            const SizedBox(height: 12),
            TextField(controller: linkController, decoration: const InputDecoration(labelText: 'Link (Optional)')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (imgController.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              await supabaseAdmin.from('carousels').insert({
                'image_url': imgController.text.trim(),
                'link_url': linkController.text.trim(),
              });
              _loadData();
            },
            child: const Text('Add'),
          )
        ],
      ),
    );
  }

  void _confirmDelete(String table, String id, String name) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Confirm Delete'),
        content: Text('Are you sure you want to delete "$name"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await supabaseAdmin.from(table).delete().eq('id', id);
              _loadData();
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('"$name" deleted'), backgroundColor: Colors.red));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class ClipRoundedRect extends StatelessWidget {
  final List<String> images;
  const ClipRoundedRect({super.key, required this.images});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: SizedBox(
        width: 48, height: 48,
        child: images.isNotEmpty
            ? Image.network(images.first, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: Colors.grey[200], child: const Icon(Icons.home, size: 24)))
            : Container(color: Colors.grey[200], child: const Icon(Icons.home, size: 24, color: Colors.grey)),
      ),
    );
  }
}
