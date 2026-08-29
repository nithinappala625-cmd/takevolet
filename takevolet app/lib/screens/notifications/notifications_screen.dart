import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timeago/timeago.dart' as timeago;

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
  }

  Future<void> _fetchNotifications() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        setState(() => _isLoading = false);
        return;
      }

      final response = await _supabase
          .from('notifications')
          .select()
          .eq('profile_id', user.id)
          .order('created_at', ascending: false)
          .limit(100);

      if (mounted) {
        setState(() {
          _notifications = List<Map<String, dynamic>>.from(response);
          _isLoading = false;
        });
      }

      // Mark all as read
      await _supabase
          .from('notifications')
          .update({'is_read': true})
          .eq('profile_id', user.id)
          .eq('is_read', false);
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _deleteNotification(String id) async {
    try {
      await _supabase.from('notifications').delete().eq('id', id);
      setState(() => _notifications.removeWhere((n) => n['id'] == id));
    } catch (_) {}
  }

  Future<void> _clearAll() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;
    try {
      await _supabase.from('notifications').delete().eq('profile_id', user.id);
      setState(() => _notifications.clear());
    } catch (_) {}
  }

  IconData _getIconForType(String type) {
    switch (type.toLowerCase()) {
      case 'room': return Icons.meeting_room;
      case 'flatmate': return Icons.people;
      case 'cook': case 'chef': case 'food_listing': return Icons.restaurant_menu;
      case 'flat': case 'sale': case 'property_listing': return Icons.apartment;
      case 'feed': case 'requirement': return Icons.campaign;
      case 'payment': return Icons.currency_rupee;
      case 'admin_broadcast': return Icons.admin_panel_settings;
      case 'top_project': return Icons.star;
      case 'legal_partner': return Icons.gavel;
      case 'contact_unlock': return Icons.lock_open;
      default: return Icons.notifications;
    }
  }

  Color _getColorForType(String type) {
    switch (type.toLowerCase()) {
      case 'room': return Colors.blue;
      case 'flatmate': return Colors.orange;
      case 'cook': case 'chef': case 'food_listing': return Colors.green;
      case 'flat': case 'sale': case 'property_listing': return Colors.purple;
      case 'payment': return Colors.teal;
      case 'admin_broadcast': return const Color(0xFFD4AF37);
      case 'top_project': return Colors.amber;
      case 'legal_partner': return Colors.indigo;
      case 'contact_unlock': return Colors.cyan;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = _notifications.where((n) => n['is_read'] == false).length;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Row(children: [
          const Text('Notifications', style: TextStyle(fontWeight: FontWeight.bold)),
          if (unread > 0) ...[ 
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(12)),
              child: Text('$unread new', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
          ],
        ]),
        backgroundColor: Colors.white,
        elevation: 1,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: () {
            setState(() => _isLoading = true);
            _fetchNotifications();
          }),
          if (_notifications.isNotEmpty)
            TextButton(onPressed: _clearAll, child: const Text('Clear All', style: TextStyle(color: Colors.red, fontSize: 12))),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? _buildEmptyState()
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  itemCount: _notifications.length,
                  separatorBuilder: (context, index) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final n = _notifications[index];
                    final createdAt = DateTime.tryParse(n['created_at'] ?? '') ?? DateTime.now();
                    final type = n['type'] ?? 'general';
                    final isUnread = n['is_read'] == false;
                    final color = _getColorForType(type);

                    return Dismissible(
                      key: Key(n['id'] ?? index.toString()),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 20),
                        color: Colors.red,
                        child: const Icon(Icons.delete, color: Colors.white),
                      ),
                      onDismissed: (_) => _deleteNotification(n['id'] ?? ''),
                      child: Container(
                        color: isUnread ? color.withOpacity(0.05) : Colors.white,
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                          leading: Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.12),
                              shape: BoxShape.circle,
                              border: Border.all(color: color.withOpacity(0.3), width: 1.5),
                            ),
                            child: Icon(_getIconForType(type), color: color, size: 22),
                          ),
                          title: Row(children: [
                            Expanded(child: Text(
                              n['title'] ?? 'New Notification',
                              style: TextStyle(fontWeight: isUnread ? FontWeight.bold : FontWeight.w600, fontSize: 15),
                            )),
                            if (isUnread)
                              Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle)),
                          ]),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text(
                                n['body'] ?? n['message'] ?? '',
                                style: TextStyle(color: Colors.grey[700], height: 1.4, fontSize: 13),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                timeago.format(createdAt.toLocal()),
                                style: TextStyle(color: color.withOpacity(0.8), fontSize: 11, fontWeight: FontWeight.w600),
                              ),
                            ]),
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 100, height: 100,
            decoration: BoxDecoration(color: Colors.grey[100], shape: BoxShape.circle),
            child: Icon(Icons.notifications_off_outlined, size: 50, color: Colors.grey[400]),
          ),
          const SizedBox(height: 24),
          Text('All caught up!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.grey[800])),
          const SizedBox(height: 8),
          Text('No notifications yet.\nNew listings, payments, and updates will appear here.', 
            style: TextStyle(fontSize: 14, color: Colors.grey[500], height: 1.5), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}
