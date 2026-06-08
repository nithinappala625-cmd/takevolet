import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../main.dart';
import '../add_room/add_room_screen.dart';
import '../add_flatmate/add_flatmate_screen.dart';
import '../add_item/add_item_screen.dart';
import '../../utils/image_utils.dart';

class UserDashboardScreen extends StatefulWidget {
  const UserDashboardScreen({super.key});

  @override
  State<UserDashboardScreen> createState() => _UserDashboardScreenState();
}

class _UserDashboardScreenState extends State<UserDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;

  // Local data lists — never cleared on toggle
  List<Map<String, dynamic>> _rooms = [];
  List<Map<String, dynamic>> _flatmates = [];
  List<Map<String, dynamic>> _items = [];

  // Use service role client to bypass RLS for status updates
  final SupabaseClient _adminClient = SupabaseClient(
    'https://vwcqovrbvhztpkultqjl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Y3FvdnJidmh6dHBrdWx0cWpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyMDYwOCwiZXhwIjoyMDkzMzk2NjA4fQ.5OKsvAVnHSqhk_wsddohOgbsNhJS1u2oOC1UXWseLn8',
  );

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadAll();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() => _isLoading = true);
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) { setState(() => _isLoading = false); return; }

    try {
      final rooms = await _adminClient.from('rooms').select().eq('user_id', userId).order('created_at', ascending: false);
      final flatmates = await _adminClient.from('flatmates').select().eq('user_id', userId).order('created_at', ascending: false);
      final items = await _adminClient.from('items').select().eq('user_id', userId).order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _rooms = List<Map<String, dynamic>>.from(rooms as List);
          _flatmates = List<Map<String, dynamic>>.from(flatmates as List);
          _items = List<Map<String, dynamic>>.from(items as List);
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Load error: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Listings', style: TextStyle(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFD4AF37),
          labelColor: const Color(0xFFD4AF37),
          unselectedLabelColor: Colors.grey,
          tabs: const [
            Tab(text: 'Rooms'),
            Tab(text: 'Flatmates'),
            Tab(text: 'Items'),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadAll),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildList(_rooms, 'rooms', Icons.home),
                _buildList(_flatmates, 'flatmates', Icons.people),
                _buildList(_items, 'items', Icons.shopping_bag),
              ],
            ),
    );
  }

  Widget _buildList(List<Map<String, dynamic>> data, String table, IconData icon) {
    if (data.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 64, color: Colors.grey[300]),
        const SizedBox(height: 12),
        Text('No $table listed yet', style: TextStyle(color: Colors.grey[500])),
        const SizedBox(height: 8),
        TextButton.icon(onPressed: _loadAll, icon: const Icon(Icons.refresh), label: const Text('Refresh')),
      ]));
    }

    return RefreshIndicator(
      onRefresh: _loadAll,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: data.length,
        itemBuilder: (context, index) {
          final item = data[index];
          final thumbnailUrl = ImageUtils.getThumbnail(item);
          final isAvailable = item['is_available'] as bool? ?? true;

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image
                SizedBox(
                  height: 160,
                  width: double.infinity,
                  child: Stack(
                    children: [
                      Positioned.fill(
                        child: thumbnailUrl != null
                            ? CachedNetworkImage(
                                imageUrl: thumbnailUrl,
                                fit: BoxFit.cover,
                                errorWidget: (_, __, ___) => Container(color: Colors.grey[200], child: Icon(icon, size: 50, color: Colors.grey)),
                              )
                            : Container(color: Colors.grey[200], child: Icon(icon, size: 50, color: Colors.grey)),
                      ),
                      // Status overlay
                      if (table != 'items' && !isAvailable)
                        Positioned.fill(
                          child: Container(
                            color: Colors.black.withOpacity(0.45),
                            child: Center(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                decoration: BoxDecoration(color: Colors.red.shade700, borderRadius: BorderRadius.circular(8)),
                                child: const Text('RENTED OUT', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 2)),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(child: Text(item['title'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17), maxLines: 1, overflow: TextOverflow.ellipsis)),
                          if (item['rent'] != null || item['price'] != null)
                            Text('₹${item['rent'] ?? item['price']}', style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 16)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(children: [
                        const Icon(Icons.location_on, color: Colors.grey, size: 14),
                        const SizedBox(width: 4),
                        Expanded(child: Text(item['location'] ?? 'Location N/A', style: const TextStyle(color: Colors.grey, fontSize: 13), overflow: TextOverflow.ellipsis)),
                      ]),
                      const SizedBox(height: 12),
                      const Divider(height: 1),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          // Available / Rented toggle — ONLY updates status
                          if (table != 'items') ...[
                            GestureDetector(
                              onTap: () => _toggleStatus(table, index, item['id'], !isAvailable),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                decoration: BoxDecoration(
                                  color: isAvailable ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: isAvailable ? Colors.green : Colors.red),
                                ),
                                child: Row(mainAxisSize: MainAxisSize.min, children: [
                                  Icon(isAvailable ? Icons.check_circle : Icons.cancel, size: 16, color: isAvailable ? Colors.green : Colors.red),
                                  const SizedBox(width: 6),
                                  Text(isAvailable ? 'Available' : 'Rented Out', style: TextStyle(color: isAvailable ? Colors.green : Colors.red, fontWeight: FontWeight.bold, fontSize: 12)),
                                ]),
                              ),
                            ),
                          ],
                          const Spacer(),
                          // Edit
                          InkWell(
                            onTap: () => _editItem(context, table, item),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                              decoration: BoxDecoration(color: Colors.blue.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
                              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                                Icon(Icons.edit, size: 16, color: Colors.blue),
                                SizedBox(width: 4),
                                Text('Edit', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.w600, fontSize: 13)),
                              ]),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Delete — with confirmation dialog
                          InkWell(
                            onTap: () => _deleteItem(context, table, item['id'], index),
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                              decoration: BoxDecoration(color: Colors.red.withOpacity(0.08), borderRadius: BorderRadius.circular(8)),
                              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                                Icon(Icons.delete_outline, size: 16, color: Colors.red),
                                SizedBox(width: 4),
                                Text('Delete', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600, fontSize: 13)),
                              ]),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ─── TOGGLE STATUS (NEVER DELETES) ─────────────────────────────
  Future<void> _toggleStatus(String table, int index, dynamic id, bool newValue) async {
    // Immediately update local state for instant UI response
    setState(() {
      if (table == 'rooms') _rooms[index] = {..._rooms[index], 'is_available': newValue};
      if (table == 'flatmates') _flatmates[index] = {..._flatmates[index], 'is_available': newValue};
    });

    try {
      await _adminClient.from(table).update({'is_available': newValue}).eq('id', id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(newValue ? '✅ Marked as Available' : '🔴 Marked as Rented Out'),
          backgroundColor: newValue ? Colors.green : Colors.red,
          duration: const Duration(seconds: 2),
        ));
      }
    } catch (e) {
      // Revert local state if update failed
      setState(() {
        if (table == 'rooms') _rooms[index] = {..._rooms[index], 'is_available': !newValue};
        if (table == 'flatmates') _flatmates[index] = {..._flatmates[index], 'is_available': !newValue};
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed to update status: $e'),
          backgroundColor: Colors.red,
        ));
      }
    }
  }

  // ─── EDIT ───────────────────────────────────────────────────────
  Future<void> _editItem(BuildContext context, String table, Map<String, dynamic> item) async {
    Widget? targetScreen;
    if (table == 'rooms') targetScreen = AddRoomScreen(initialData: item);
    else if (table == 'flatmates') targetScreen = AddFlatmateScreen(initialData: item);
    else if (table == 'items') targetScreen = AddItemScreen(initialData: item);

    if (targetScreen != null) {
      await Navigator.push(context, MaterialPageRoute(builder: (_) => targetScreen!));
      _loadAll(); // Reload after edit
    }
  }

  // ─── DELETE (with confirmation) ─────────────────────────────────
  Future<void> _deleteItem(BuildContext context, String table, dynamic id, int index) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('⚠️ Confirm Delete'),
        content: const Text('This will permanently delete this listing.\nAre you sure? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await _adminClient.from(table).delete().eq('id', id);
        setState(() {
          if (table == 'rooms') _rooms.removeAt(index);
          if (table == 'flatmates') _flatmates.removeAt(index);
          if (table == 'items') _items.removeAt(index);
        });
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Listing deleted'), backgroundColor: Colors.green));
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Delete failed: $e'), backgroundColor: Colors.red));
      }
    }
  }
}
