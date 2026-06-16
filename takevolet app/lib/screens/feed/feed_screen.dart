import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:go_router/go_router.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  bool isLoading = true;
  List<Map<String, dynamic>> requirements = [];
  String? _currentUserAvatar;

  @override
  void initState() {
    super.initState();
    _fetchRequirements();
  }

  Future<void> _fetchRequirements() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        try {
          final p = await Supabase.instance.client.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle();
          if (p != null) _currentUserAvatar = p['avatar_url'];
        } catch (_) {}
      }

      final reqs = await Supabase.instance.client
          .from('requirements')
          .select()
          .order('created_at', ascending: false);
          
      // Fetch avatars manually to avoid join issues
      List<Map<String, dynamic>> finalReqs = List<Map<String, dynamic>>.from(reqs);
      if (finalReqs.isNotEmpty) {
        final userIds = finalReqs.map((e) => e['user_id']).where((id) => id != null).toSet().toList();
        if (userIds.isNotEmpty) {
          try {
            final profiles = await Supabase.instance.client.from('profiles').select('id, full_name, avatar_url').inFilter('id', userIds);
            final profileMap = { for (var p in profiles) p['id']: p };
            for (var r in finalReqs) {
              final pid = r['user_id'];
              if (profileMap.containsKey(pid)) {
                r['avatar_url'] = profileMap[pid]?['avatar_url'];
                r['name'] = profileMap[pid]?['full_name'] ?? r['name'];
              }
            }
          } catch (_) {}
        }
      }

      setState(() {
        requirements = finalReqs;
        isLoading = false;
      });
    } catch (e) {
      debugPrint('Error fetching requirements: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text('Community Feed', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        centerTitle: true,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchRequirements,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 0),
                itemCount: requirements.isEmpty ? 2 : requirements.length + 1,
                itemBuilder: (context, index) {
                  if (index == 0) return _buildPostingBar();
                  if (requirements.isEmpty) {
                    return _buildEmptyState();
                  }
                  return _buildFeedCard(requirements[index - 1]);
                },
              ),
            ),
    );
  }

  Widget _buildPostingBar() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: Colors.grey.shade200,
            backgroundImage: _currentUserAvatar != null ? NetworkImage(_currentUserAvatar!) : null,
            child: _currentUserAvatar == null ? const Icon(Icons.person, color: Colors.grey) : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: InkWell(
              onTap: () {
                context.push('/add-requirement');
              },
              borderRadius: BorderRadius.circular(24),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Text('Post your requirements...', style: TextStyle(color: Colors.grey.shade600)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Padding(
      padding: const EdgeInsets.only(top: 80.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.feed_outlined, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text('No requirements posted yet', 
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.grey.shade700)
          ),
          const SizedBox(height: 8),
          Text('Be the first to post your requirements!', 
            style: TextStyle(color: Colors.grey.shade500)
          ),
        ],
      ),
    );
  }

  Widget _buildFeedCard(Map<String, dynamic> req) {
    final name = req['name'] ?? 'Unknown';
    final location = req['preferred_locations'] ?? 'Any location';
    final budget = req['budget'] ?? 'Negotiable';
    final furnished = req['furnished_type'] ?? 'Any';
    final description = req['description'] ?? '';
    final createdAtStr = req['created_at'];
    
    String timeAgo = '';
    if (createdAtStr != null) {
      try {
        final date = DateTime.parse(createdAtStr);
        timeAgo = timeago.format(date);
      } catch (_) {}
    }

    final avatarUrl = req['avatar_url'];

    final contactNumber = req['contact_number'] ?? '';
    final roomType = req['room_type'] ?? 'Any';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            spreadRadius: 0,
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(color: Colors.grey.shade200, width: 1),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.white, Color(0xFFFDFDFD)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Avatar + Name + Time
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(color: const Color(0xFFD4AF37).withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 2))
                      ],
                    ),
                    child: CircleAvatar(
                      radius: 22,
                      backgroundColor: Colors.white,
                      backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                      child: avatarUrl == null 
                          ? Text(
                              name.isNotEmpty ? name[0].toUpperCase() : 'U',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFD4AF37), fontSize: 20),
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 17, color: Colors.black87)),
                        const SizedBox(height: 2),
                        if (timeAgo.isNotEmpty)
                          Row(
                            children: [
                              Icon(Icons.access_time, size: 12, color: Colors.grey.shade500),
                              const SizedBox(width: 4),
                              Text(timeAgo, style: TextStyle(color: Colors.grey.shade500, fontSize: 13, fontWeight: FontWeight.w500)),
                            ],
                          ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [Colors.blue.shade400, Colors.blue.shade600]),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.3), blurRadius: 4, offset: const Offset(0, 2))],
                    ),
                    child: const Text('Looking for Room', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              
              // Description
              if (description.isNotEmpty) ...[
                Text(description, style: TextStyle(fontSize: 15, height: 1.5, color: Colors.grey.shade800)),
                const SizedBox(height: 20),
              ],

              // Details tags
              Wrap(
                spacing: 8,
                runSpacing: 10,
                children: [
                  _buildTag(Icons.location_on_rounded, location, Colors.red),
                  _buildTag(Icons.currency_rupee_rounded, budget, Colors.green),
                  _buildTag(Icons.chair_rounded, furnished, Colors.orange),
                  _buildTag(Icons.house_siding_rounded, roomType, Colors.purple),
                  if (contactNumber.isNotEmpty)
                    _buildTag(Icons.phone_rounded, contactNumber, Colors.teal),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTag(IconData icon, String text, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color.shade700),
          const SizedBox(width: 6),
          Text(text, style: TextStyle(color: color.shade800, fontSize: 13, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
