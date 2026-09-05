import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../main.dart';
import '../add_room/add_room_screen.dart';
import '../add_flatmate/add_flatmate_screen.dart';
import '../add_sale/add_property_sale_screen.dart';
import '../rooms/room_detail_screen.dart';
import '../flatmates/flatmate_detail_screen.dart';
import '../flats/flat_detail_screen.dart';
import '../build/add_build_listing_screen.dart';
import '../../utils/image_utils.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../services/r2_storage_service.dart';

import 'admin_json_editor_screen.dart';

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
  List<Map<String, dynamic>> flats = [];
  List<Map<String, dynamic>> buildListings = [];
  List<Map<String, dynamic>> buildBookings = [];
  List<Map<String, dynamic>> carousels = [];
  List<Map<String, dynamic>> kycList = [];
  List<Map<String, dynamic>> payments = [];
  List<Map<String, dynamic>> pricingPlans = [];
  List<Map<String, dynamic>> banners = [];
  Map<String, dynamic>? appSettings;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 16, vsync: this);
    supabaseAdmin = SupabaseClient(
      'https://gfhmdpzmhakznuqhstrn.supabase.co',
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
      List<Map<String, dynamic>> usersListRaw = [];
      try {
        usersListRaw = List<Map<String, dynamic>>.from(await supabaseAdmin.from('profiles').select());
      } catch (e) {
        debugPrint('Admin users load error: $e');
      }

      List<Map<String, dynamic>> roomsList = [];
      try {
        roomsList = List<Map<String, dynamic>>.from(await supabaseAdmin.from('rooms').select());
      } catch (e) {
        debugPrint('Admin rooms load error: $e');
      }

      List<Map<String, dynamic>> flatmatesList = [];
      try {
        flatmatesList = List<Map<String, dynamic>>.from(await supabaseAdmin.from('flatmates').select());
      } catch (e) {
        debugPrint('Admin flatmates load error: $e');
      }

      List<Map<String, dynamic>> unlocksList = [];
      try {
        unlocksList = List<Map<String, dynamic>>.from(await supabaseAdmin.from('contact_unlocks').select());
      } catch (e) {
        debugPrint('Admin unlocks load error: $e');
      }

      List<Map<String, dynamic>> flatsList = [];
      try {
        flatsList = List<Map<String, dynamic>>.from(await supabaseAdmin.from('property_sales').select());
      } catch (e) {
        debugPrint('Admin flats load error: $e');
      }

      List<Map<String, dynamic>> buildListingsRaw = [];
      try {
        buildListingsRaw = List<Map<String, dynamic>>.from(await supabaseAdmin.from('build_listings').select().order('created_at', ascending: false));
      } catch (e) {
        debugPrint('Admin build_listings load error: $e');
      }

      List<Map<String, dynamic>> buildBookingsRaw = [];
      try {
        buildBookingsRaw = List<Map<String, dynamic>>.from(await supabaseAdmin.from('bookings').select('*, build_listings(*)').order('created_at', ascending: false));
      } catch (e) {
        debugPrint('Admin build_bookings load error: $e');
      }

      List<Map<String, dynamic>> carouselsList = [];
      try { carouselsList = List<Map<String, dynamic>>.from(await supabaseAdmin.from('carousels').select().order('created_at', ascending: false)); } catch (_) {}
      
      List<Map<String, dynamic>> payoutsList = [];
      try { payoutsList = List<Map<String, dynamic>>.from(await supabaseAdmin.from('payout_requests').select().order('created_at', ascending: false)); } catch (_) {}

      // KYC submissions — users who have aadhar images
      final kycSubmissions = usersListRaw.where((u) =>
        u['aadhar_url'] != null || u['aadhar_back_url'] != null
      ).toList();

      List<Map<String, dynamic>> paymentsList = [];
      try { paymentsList = List<Map<String, dynamic>>.from(await supabaseAdmin.from('payment_history').select().order('created_at', ascending: false)); } catch (_) {}

      List<Map<String, dynamic>> pricingList = [];
      try { pricingList = List<Map<String, dynamic>>.from(await supabaseAdmin.from('pricing_plans').select().order('created_at')); } catch (_) {}

      List<Map<String, dynamic>> bannersList = [];
      try { bannersList = List<Map<String, dynamic>>.from(await supabaseAdmin.from('sponsored_banners').select().order('created_at', ascending: false)); } catch (_) {}

      Map<String, dynamic>? settingsResult;
      try {
        settingsResult = await supabaseAdmin.from('app_settings').select().limit(1).maybeSingle();
      } catch (_) {}

      setState(() {
        users = usersListRaw;
        rooms = roomsList;
        flatmates = flatmatesList;
        flats = flatsList;
        buildListings = buildListingsRaw;
        buildBookings = buildBookingsRaw;
        unlocks = unlocksList;
        payouts = payoutsList;
        carousels = carouselsList;
        kycList = kycSubmissions;
        payments = paymentsList;
        pricingPlans = pricingList;
        banners = bannersList;
        appSettings = settingsResult;

        totalUsers = users.length;
        totalRooms = rooms.length;
        totalFlatmates = flatmates.length;
        totalUnlocks = unlocks.length;
        totalRevenue = payments.fold(0, (sum, p) => sum + ((p['amount'] ?? 0) as int));
        pendingPayouts = payouts.where((p) => p['status'] == 'pending').length;
        isLoading = false;
      });
    } catch (e) {
      debugPrint('Admin load error: $e');
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _showGlobalIdSearchDialog(BuildContext context) async {
    final TextEditingController idController = TextEditingController();
    
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Global ID Search'),
        content: TextField(
          controller: idController,
          decoration: const InputDecoration(
            hintText: 'Enter UUID to search...',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final id = idController.text.trim();
              if (id.isEmpty) return;
              
              Navigator.pop(ctx);
              
              showDialog(
                context: context,
                barrierDismissible: false,
                builder: (_) => const Center(child: CircularProgressIndicator()),
              );
              
              try {
                // Search rooms
                var res = await supabaseAdmin.from('rooms').select('id').eq('id', id).maybeSingle();
                if (res != null) {
                  Navigator.pop(context); // close loader
                  context.push('/room/$id');
                  return;
                }
                
                // Search property_sales
                res = await supabaseAdmin.from('property_sales').select('id').eq('id', id).maybeSingle();
                if (res != null) {
                  Navigator.pop(context);
                  context.push('/property/$id');
                  return;
                }
                
                // Search top_projects
                res = await supabaseAdmin.from('top_projects').select('id').eq('id', id).maybeSingle();
                if (res != null) {
                  Navigator.pop(context);
                  final fullProj = await supabaseAdmin.from('top_projects').select().eq('id', id).single();
                  context.push('/top-project/$id', extra: fullProj);
                  return;
                }
                
                // Search social_posts (Feed)
                res = await supabaseAdmin.from('social_posts').select('id').eq('id', id).maybeSingle();
                if (res != null) {
                  Navigator.pop(context);
                  context.push('/feed');
                  return;
                }

                // Search flatmates
                res = await supabaseAdmin.from('flatmates').select('id').eq('id', id).maybeSingle();
                if (res != null) {
                  Navigator.pop(context);
                  context.push('/flatmate/$id');
                  return;
                }

                Navigator.pop(context); // close loader
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('ID not found in any major table')),
                );
              } catch (e) {
                Navigator.pop(context); // close loader
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Search Error: $e')),
                );
              }
            },
            child: const Text('Search'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Panel', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 1,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            tooltip: 'Search by ID',
            onPressed: () {
              _showGlobalIdSearchDialog(context);
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: Colors.black87,
          labelColor: Colors.black87,
          unselectedLabelColor: Colors.grey,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [
            Tab(icon: Icon(Icons.dashboard, size: 18), text: 'Overview'),
            Tab(icon: Icon(Icons.payments, size: 18), text: 'Payouts'),
            Tab(icon: Icon(Icons.lock_open, size: 18), text: 'Unlocks'),
            Tab(icon: Icon(Icons.people, size: 18), text: 'Users'),
            Tab(icon: Icon(Icons.home_work, size: 18), text: 'Rooms'),
            Tab(icon: Icon(Icons.group, size: 18), text: 'Flatmates'),
            Tab(icon: Icon(Icons.apartment, size: 18), text: 'Properties'),
            Tab(icon: Icon(Icons.construction, size: 18), text: 'Build Listings'),
            Tab(icon: Icon(Icons.handshake, size: 18), text: 'Build Bookings'),
            Tab(icon: Icon(Icons.verified_user, size: 18), text: 'KYC'),
            Tab(icon: Icon(Icons.view_carousel, size: 18), text: 'Carousels'),
            Tab(icon: Icon(Icons.settings, size: 18), text: 'Pricing'),
            Tab(icon: Icon(Icons.receipt_long, size: 18), text: 'Payments'),
            Tab(icon: Icon(Icons.campaign, size: 18), text: 'Banners'),
            Tab(icon: Icon(Icons.notifications_active, size: 18), text: 'Notify'),
            Tab(icon: Icon(Icons.settings_applications, size: 18), text: 'App Config'),
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
                _buildFlatsTab(),
                _buildBuildListingsTab(),
                _buildBuildBookingsTab(),
                _buildKycTab(),
                _buildCarouselsTab(),
                _buildPricingTab(),
                _buildPaymentsTab(),
                _buildBannersTab(),
                _buildNotifyTab(),
                _buildAppConfigTab(),
              ],
            ),
    );
  }

  // ─── APP CONFIG TAB ──────────────────────────────────────────────
  Widget _buildAppConfigTab() {
    return Center(
      child: ElevatedButton.icon(
        icon: const Icon(Icons.settings_applications),
        label: const Text('Open App Configuration'),
        onPressed: () {
          context.push('/admin/app-config');
        },
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        ),
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
          ElevatedButton.icon(
            icon: const Icon(Icons.picture_in_picture),
            label: const Text('Manage Sponsored Banners'),
            onPressed: () => context.push('/admin/banners'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white, padding: const EdgeInsets.all(16)),
          ),
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
        gradient: LinearGradient(
          colors: [color.withOpacity(0.05), color.withOpacity(0.15)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4)),
        ],
        border: Border.all(color: color.withOpacity(0.3), width: 1.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(color: color.withOpacity(0.2), blurRadius: 4, offset: const Offset(0, 2)),
                ],
              ),
              child: Icon(icon, color: color, size: 24),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 26, color: color.withOpacity(0.9))),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: Colors.grey.shade800, fontSize: 13, fontWeight: FontWeight.w700)),
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
        final email = u['email'] ?? '';
        final phone = u['phone'] ?? '';
        String name = u['full_name'] ?? '';
        if (name.trim().isEmpty) {
          name = email.isNotEmpty ? email.split('@').first : (phone.isNotEmpty ? phone : 'Unknown User');
        }
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
                      if ((u['upi_id'] ?? '').toString().isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Row(children: [
                          Icon(Icons.account_balance_wallet, size: 13, color: Colors.green[600]),
                          const SizedBox(width: 4),
                          Text('UPI: ${u['upi_id']}', style: TextStyle(color: Colors.green[700], fontSize: 12, fontWeight: FontWeight.w600)),
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

  Future<void> _editItem(BuildContext context, String table, Map<String, dynamic> item) async {
    Widget? targetScreen;
    if (table == 'rooms') targetScreen = AddRoomScreen(initialData: item);
    else if (table == 'flatmates') targetScreen = AddFlatmateScreen(initialData: item);
    else if (table == 'property_sales') targetScreen = AddPropertySaleScreen(initialData: item);
    else if (table == 'build_listings') targetScreen = AddBuildListingScreen(initialData: item);

    if (targetScreen != null) {
      await Navigator.push(context, MaterialPageRoute(builder: (_) => targetScreen!));
      _loadData();
    }
  }

  Future<void> _dynamicEditItem(BuildContext context, String table, Map<String, dynamic> item) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AdminJsonEditorScreen(tableName: table, item: item),
      ),
    );
    if (result == true) {
      _loadData();
    }
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
                  icon: const Icon(Icons.data_object, color: Colors.purple),
                  tooltip: 'Edit Dynamic Fields',
                  onPressed: () => _dynamicEditItem(context, 'rooms', r),
                ),
                IconButton(
                  icon: const Icon(Icons.edit, color: Colors.blue),
                  onPressed: () => _editItem(context, 'rooms', r),
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
                  icon: const Icon(Icons.data_object, color: Colors.purple),
                  tooltip: 'Edit Dynamic Fields',
                  onPressed: () => _dynamicEditItem(context, 'flatmates', f),
                ),
                IconButton(
                  icon: const Icon(Icons.edit, color: Colors.blue),
                  onPressed: () => _editItem(context, 'flatmates', f),
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

  // ─── FLATS TAB ─────────────────────────────────────────────────
  Widget _buildFlatsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: flats.length,
      itemBuilder: (ctx, i) {
        final f = flats[i];
        final images = (f['images'] as List<dynamic>?)?.cast<String>() ?? [];
        final thumbnailUrl = images.isNotEmpty ? images.first : null;
        
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: SizedBox(
              width: 50,
              height: 50,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: thumbnailUrl != null
                    ? CachedNetworkImage(imageUrl: thumbnailUrl, fit: BoxFit.cover, errorWidget: (_, __, ___) => const Icon(Icons.apartment))
                    : const Icon(Icons.apartment, color: Colors.grey),
              ),
            ),
            title: Text(f['title'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${f['property_category'] ?? f['property_type'] ?? ''} • ₹${f['expected_price'] ?? f['price'] ?? 0} • ${f['district'] ?? f['city'] ?? ''}'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Switch(
                  value: f['is_available'] ?? true,
                  onChanged: (val) async {
                    await supabaseAdmin.from('property_sales').update({'is_available': val}).eq('id', f['id']);
                    _loadData();
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.data_object, color: Colors.purple),
                  tooltip: 'Edit Dynamic Fields',
                  onPressed: () => _dynamicEditItem(context, 'property_sales', f),
                ),
                IconButton(
                  icon: const Icon(Icons.edit, color: Colors.blue),
                  onPressed: () => _editItem(context, 'property_sales', f),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: () => _confirmDelete('property_sales', f['id'], f['title'] ?? 'this flat'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ─── COOKS TAB ─────────────────────────────────────────────────
  Widget _buildBuildListingsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: buildListings.length,
      itemBuilder: (ctx, i) {
        final c = buildListings[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.orange.withOpacity(0.1),
              child: const Icon(Icons.construction, color: Colors.orange, size: 20),
            ),
            title: Text(c['title'] ?? 'Unknown Listing', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${c['main_category']} • ₹${c['price'] ?? 0}'),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.data_object, color: Colors.purple),
                  tooltip: 'Edit Dynamic Fields',
                  onPressed: () => _dynamicEditItem(context, 'build_listings', c),
                ),
                IconButton(
                  icon: const Icon(Icons.edit, color: Colors.blue),
                  onPressed: () => _editItem(context, 'build_listings', c),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: () => _confirmDelete('build_listings', c['id'], c['title'] ?? 'this listing'),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildBuildBookingsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: buildBookings.length,
      itemBuilder: (ctx, i) {
        final b = buildBookings[i];
        final listing = b['build_listings'] ?? {};
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.blue.withOpacity(0.1),
              child: const Icon(Icons.handshake, color: Colors.blue, size: 20),
            ),
            title: Text('Booking for ${listing['title'] ?? 'Unknown'}', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('Status: ${b['status']} • ₹${b['total_price']}'),
            trailing: IconButton(
              icon: const Icon(Icons.delete_outline, color: Colors.red),
              onPressed: () => _confirmDelete('bookings', b['id'], 'this booking'),
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

  // ─── PRICING TAB (upgraded to use DB) ─────────────────────────
  Widget _buildPricingTab() {
    if (pricingPlans.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.price_change, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text('No pricing plans found', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 8),
            const Text('Run ALL_NEW_TABLES_RUN_NOW.sql in Supabase to create pricing plans.', style: TextStyle(color: Colors.grey), textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(onPressed: _loadData, child: const Text('Refresh')),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: pricingPlans.length,
      itemBuilder: (ctx, i) {
        final plan = pricingPlans[i];
        final amtCtrl = TextEditingController(text: plan['amount']?.toString() ?? '0');
        final descCtrl = TextEditingController(text: plan['description'] ?? '');
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(plan['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Switch(
                      value: plan['is_active'] ?? true,
                      onChanged: (val) async {
                        await supabaseAdmin.from('pricing_plans').update({'is_active': val}).eq('id', plan['id']);
                        _loadData();
                      },
                    ),
                  ],
                ),
                Text('Feature: ${plan['feature']}', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: amtCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Amount (₹)', border: OutlineInputBorder(), prefixIcon: Icon(Icons.currency_rupee), isDense: true, contentPadding: EdgeInsets.all(10)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: () async {
                        try {
                          await supabaseAdmin.from('pricing_plans').update({'amount': int.tryParse(amtCtrl.text) ?? 0, 'description': descCtrl.text}).eq('id', plan['id']);
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Plan updated!'), backgroundColor: Colors.green));
                          _loadData();
                        } catch (e) {
                          if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                        }
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.black87, foregroundColor: Colors.white),
                      child: const Text('Save'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ─── PAYMENTS TAB ────────────────────────────────────────────────
  Widget _buildPaymentsTab() {
    if (payments.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.receipt_long_outlined, size: 64, color: Colors.grey[300]),
        const SizedBox(height: 12),
        Text('No payments recorded yet.', style: TextStyle(color: Colors.grey[500])),
        const SizedBox(height: 8),
        const Text('Payments will appear here once users pay for features.', textAlign: TextAlign.center),
      ]));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: payments.length,
      itemBuilder: (ctx, i) {
        final p = payments[i];
        final feature = p['feature_label'] ?? p['feature'] ?? 'Unknown';
        final amt = p['amount'] ?? 0;
        final date = p['created_at']?.toString().substring(0, 10) ?? '';
        final email = p['user_email'] ?? '';
        final payId = p['razorpay_payment_id'] ?? '';
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.green.withOpacity(0.1),
              child: const Icon(Icons.currency_rupee, color: Colors.green),
            ),
            title: Row(
              children: [
                Text('₹$amt', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green)),
                const SizedBox(width: 8),
                Expanded(child: Text(feature, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13))),
              ],
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (email.isNotEmpty) Text('User: $email', style: const TextStyle(fontSize: 12)),
                if (payId.isNotEmpty) Text('Razorpay ID: $payId', style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                if ((p['listing_title'] ?? '').toString().isNotEmpty)
                  Text('Listing: ${p['listing_title']}', style: const TextStyle(fontSize: 12)),
              ],
            ),
            trailing: Text(date, style: TextStyle(color: Colors.grey[500], fontSize: 11)),
          ),
        );
      },
    );
  }

  // ─── BANNERS CRUD TAB ────────────────────────────────────────────
  Widget _buildBannersTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: ElevatedButton.icon(
            icon: const Icon(Icons.add),
            label: const Text('Add New Banner'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.black87, foregroundColor: Colors.white),
            onPressed: () => _showBannerDialog(null),
          ),
        ),
        Expanded(
          child: banners.isEmpty
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.campaign_outlined, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 12),
                  Text('No banners yet. Add your first banner!', style: TextStyle(color: Colors.grey[500])),
                ]))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: banners.length,
                  itemBuilder: (ctx, i) {
                    final b = banners[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Column(
                        children: [
                          if ((b['image_url'] ?? '').toString().isNotEmpty)
                            ClipRRect(
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                              child: Image.network(b['image_url'], height: 120, width: double.infinity, fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(height: 60, color: Colors.grey[200], child: const Icon(Icons.image))),
                            ),
                          ListTile(
                            title: Text(b['title'] ?? 'No Title', style: const TextStyle(fontWeight: FontWeight.bold)),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if ((b['subtitle'] ?? '').toString().isNotEmpty) Text(b['subtitle'].toString()),
                                Text('Category: ${b['category'] ?? 'general'}', style: const TextStyle(fontSize: 12)),
                              ],
                            ),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Switch(
                                  value: b['is_active'] ?? true,
                                  onChanged: (val) async {
                                    await supabaseAdmin.from('sponsored_banners').update({'is_active': val}).eq('id', b['id']);
                                    _loadData();
                                  },
                                ),
                                IconButton(icon: const Icon(Icons.edit, color: Colors.blue), onPressed: () => _showBannerDialog(b)),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                                  onPressed: () => _confirmDelete('sponsored_banners', b['id'], b['title'] ?? 'this banner'),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  void _showBannerDialog(Map<String, dynamic>? existing) {
    final titleCtrl = TextEditingController(text: existing?['title'] ?? '');
    final subtitleCtrl = TextEditingController(text: existing?['subtitle'] ?? '');
    final imageCtrl = TextEditingController(text: existing?['image_url'] ?? '');
    final pdfCtrl = TextEditingController(text: existing?['pdf_url'] ?? '');
    final linkCtrl = TextEditingController(text: existing?['link_url'] ?? '');
    String category = existing?['category'] ?? 'general';
    final categories = ['general', 'property', 'food', 'legal'];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(existing == null ? 'Add New Banner' : 'Edit Banner'),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title *', border: OutlineInputBorder())),
                  const SizedBox(height: 12),
                  TextField(controller: subtitleCtrl, decoration: const InputDecoration(labelText: 'Subtitle / Description', border: OutlineInputBorder()), maxLines: 2),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(controller: imageCtrl, decoration: const InputDecoration(labelText: 'Image URL (JPG/PNG)', border: OutlineInputBorder(), helperText: 'Paste Cloudflare R2 URL or upload')),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.upload_file, color: Colors.blue, size: 30),
                        onPressed: () async {
                          final picker = ImagePicker();
                          final xfile = await picker.pickImage(source: ImageSource.gallery);
                          if (xfile != null) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Uploading image to R2...')));
                            final file = File(xfile.path);
                            final fileName = 'banners/banner_${DateTime.now().millisecondsSinceEpoch}.jpg';
                            final url = await R2StorageService.uploadFile(file, fileName);
                            if (url != null) {
                              setS(() => imageCtrl.text = url);
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload successful!')));
                            } else {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload failed')));
                            }
                          }
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(controller: pdfCtrl, decoration: const InputDecoration(labelText: 'PDF URL (optional)', border: OutlineInputBorder(), helperText: 'Brochure, Terms doc etc.')),
                  const SizedBox(height: 12),
                  TextField(controller: linkCtrl, decoration: const InputDecoration(labelText: 'Link URL (optional)', border: OutlineInputBorder())),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: category,
                    decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
                    items: categories.map((c) => DropdownMenuItem(value: c, child: Text(c.toUpperCase()))).toList(),
                    onChanged: (v) => setS(() => category = v ?? 'general'),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.black87, foregroundColor: Colors.white),
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  final data = {
                    'title': titleCtrl.text.trim(),
                    'subtitle': subtitleCtrl.text.trim(),
                    'image_url': imageCtrl.text.trim(),
                    'pdf_url': pdfCtrl.text.trim(),
                    'link_url': linkCtrl.text.trim(),
                    'category': category,
                    'is_active': true,
                  };
                  if (existing == null) {
                    await supabaseAdmin.from('sponsored_banners').insert(data);
                  } else {
                    await supabaseAdmin.from('sponsored_banners').update(data).eq('id', existing['id']);
                  }
                  _loadData();
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(existing == null ? 'Banner added!' : 'Banner updated!'), backgroundColor: Colors.green));
                } catch (e) {
                  if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                }
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  // ─── SEND NOTIFICATION TAB ───────────────────────────────────────
  Widget _buildNotifyTab() {
    final titleCtrl = TextEditingController();
    final bodyCtrl = TextEditingController();
    String targetType = 'all';
    return StatefulBuilder(
      builder: (ctx, setS) => SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Send In-App Notification', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
            const SizedBox(height: 8),
            Text('Send notifications to all users or specific users. These appear in the app\'s notification bell.', style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 24),
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    DropdownButtonFormField<String>(
                      value: targetType,
                      decoration: const InputDecoration(labelText: 'Target', border: OutlineInputBorder()),
                      items: const [
                        DropdownMenuItem(value: 'all', child: Text('All Users')),
                        DropdownMenuItem(value: 'specific', child: Text('Admin Only')),
                      ],
                      onChanged: (v) => setS(() => targetType = v ?? 'all'),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: titleCtrl,
                      decoration: const InputDecoration(labelText: 'Notification Title *', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: bodyCtrl,
                      decoration: const InputDecoration(labelText: 'Notification Body *', border: OutlineInputBorder()),
                      maxLines: 4,
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.send),
                        label: const Text('Send Notification to All Users'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.black87,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        onPressed: () async {
                          if (titleCtrl.text.isEmpty || bodyCtrl.text.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Title and body are required'), backgroundColor: Colors.red));
                            return;
                          }
                          try {
                            // Insert notification for all users
                            for (final user in users) {
                              await supabaseAdmin.from('notifications').insert({
                                'user_id': user['id'],
                                'title': titleCtrl.text.trim(),
                                'body': bodyCtrl.text.trim(),
                                'type': 'admin_broadcast',
                              });
                            }
                            if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                              content: Text('Notification sent to ${users.length} users!'),
                              backgroundColor: Colors.green,
                            ));
                            titleCtrl.clear();
                            bodyCtrl.clear();
                          } catch (e) {
                            if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
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
