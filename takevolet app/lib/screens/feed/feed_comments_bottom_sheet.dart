import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timeago/timeago.dart' as timeago;

class FeedCommentsBottomSheet extends StatefulWidget {
  final String postId;
  final String? currentUserId;

  const FeedCommentsBottomSheet({super.key, required this.postId, this.currentUserId});

  @override
  State<FeedCommentsBottomSheet> createState() => _FeedCommentsBottomSheetState();
}

class _FeedCommentsBottomSheetState extends State<FeedCommentsBottomSheet> {
  List<Map<String, dynamic>> comments = [];
  bool isLoading = true;
  final TextEditingController _commentController = TextEditingController();
  bool isPosting = false;

  @override
  void initState() {
    super.initState();
    _fetchComments();
  }

  Future<void> _fetchComments() async {
    try {
      final res = await Supabase.instance.client
          .from('social_comments')
          .select('*, profiles:user_id(full_name, avatar_url, email)')
          .eq('post_id', widget.postId)
          .order('created_at', ascending: true);
          
      setState(() {
        comments = List<Map<String, dynamic>>.from(res);
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  Future<void> _postComment() async {
    if (_commentController.text.trim().isEmpty) return;
    if (widget.currentUserId == null) return;
    
    setState(() => isPosting = true);
    try {
      await Supabase.instance.client.from('social_comments').insert({
        'post_id': widget.postId,
        'user_id': widget.currentUserId!,
        'comment_text': _commentController.text.trim(),
      });
      
      // Trigger In-App Notification to Post Owner
      try {
        final postData = await Supabase.instance.client
            .from('social_posts')
            .select('user_id')
            .eq('id', widget.postId)
            .maybeSingle();
            
        if (postData != null && postData['user_id'] != widget.currentUserId) {
           final profileData = await Supabase.instance.client
              .from('profiles')
              .select('full_name')
              .eq('id', widget.currentUserId!)
              .maybeSingle();
           final commenterName = profileData?['full_name'] ?? 'Someone';
           
           await Supabase.instance.client.from('notifications').insert({
              'profile_id': postData['user_id'],
              'title': 'New Comment',
              'body': '$commenterName commented on your post.',
              'type': 'feed',
           });
        }
      } catch (_) {}

      _commentController.clear();
      await _fetchComments();
    } catch (e) {
      debugPrint('Error posting comment: $e');
    } finally {
      setState(() => isPosting = false);
    }
  }

  void _deleteComment(String commentId) async {
    try {
      await Supabase.instance.client.from('social_comments').delete().eq('id', commentId);
      _fetchComments();
    } catch (e) {
      debugPrint('Error deleting: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            height: 5, width: 40,
            decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
          ),
          const Text('Comments', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const Divider(),
          
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : comments.isEmpty
                    ? Center(child: Text('No comments yet.', style: TextStyle(color: Colors.grey.shade600)))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        itemCount: comments.length,
                        itemBuilder: (context, index) {
                          final c = comments[index];
                          final p = c['profiles'] ?? {};
                          final name = p['full_name'] ?? 'Unknown';
                          final avatar = p['avatar_url'];
                          final cEmail = p['email'] ?? '';
                          final timeStr = c['created_at'];
                          String timeAgo = '';
                          if (timeStr != null) {
                            try {
                              timeAgo = timeago.format(DateTime.parse(timeStr));
                            } catch (_) {}
                          }

                          final currentUserEmail = Supabase.instance.client.auth.currentUser?.email;
                          final isAdmin = currentUserEmail == 'nithinappala625@gmail.com' || currentUserEmail == 'nithinpatel2025@gmail.com';
                          final canDelete = isAdmin || widget.currentUserId == c['user_id'];

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                CircleAvatar(
                                  radius: 16,
                                  backgroundImage: avatar != null ? NetworkImage(avatar) : null,
                                  backgroundColor: Colors.grey.shade300,
                                  child: avatar == null ? const Icon(Icons.person, size: 20, color: Colors.white) : null,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        decoration: BoxDecoration(
                                          color: Colors.grey.shade100,
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                            const SizedBox(height: 4),
                                            Text(c['comment_text'] ?? '', style: const TextStyle(fontSize: 14)),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Padding(
                                        padding: const EdgeInsets.only(left: 12),
                                        child: Row(
                                          children: [
                                            Text(timeAgo, style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                                            if (canDelete) ...[
                                              const SizedBox(width: 16),
                                              GestureDetector(
                                                onTap: () => _deleteComment(c['id']),
                                                child: Text('Delete', style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.bold)),
                                              )
                                            ]
                                          ],
                                        ),
                                      )
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
          
          // Comment input
          Container(
            padding: EdgeInsets.only(left: 16, right: 16, top: 12, bottom: MediaQuery.of(context).viewInsets.bottom + 12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _commentController,
                    decoration: InputDecoration(
                      hintText: 'Add a comment...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _postComment(),
                  ),
                ),
                const SizedBox(width: 8),
                isPosting 
                    ? const Padding(padding: EdgeInsets.all(12), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)))
                    : IconButton(
                        icon: const Icon(Icons.send, color: Color(0xFFD4AF37)),
                        onPressed: _postComment,
                      )
              ],
            ),
          )
        ],
      ),
    );
  }
}
