import os

FEED_SCREEN_CONTENT = """import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../services/r2_storage_service.dart';
import 'feed_comments_bottom_sheet.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  bool isLoading = true;
  List<Map<String, dynamic>> posts = [];
  String? _currentUserAvatar;
  String? _currentUserEmail;
  String? _currentUserId;

  final TextEditingController _postController = TextEditingController();
  File? _selectedImage;
  bool _isPosting = false;

  @override
  void initState() {
    super.initState();
    _fetchPosts();
  }

  Future<void> _fetchPosts() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        _currentUserId = user.id;
        _currentUserEmail = user.email;
        try {
          final p = await Supabase.instance.client.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle();
          if (p != null) _currentUserAvatar = p['avatar_url'];
        } catch (_) {}
      }

      // Fetch posts
      final res = await Supabase.instance.client
          .from('social_posts')
          .select('*, profiles:user_id(full_name, avatar_url, email)')
          .order('created_at', ascending: false);
          
      // Fetch likes count and user like status manually since no direct join is easy without rpc
      final likesRes = await Supabase.instance.client.from('social_likes').select('post_id, user_id');
      final commentsRes = await Supabase.instance.client.from('social_comments').select('post_id, id');

      List<Map<String, dynamic>> parsedPosts = List<Map<String, dynamic>>.from(res);
      
      for (var post in parsedPosts) {
        final postId = post['id'];
        
        final postLikes = likesRes.where((l) => l['post_id'] == postId).toList();
        post['like_count'] = postLikes.length;
        post['is_liked'] = postLikes.any((l) => l['user_id'] == _currentUserId);
        
        final postComments = commentsRes.where((c) => c['post_id'] == postId).toList();
        post['comment_count'] = postComments.length;
      }

      setState(() {
        posts = parsedPosts;
        isLoading = false;
      });
    } catch (e) {
      debugPrint('Error fetching posts: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  Future<void> _submitPost() async {
    if (_postController.text.trim().isEmpty && _selectedImage == null) return;

    if (_currentUserId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please login to post.')));
      return;
    }

    setState(() => _isPosting = true);

    try {
      String? imageUrl;
      if (_selectedImage != null) {
        final fileName = '${DateTime.now().millisecondsSinceEpoch}_${_selectedImage!.path.split('/').last}';
        imageUrl = await R2StorageService.uploadFile(_selectedImage!, 'Takevolet/social/$fileName');
      }

      await Supabase.instance.client.from('social_posts').insert({
        'user_id': _currentUserId,
        'content': _postController.text.trim(),
        'image_url': imageUrl,
      });

      _postController.clear();
      setState(() {
        _selectedImage = null;
      });
      await _fetchPosts();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to post: $e')));
    } finally {
      setState(() => _isPosting = false);
    }
  }

  Future<void> _toggleLike(String postId, bool isCurrentlyLiked) async {
    if (_currentUserId == null) return;

    // Optimistic UI update
    setState(() {
      final post = posts.firstWhere((p) => p['id'] == postId);
      post['is_liked'] = !isCurrentlyLiked;
      post['like_count'] += isCurrentlyLiked ? -1 : 1;
    });

    try {
      if (isCurrentlyLiked) {
        await Supabase.instance.client.from('social_likes').delete().eq('post_id', postId).eq('user_id', _currentUserId!);
      } else {
        await Supabase.instance.client.from('social_likes').insert({'post_id': postId, 'user_id': _currentUserId!});
      }
    } catch (e) {
      _fetchPosts(); // revert on failure
    }
  }

  void _showComments(String postId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FeedCommentsBottomSheet(postId: postId, currentUserId: _currentUserId),
    ).then((_) => _fetchPosts());
  }

  void _deletePost(String postId) async {
    bool confirm = await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Post'),
        content: const Text('Are you sure you want to delete this post?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      )
    ) ?? false;

    if (confirm) {
      try {
        await Supabase.instance.client.from('social_posts').delete().eq('id', postId);
        _fetchPosts();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to delete: $e')));
      }
    }
  }

  void _editPost(Map<String, dynamic> post) {
    final editController = TextEditingController(text: post['content'] ?? '');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Post'),
        content: TextField(
          controller: editController,
          maxLines: 4,
          decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Update your post...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await Supabase.instance.client.from('social_posts').update({'content': editController.text.trim(), 'updated_at': DateTime.now().toIso8601String()}).eq('id', post['id']);
                _fetchPosts();
              } catch (e) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to edit: $e')));
              }
            },
            child: const Text('Save'),
          ),
        ],
      )
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade200,
      appBar: AppBar(
        title: const Text('Community Feed', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 1,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        centerTitle: true,
      ),
      body: Column(
        children: [
          _buildComposer(),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                    onRefresh: _fetchPosts,
                    child: ListView.builder(
                      padding: const EdgeInsets.only(top: 8, bottom: 20),
                      itemCount: posts.isEmpty ? 1 : posts.length,
                      itemBuilder: (context, index) {
                        if (posts.isEmpty) return _buildEmptyState();
                        return _buildFeedCard(posts[index]);
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildComposer() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                backgroundColor: Colors.grey.shade200,
                backgroundImage: _currentUserAvatar != null ? NetworkImage(_currentUserAvatar!) : null,
                child: _currentUserAvatar == null ? const Icon(Icons.person, color: Colors.grey) : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextField(
                  controller: _postController,
                  maxLines: null,
                  decoration: const InputDecoration(
                    hintText: 'Share something with the community...',
                    border: InputBorder.none,
                  ),
                ),
              ),
            ],
          ),
          if (_selectedImage != null)
            Stack(
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 10, left: 52),
                  height: 150,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    image: DecorationImage(image: FileImage(_selectedImage!), fit: BoxFit.cover),
                  ),
                ),
                Positioned(
                  top: 15, right: 5,
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedImage = null),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                      child: const Icon(Icons.close, color: Colors.white, size: 18),
                    ),
                  ),
                )
              ],
            ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                onPressed: _pickImage,
                icon: const Icon(Icons.image, color: Colors.green),
                label: const Text('Photo', style: TextStyle(color: Colors.black87)),
              ),
              ElevatedButton(
                onPressed: _isPosting ? null : _submitPost,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFD4AF37),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 0),
                ),
                child: _isPosting 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Post', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              )
            ],
          )
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
          Icon(Icons.forum_outlined, size: 80, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text('No posts yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.grey.shade700)),
          const SizedBox(height: 8),
          Text('Be the first to share something!', style: TextStyle(color: Colors.grey.shade500)),
        ],
      ),
    );
  }

  Widget _buildFeedCard(Map<String, dynamic> post) {
    final profiles = post['profiles'] ?? {};
    final name = profiles['full_name'] ?? 'Unknown';
    final avatarUrl = profiles['avatar_url'];
    final postEmail = profiles['email'] ?? '';
    
    final content = post['content'] ?? '';
    final imageUrl = post['image_url'];
    final createdAtStr = post['created_at'];
    
    String timeAgo = '';
    if (createdAtStr != null) {
      try {
        final date = DateTime.parse(createdAtStr);
        timeAgo = timeago.format(date);
      } catch (_) {}
    }

    final bool isMyPost = _currentUserId != null && _currentUserId == post['user_id'];
    final bool isAdmin = _currentUserEmail == 'nithinappala625@gmail.com' || _currentUserEmail == 'nithinpatel2025@gmail.com';
    final bool canEditDelete = isMyPost || isAdmin;

    final isLiked = post['is_liked'] == true;
    final likeCount = post['like_count'] ?? 0;
    final commentCount = post['comment_count'] ?? 0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: Colors.grey.shade200,
                backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                child: avatarUrl == null ? Text(name[0].toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFD4AF37))) : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                    Text(timeAgo, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                  ],
                ),
              ),
              if (canEditDelete)
                PopupMenuButton<String>(
                  icon: Icon(Icons.more_horiz, color: Colors.grey.shade600),
                  onSelected: (val) {
                    if (val == 'delete') _deletePost(post['id']);
                    if (val == 'edit') _editPost(post);
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(value: 'edit', child: Text('Edit')),
                    const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: Colors.red))),
                  ],
                ),
            ],
          ),
          
          // Content
          if (content.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 8),
              child: Text(content, style: const TextStyle(fontSize: 15, height: 1.4)),
            ),
            
          // Image
          if (imageUrl != null && imageUrl.toString().isNotEmpty)
            Container(
              margin: const EdgeInsets.only(top: 8, bottom: 8),
              width: double.infinity,
              constraints: const BoxConstraints(maxHeight: 400),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.network(imageUrl, fit: BoxFit.cover),
              ),
            ),
            
          // Stats
          if (likeCount > 0 || commentCount > 0)
            Padding(
              padding: const EdgeInsets.only(top: 8, bottom: 8),
              child: Row(
                children: [
                  if (likeCount > 0) Text('$likeCount likes', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                  if (likeCount > 0 && commentCount > 0) const SizedBox(width: 8),
                  if (likeCount > 0 && commentCount > 0) Text('•', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                  if (likeCount > 0 && commentCount > 0) const SizedBox(width: 8),
                  if (commentCount > 0) Text('$commentCount comments', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                ],
              ),
            ),
            
          const Divider(height: 16),
          
          // Actions
          Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: () => _toggleLike(post['id'], isLiked),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(isLiked ? Icons.favorite : Icons.favorite_border, color: isLiked ? Colors.red : Colors.grey.shade600, size: 20),
                        const SizedBox(width: 8),
                        Text('Like', style: TextStyle(color: isLiked ? Colors.red : Colors.grey.shade700, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              ),
              Expanded(
                child: InkWell(
                  onTap: () => _showComments(post['id']),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.chat_bubble_outline, color: Colors.grey.shade600, size: 20),
                        const SizedBox(width: 8),
                        Text('Comment', style: TextStyle(color: Colors.grey.shade700, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }
}
"""

COMMENTS_BOTTOM_SHEET = """import 'package:flutter/material.dart';
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
        'user_id': widget.currentUserId,
        'comment_text': _commentController.text.trim(),
      });
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
"""

with open("lib/screens/feed/feed_screen.dart", "w", encoding="utf-8") as f:
    f.write(FEED_SCREEN_CONTENT)

with open("lib/screens/feed/feed_comments_bottom_sheet.dart", "w", encoding="utf-8") as f:
    f.write(COMMENTS_BOTTOM_SHEET)

print("Social feed files updated.")
