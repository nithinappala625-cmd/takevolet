import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../main.dart';

class UnlockHistoryScreen extends StatefulWidget {
  const UnlockHistoryScreen({super.key});

  @override
  State<UnlockHistoryScreen> createState() => _UnlockHistoryScreenState();
}

class _UnlockHistoryScreenState extends State<UnlockHistoryScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool isLoading = true;

  List<Map<String, dynamic>> myUnlocks = [];
  List<Map<String, dynamic>> unlockedByOthers = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) {
      setState(() => isLoading = false);
      return;
    }

    try {
      // Tab 1: Contacts I unlocked
      final unlocks = await supabase
          .from('contact_unlocks')
          .select('*, rooms(title, images, location, rent, user_id)')
          .eq('user_id', userId)
          .order('created_at', ascending: false);

      // For each unlock, fetch the poster's profile
      final List<Map<String, dynamic>> enrichedUnlocks = [];
      for (final u in (unlocks as List)) {
        final Map<String, dynamic> unlock = Map<String, dynamic>.from(u);
        try {
          final room = unlock['rooms'];
          if (room != null && room['user_id'] != null) {
            final profile = await supabase
                .from('profiles')
                .select('full_name, phone, whatsapp, avatar_url')
                .eq('id', room['user_id'])
                .single();
            unlock['poster_profile'] = profile;
          }
        } catch (_) {}
        enrichedUnlocks.add(unlock);
      }

      // Tab 2: People who unlocked my rooms
      List<Map<String, dynamic>> othersUnlocks = [];
      try {
        final myRooms = await supabase.from('rooms').select('id').eq('user_id', userId);
        final roomIds = (myRooms as List).map((r) => r['id'] as String).toList();
        if (roomIds.isNotEmpty) {
          final results = await supabase
              .from('contact_unlocks')
              .select('*, rooms(title)')
              .inFilter('room_id', roomIds)
              .order('created_at', ascending: false);

          for (final r in (results as List)) {
            final Map<String, dynamic> entry = Map<String, dynamic>.from(r);
            try {
              final seekerProfile = await supabase
                  .from('profiles')
                  .select('full_name, phone, avatar_url')
                  .eq('id', entry['user_id'])
                  .single();
              entry['seeker_profile'] = seekerProfile;
            } catch (_) {}
            othersUnlocks.add(entry);
          }
        }
      } catch (_) {}

      setState(() {
        myUnlocks = enrichedUnlocks;
        unlockedByOthers = othersUnlocks;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Unlock History', style: TextStyle(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFD4AF37),
          labelColor: const Color(0xFFD4AF37),
          unselectedLabelColor: Colors.grey,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'My Unlocks'),
            Tab(text: 'Who Unlocked Me'),
          ],
        ),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildMyUnlocksTab(),
                _buildUnlockedByOthersTab(),
              ],
            ),
    );
  }

  Widget _buildMyUnlocksTab() {
    if (myUnlocks.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.lock_outline, size: 64, color: Colors.grey[300]),
        const SizedBox(height: 12),
        Text('No contacts unlocked yet', style: TextStyle(color: Colors.grey[500], fontSize: 16)),
        const SizedBox(height: 4),
        Text('Unlock a room or flatmate to see contacts here', style: TextStyle(color: Colors.grey[400], fontSize: 13)),
      ]));
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: myUnlocks.length,
        itemBuilder: (ctx, i) {
          final unlock = myUnlocks[i];
          final room = unlock['rooms'] as Map<String, dynamic>?;
          final poster = unlock['poster_profile'] as Map<String, dynamic>?;
          final images = (room?['images'] as List<dynamic>?)?.cast<String>() ?? [];
          final title = room?['title'] ?? 'Room';
          final posterName = poster?['full_name'] ?? 'Owner';
          final phone = poster?['phone'] ?? '';
          final whatsapp = poster?['whatsapp'] ?? phone;
          final date = unlock['created_at']?.substring(0, 10) ?? '';

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2))],
            ),
            child: Column(children: [
              ListTile(
                contentPadding: const EdgeInsets.all(14),
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: SizedBox(
                    width: 56, height: 56,
                    child: images.isNotEmpty
                        ? Image.network(images.first, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: Colors.grey[200], child: const Icon(Icons.home)))
                        : Container(color: Colors.grey[200], child: const Icon(Icons.home, color: Colors.grey)),
                  ),
                ),
                title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const SizedBox(height: 4),
                  Row(children: [
                    const Icon(Icons.person, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(posterName, style: TextStyle(color: Colors.grey[700], fontSize: 13)),
                  ]),
                  Row(children: [
                    const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(date, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                  ]),
                ]),
              ),
              if (phone.isNotEmpty)
                Container(
                  padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                  child: Row(children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => launchUrl(Uri.parse('tel:$phone')),
                        icon: const Icon(Icons.call, size: 16, color: Colors.green),
                        label: Text(phone, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.green,
                          side: const BorderSide(color: Colors.green),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      height: 40,
                      child: ElevatedButton.icon(
                        onPressed: whatsapp.isNotEmpty
                            ? () => launchUrl(Uri.parse('https://wa.me/${whatsapp.replaceAll(RegExp(r'[^\d]'), '')}'))
                            : null,
                        icon: const Icon(Icons.message, size: 16),
                        label: const Text('WhatsApp', style: TextStyle(fontSize: 12)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF25D366),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ]),
                ),
            ]),
          );
        },
      ),
    );
  }

  Widget _buildUnlockedByOthersTab() {
    if (unlockedByOthers.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.people_outline, size: 64, color: Colors.grey[300]),
        const SizedBox(height: 12),
        Text('No one has unlocked your contact yet', style: TextStyle(color: Colors.grey[500], fontSize: 16)),
        const SizedBox(height: 4),
        Text('Post a room to start getting contacts', style: TextStyle(color: Colors.grey[400], fontSize: 13)),
      ]));
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: unlockedByOthers.length,
        itemBuilder: (ctx, i) {
          final entry = unlockedByOthers[i];
          final seeker = entry['seeker_profile'] as Map<String, dynamic>?;
          final roomTitle = (entry['rooms'] as Map<String, dynamic>?)?['title'] ?? 'Your Room';
          final seekerName = seeker?['full_name'] ?? 'Someone';
          final seekerPhone = seeker?['phone'] ?? '';
          final date = entry['created_at']?.substring(0, 10) ?? '';
          final amount = entry['amount'] ?? 0;

          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              contentPadding: const EdgeInsets.all(14),
              leading: CircleAvatar(
                backgroundColor: Colors.green.withOpacity(0.1),
                backgroundImage: seeker?['avatar_url'] != null ? NetworkImage(seeker!['avatar_url']) : null,
                child: seeker?['avatar_url'] == null
                    ? Text(seekerName.isNotEmpty ? seekerName[0].toUpperCase() : 'S',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green))
                    : null,
              ),
              title: Text(seekerName, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Unlocked: $roomTitle', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                Text('$date • ₹$amount', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
              ]),
              isThreeLine: true,
              trailing: seekerPhone.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.call, color: Colors.green),
                      onPressed: () => launchUrl(Uri.parse('tel:$seekerPhone')),
                    )
                  : null,
            ),
          );
        },
      ),
    );
  }
}
