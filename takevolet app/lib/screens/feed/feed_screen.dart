import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart' as geocoding;
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import '../../services/r2_storage_service.dart';
import '../../utils/share_utils.dart';
import '../../services/onesignal_service.dart';
import 'feed_comments_bottom_sheet.dart';
import 'feed_video_player.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  static const _gold = Color(0xFF7B3AEC);
  static const _blue = Color(0xFF1DA1F2);
  bool isLoading = true;
  List<Map<String, dynamic>> posts = [];
  List<Map<String, dynamic>> _allProfiles = [];
  String? _currentUserAvatar;
  String? _currentUserName;
  String? _currentUserEmail;
  String? _currentUserId;

  final TextEditingController _postController = TextEditingController();
  File? _selectedImage;
  File? _selectedVideo;
  File? _selectedDocument;
  String? _selectedDocName;
  String _linkUrl = '';
  bool _isPosting = false;
  String? _currentLocationName;
  double? _currentLat;
  double? _currentLng;
  bool _fetchingLocation = false;

  // @mention overlay
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _mentionOverlay;
  List<Map<String, dynamic>> _mentionSuggestions = [];

  // Trending tags
  List<String> _trendingTags = [];

  @override
  void initState() {
    super.initState();
    _postController.addListener(_onTextChanged);
    _fetchPosts();
  }

  @override
  void dispose() {
    _postController.removeListener(_onTextChanged);
    _postController.dispose();
    _mentionOverlay?.remove();
    super.dispose();
  }

  void _onTextChanged() {
    final text = _postController.text;
    final cursorPos = _postController.selection.baseOffset;
    if (cursorPos < 0) return;
    final textBeforeCursor = text.substring(0, cursorPos);
    final atIndex = textBeforeCursor.lastIndexOf('@');

    if (atIndex >= 0 &&
        (atIndex == 0 || textBeforeCursor[atIndex - 1] == ' ')) {
      final query = textBeforeCursor.substring(atIndex + 1).toLowerCase();
      if (!query.contains(' ') && query.isNotEmpty) {
        final matches = _allProfiles
            .where((p) {
              final name = (p['full_name'] ?? '').toString().toLowerCase();
              return name.contains(query);
            })
            .take(5)
            .toList();
        if (matches.isNotEmpty) {
          setState(() => _mentionSuggestions = matches);
          _showMentionOverlay();
          return;
        }
      }
    }
    _hideMentionOverlay();
  }

  void _showMentionOverlay() {
    _mentionOverlay?.remove();
    _mentionOverlay = OverlayEntry(
      builder: (context) => Positioned(
        width: MediaQuery.of(context).size.width - 32,
        child: CompositedTransformFollower(
          link: _layerLink,
          showWhenUnlinked: false,
          offset: const Offset(0, -200),
          child: Material(
            elevation: 8,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              constraints: const BoxConstraints(maxHeight: 200),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _mentionSuggestions.length,
                itemBuilder: (context, index) {
                  final p = _mentionSuggestions[index];
                  final avatar = p['avatar_url'];
                  final name = p['full_name'] ?? 'Unknown';
                  return ListTile(
                    leading: CircleAvatar(
                      radius: 18,
                      backgroundImage: avatar != null
                          ? NetworkImage(avatar)
                          : null,
                      backgroundColor: Colors.grey.shade300,
                      child: avatar == null
                          ? Text(
                              name[0].toUpperCase(),
                              style: const TextStyle(
                                color: _gold,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : null,
                    ),
                    title: Text(
                      name,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    dense: true,
                    onTap: () => _insertMention(name),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
    Overlay.of(context).insert(_mentionOverlay!);
  }

  void _hideMentionOverlay() {
    _mentionOverlay?.remove();
    _mentionOverlay = null;
  }

  void _insertMention(String name) {
    final text = _postController.text;
    final cursorPos = _postController.selection.baseOffset;
    final textBeforeCursor = text.substring(0, cursorPos);
    final atIndex = textBeforeCursor.lastIndexOf('@');
    final textAfterCursor = text.substring(cursorPos);
    final newText = '${text.substring(0, atIndex)}@$name $textAfterCursor';
    _postController.text = newText;
    _postController.selection = TextSelection.collapsed(
      offset: atIndex + name.length + 2,
    );
    _hideMentionOverlay();
  }

  Future<void> _fetchLocation() async {
    setState(() => _fetchingLocation = true);
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        setState(() => _fetchingLocation = false);
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
      );
      _currentLat = pos.latitude;
      _currentLng = pos.longitude;
      try {
        final geocoder = geocoding.Geocoding();
        final placemarks = await geocoder.placemarkFromCoordinates(
          pos.latitude,
          pos.longitude,
        );
        if (placemarks.isNotEmpty) {
          final p = placemarks.first;
          _currentLocationName = [
            p.locality,
            p.administrativeArea,
          ].where((s) => s != null && s.isNotEmpty).join(', ');
        }
      } catch (_) {
        _currentLocationName =
            '${pos.latitude.toStringAsFixed(2)}, ${pos.longitude.toStringAsFixed(2)}';
      }
    } catch (e) {
      debugPrint('Location error: $e');
    }
    setState(() => _fetchingLocation = false);
  }

  Future<void> _pickDocument() async {
    try {
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx'],
      );
      if (result != null && result.isNotEmpty && result.first.path != null) {
        setState(() {
          _selectedDocument = File(result.first.path!);
          _selectedDocName = result.first.path!.split(Platform.pathSeparator).last;
        });
      }
    } catch (e) {
      debugPrint('Error picking document: $e');
    }
  }

  Future<void> _fetchPosts() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        _currentUserId = user.id;
        _currentUserEmail = user.email;
        try {
          final p = await Supabase.instance.client
              .from('profiles')
              .select('avatar_url, full_name')
              .eq('id', user.id)
              .maybeSingle();
          if (p != null) {
            _currentUserAvatar = p['avatar_url'];
            _currentUserName = p['full_name'];
          }
        } catch (_) {}
      }

      try {
        final profiles = await Supabase.instance.client
            .from('profiles')
            .select('id, full_name, avatar_url');
        _allProfiles = List<Map<String, dynamic>>.from(profiles);
      } catch (_) {}

      final res = await Supabase.instance.client
          .from('social_posts')
          .select('*, profiles:user_id(full_name, avatar_url, email)')
          .order('created_at', ascending: false);

      final likesRes = await Supabase.instance.client
          .from('social_likes')
          .select('post_id, user_id');
      final commentsRes = await Supabase.instance.client
          .from('social_comments')
          .select('post_id, id');

      List<Map<String, dynamic>> parsedPosts = List<Map<String, dynamic>>.from(
        res,
      );
      Map<String, int> tagCounts = {};

      for (var post in parsedPosts) {
        final postId = post['id'];
        final postLikes = likesRes
            .where((l) => l['post_id'] == postId)
            .toList();
        post['like_count'] = postLikes.length;
        post['is_liked'] = postLikes.any((l) => l['user_id'] == _currentUserId);
        final postComments = commentsRes
            .where((c) => c['post_id'] == postId)
            .toList();
        post['comment_count'] = postComments.length;

        final content = post['content'] ?? '';
        for (final match in RegExp(r'#(\w+)').allMatches(content)) {
          final tag = '#${match.group(1)!.toLowerCase()}';
          tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
        }
      }

      final sortedTags = tagCounts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));
      _trendingTags = sortedTags.take(10).map((e) => e.key).toList();

      setState(() {
        posts = parsedPosts;
        isLoading = false;
      });
    } catch (e) {
      debugPrint('Error fetching posts: $e');
      setState(() => isLoading = false);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 70,
    );
    if (pickedFile != null)
      setState(() => _selectedImage = File(pickedFile.path));
  }

  Future<void> _pickVideo() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickVideo(
      source: ImageSource.gallery,
      maxDuration: const Duration(minutes: 5),
    );
    if (pickedFile != null) {
      final file = File(pickedFile.path);
      final sizeInBytes = await file.length();
      final sizeInMB = sizeInBytes / (1024 * 1024);
      if (sizeInMB > 50) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Video must be under 50MB')),
        );
        return;
      }
      setState(() => _selectedVideo = file);
    }
  }

  Future<void> _submitPost() async {
    if (_postController.text.trim().isEmpty &&
        _selectedImage == null &&
        _selectedVideo == null &&
        _selectedDocument == null)
      return;

    if (_currentUserId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please login to post.')));
      return;
    }

    if (_currentUserAvatar == null || _currentUserAvatar!.isEmpty) {
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              const Icon(Icons.camera_alt, color: _gold),
              const SizedBox(width: 8),
              const Text('Add Profile Photo'),
            ],
          ),
          content: const Text(
            'You must add a profile photo before posting in the community feed. Go to your profile settings to upload one.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: _gold),
              onPressed: () {
                Navigator.pop(ctx);
                context.push('/profile-edit');
              },
              child: const Text(
                'Add Photo',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      );
      return;
    }

    if (_currentLocationName == null) {
      await _fetchLocation();
    }

    setState(() => _isPosting = true);

    try {
      String? imageUrl;
      if (_selectedImage != null) {
        final fileName =
            '${DateTime.now().millisecondsSinceEpoch}_${_selectedImage!.path.split('/').last}';
        imageUrl = await R2StorageService.uploadFile(
          _selectedImage!,
          'Takevolet/social/$fileName',
        );
      }

      String? videoUrl;
      if (_selectedVideo != null) {
        final fileName =
            '${DateTime.now().millisecondsSinceEpoch}_${_selectedVideo!.path.split('/').last}';
        videoUrl = await R2StorageService.uploadFile(
          _selectedVideo!,
          'Takevolet/social/videos/$fileName',
        );
      }

      String? documentUrl;
      if (_selectedDocument != null) {
        final fileName =
            '${DateTime.now().millisecondsSinceEpoch}_$_selectedDocName';
        documentUrl = await R2StorageService.uploadFile(
          _selectedDocument!,
          'Takevolet/social/docs/$fileName',
        );
      }

      final payload = {
        'user_id': _currentUserId,
        'content': _postController.text.trim(),
        'image_url': imageUrl,
        'video_url': videoUrl,
        'document_url': documentUrl,
        'link_url': _linkUrl.trim().isNotEmpty ? _linkUrl.trim() : null,
        'location_name': _currentLocationName,
        'latitude': _currentLat,
        'longitude': _currentLng,
      };
      payload.removeWhere(
        (key, value) => value == null || (value is String && value.isEmpty),
      );

      await Supabase.instance.client.from('social_posts').insert(payload);

      // Trigger notifications for new community post
      try {
        final posterName = _currentUserName ?? 'Someone';
        await OneSignalService.broadcastInAppNotification(
          title: 'New Community Post',
          body: '$posterName just shared an update!',
          type: 'feed',
        );
        await OneSignalService.sendPushNotification(
          title: 'New Post by $posterName',
          message: _postController.text.trim().isNotEmpty
              ? _postController.text.trim()
              : 'Check out the new update on the community feed.',
        );
      } catch (e) {
        debugPrint('Notif error: $e');
      }

      _postController.clear();
      _linkUrl = '';
      setState(() {
        _selectedImage = null;
        _selectedVideo = null;
        _selectedDocument = null;
        _selectedDocName = null;
      });
      await _fetchPosts();
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed to post: $e')));
    } finally {
      setState(() => _isPosting = false);
    }
  }

  Future<void> _toggleLike(String postId, bool isCurrentlyLiked) async {
    if (_currentUserId == null) return;
    setState(() {
      final post = posts.firstWhere((p) => p['id'] == postId);
      post['is_liked'] = !isCurrentlyLiked;
      post['like_count'] += isCurrentlyLiked ? -1 : 1;
    });
    try {
      if (isCurrentlyLiked) {
        await Supabase.instance.client
            .from('social_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', _currentUserId!);
      } else {
        await Supabase.instance.client.from('social_likes').insert({
          'post_id': postId,
          'user_id': _currentUserId!,
        });

        // Trigger In-App Notification
        try {
          final post = posts.firstWhere((p) => p['id'] == postId);
          final postOwnerId = post['user_id'];
          if (postOwnerId != _currentUserId) {
            await Supabase.instance.client.from('notifications').insert({
              'profile_id': postOwnerId,
              'title': 'New Like',
              'body': '${_currentUserName ?? "Someone"} liked your post!',
              'type': 'feed',
            });
          }
        } catch (_) {}
      }
    } catch (e) {
      _fetchPosts();
    }
  }

  void _showComments(String postId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FeedCommentsBottomSheet(
        postId: postId,
        currentUserId: _currentUserId,
      ),
    ).then((_) => _fetchPosts());
  }

  void _sharePost(Map<String, dynamic> post) {
    ShareUtils.generatePostShare(context, post);
  }

  void _deletePost(String postId) async {
    bool confirm =
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Text('Delete Post'),
            content: const Text('Are you sure you want to delete this post?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text(
                  'Delete',
                  style: TextStyle(color: Colors.red),
                ),
              ),
            ],
          ),
        ) ??
        false;
    if (confirm) {
      try {
        await Supabase.instance.client
            .from('social_posts')
            .delete()
            .eq('id', postId);
        _fetchPosts();
      } catch (e) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to delete: $e')));
      }
    }
  }

  void _editPost(Map<String, dynamic> post) {
    final editController = TextEditingController(text: post['content'] ?? '');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Edit Post'),
        content: TextField(
          controller: editController,
          maxLines: 4,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            hintText: 'Update your post...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: _gold),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await Supabase.instance.client
                    .from('social_posts')
                    .update({
                      'content': editController.text.trim(),
                      'updated_at': DateTime.now().toIso8601String(),
                    })
                    .eq('id', post['id']);
                _fetchPosts();
              } catch (e) {
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(SnackBar(content: Text('Failed to edit: $e')));
              }
            },
            child: const Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _filterByTag(String tag) {
    final filtered = posts
        .where(
          (p) => (p['content'] ?? '').toString().toLowerCase().contains(
            tag.toLowerCase(),
          ),
        )
        .toList();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              height: 5,
              width: 40,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _blue.withAlpha(20),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.tag, color: _blue, size: 18),
                        const SizedBox(width: 4),
                        Text(
                          tag,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: _blue,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${filtered.length} posts',
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 0),
            Expanded(
              child: filtered.isEmpty
                  ? Center(
                      child: Text(
                        'No posts with $tag',
                        style: TextStyle(color: Colors.grey.shade500),
                      ),
                    )
                  : ListView.builder(
                      itemCount: filtered.length,
                      itemBuilder: (context, index) =>
                          _buildFeedCard(filtered[index]),
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAddLinkDialog() {
    final controller = TextEditingController(text: _linkUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(Icons.link, color: _gold),
            SizedBox(width: 8),
            Text('Add Link'),
          ],
        ),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'https://example.com/brochure',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.link),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: _gold),
            onPressed: () {
              setState(() => _linkUrl = controller.text.trim());
              Navigator.pop(ctx);
            },
            child: const Text('Add', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildRichContent(String content) {
    final spans = <InlineSpan>[];
    final regex = RegExp(r'(#\w+)|(@[\w\s]+?)(?=\s@|\s#|$)');
    int lastEnd = 0;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultTextColor = isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A);

    for (final match in regex.allMatches(content)) {
      if (match.start > lastEnd) {
        spans.add(
          TextSpan(
            text: content.substring(lastEnd, match.start),
            style: TextStyle(
              fontSize: 15,
              height: 1.5,
              fontWeight: FontWeight.w600,
              color: defaultTextColor,
            ),
          ),
        );
      }
      final matchedText = match.group(0)!;
      if (matchedText.startsWith('#')) {
        spans.add(
          TextSpan(
            text: matchedText,
            style: TextStyle(
              fontSize: 15,
              height: 1.5,
              color: isDark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7),
              fontWeight: FontWeight.w800,
            ),
            recognizer: TapGestureRecognizer()
              ..onTap = () => _filterByTag(matchedText),
          ),
        );
      } else if (matchedText.startsWith('@')) {
        spans.add(
          TextSpan(
            text: matchedText,
            style: TextStyle(
              fontSize: 15,
              height: 1.5,
              color: isDark ? const Color(0xFFA78BFA) : const Color(0xFF6D28D9),
              fontWeight: FontWeight.w800,
            ),
          ),
        );
      }
      lastEnd = match.end;
    }
    if (lastEnd < content.length) {
      spans.add(
        TextSpan(
          text: content.substring(lastEnd),
          style: TextStyle(
            fontSize: 15,
            height: 1.5,
            fontWeight: FontWeight.w600,
            color: defaultTextColor,
          ),
        ),
      );
    }
    if (spans.isEmpty)
      return Text(
        content,
        style: TextStyle(
          fontSize: 15,
          height: 1.5,
          fontWeight: FontWeight.w600,
          color: defaultTextColor,
        ),
      );
    return RichText(text: TextSpan(children: spans));
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.groups, color: _gold, size: 28),
            const SizedBox(width: 10),
            Text(
              'Community',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 22,
                letterSpacing: -0.5,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        elevation: 0,
        scrolledUnderElevation: 1,
        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
        foregroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              setState(() => isLoading = true);
              _fetchPosts();
            },
          ),
        ],
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              height: 100,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                image: const DecorationImage(
                  image: NetworkImage(
                    'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2074&auto=format&fit=crop',
                  ),
                  fit: BoxFit.cover,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: LinearGradient(
                        colors: [
                          Colors.black.withOpacity(0.7),
                          Colors.transparent,
                        ],
                        begin: Alignment.bottomLeft,
                        end: Alignment.topRight,
                      ),
                    ),
                  ),
                  const Positioned(
                    bottom: 12,
                    left: 16,
                    child: Text(
                      'Join the conversation\nShare updates & connect!',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        height: 1.2,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_trendingTags.isNotEmpty)
            SliverToBoxAdapter(
              child: Container(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                padding: const EdgeInsets.only(left: 16, top: 6, bottom: 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.local_fire_department,
                          color: Colors.deepOrange.shade400,
                          size: 16,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Trending',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Colors.grey.shade600,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 32,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: _trendingTags.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) => GestureDetector(
                          onTap: () => _filterByTag(_trendingTags[index]),
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  _blue.withAlpha(20),
                                  _blue.withAlpha(10),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: _blue.withAlpha(50)),
                            ),
                            child: Text(
                              _trendingTags[index],
                              style: const TextStyle(
                                color: _blue,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          SliverToBoxAdapter(child: _buildComposer()),
          SliverFillRemaining(
            hasScrollBody: true,
            child: isLoading
                ? const Center(child: CircularProgressIndicator(color: _gold))
                : RefreshIndicator(
                    color: _gold,
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return CompositedTransformTarget(
      link: _layerLink,
      child: Container(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        margin: const EdgeInsets.only(top: 1),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                GestureDetector(
                  onTap: () => context.push('/profile-edit'),
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 22,
                        backgroundColor: _gold.withAlpha(30),
                        backgroundImage: _currentUserAvatar != null
                            ? NetworkImage(_currentUserAvatar!)
                            : null,
                        child: _currentUserAvatar == null
                            ? Text(
                                (_currentUserName ?? 'U')[0].toUpperCase(),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: _gold,
                                  fontSize: 18,
                                ),
                              )
                            : null,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: _gold,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.edit, size: 10, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextField(
                    controller: _postController,
                    maxLines: null,
                    style: TextStyle(
                      fontSize: 15,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                    decoration: InputDecoration(
                      hintText: 'Share updates, brochures, links...',
                      hintStyle: TextStyle(
                        color: isDark ? Colors.grey.shade500 : Colors.grey.shade400,
                        fontSize: 15,
                      ),
                      border: InputBorder.none,
                    ),
                  ),
                ),
              ],
            ),
            // Attachments preview
            if (_selectedImage != null)
              _buildAttachmentPreview(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.file(
                    _selectedImage!,
                    height: 140,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                onRemove: () => setState(() => _selectedImage = null),
              ),
            if (_selectedVideo != null)
              _buildAttachmentPreview(
                child: Container(
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.purple.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.purple.shade200),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.videocam, color: Colors.purple, size: 28),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          _selectedVideo!.path.split('/').last,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                onRemove: () => setState(() => _selectedVideo = null),
              ),
            if (_selectedDocument != null)
              _buildAttachmentPreview(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.picture_as_pdf,
                        color: Colors.red.shade400,
                        size: 28,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _selectedDocName ?? 'Document',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                onRemove: () => setState(() {
                  _selectedDocument = null;
                  _selectedDocName = null;
                }),
              ),
            if (_linkUrl.isNotEmpty)
              _buildAttachmentPreview(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _blue.withAlpha(15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _blue.withAlpha(40)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.link, color: _blue, size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _linkUrl,
                          style: const TextStyle(
                            color: _blue,
                            fontWeight: FontWeight.w500,
                            fontSize: 13,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                onRemove: () => setState(() => _linkUrl = ''),
              ),
            if (_currentLocationName != null)
              Padding(
                padding: const EdgeInsets.only(left: 56, top: 4),
                child: Row(
                  children: [
                    Icon(
                      Icons.location_on,
                      color: Colors.red.shade300,
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _currentLocationName!,
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 8),
                    GestureDetector(
                      onTap: () => setState(() {
                        _currentLocationName = null;
                        _currentLat = null;
                        _currentLng = null;
                      }),
                      child: Icon(
                        Icons.close,
                        size: 14,
                        color: Colors.grey.shade400,
                      ),
                    ),
                  ],
                ),
              ),
            const Divider(height: 20),
            // Action bar
            Row(
              children: [
                _composerButton(
                  Icons.image_outlined,
                  Colors.green,
                  'Photo',
                  _pickImage,
                ),
                _composerButton(
                  Icons.attach_file,
                  Colors.orange,
                  'Doc',
                  _pickDocument,
                ),
                _composerButton(
                  Icons.videocam_outlined,
                  Colors.purple,
                  'Video',
                  _pickVideo,
                ),
                _composerButton(Icons.link, _blue, 'Link', _showAddLinkDialog),
                _composerButton(
                  Icons.location_on_outlined,
                  Colors.red,
                  'Location',
                  _fetchingLocation ? null : _fetchLocation,
                  isLoading: _fetchingLocation,
                ),
                _composerButton(Icons.tag, _blue, '#', () {
                  _postController.text = '${_postController.text}#';
                  _postController.selection = TextSelection.collapsed(
                    offset: _postController.text.length,
                  );
                }),
                const Spacer(),
                ElevatedButton(
                  onPressed: _isPosting ? null : _submitPost,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _gold,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 0,
                    ),
                    elevation: 0,
                  ),
                  child: _isPosting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Post',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _composerButton(
    IconData icon,
    Color color,
    String label,
    VoidCallback? onTap, {
    bool isLoading = false,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        child: isLoading
            ? SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2, color: color),
              )
            : Icon(icon, color: color, size: 22),
      ),
    );
  }

  Widget _buildAttachmentPreview({
    required Widget child,
    required VoidCallback onRemove,
  }) {
    return Stack(
      children: [
        Container(
          margin: const EdgeInsets.only(top: 8, left: 56),
          width: double.infinity,
          child: child,
        ),
        Positioned(
          top: 12,
          right: 4,
          child: GestureDetector(
            onTap: onRemove,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.black54,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.close, color: Colors.white, size: 16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Padding(
      padding: const EdgeInsets.only(top: 80.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: _gold.withAlpha(20),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.forum_outlined,
              size: 60,
              color: _gold.withAlpha(150),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            'No posts yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: Colors.grey.shade700,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Be the first to share something!',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildFeedCard(Map<String, dynamic> post) {
    final profiles = post['profiles'] ?? {};
    final name = profiles['full_name'] ?? 'Unknown';
    final avatarUrl = profiles['avatar_url'];
    final content = post['content'] ?? '';
    final imageUrl = post['image_url'];
    final documentUrl = post['document_url'];
    final linkUrl = post['link_url'];
    final locationName = post['location_name'];
    final createdAtStr = post['created_at'];

    String timeAgo = '';
    String fullDate = '';
    if (createdAtStr != null) {
      try {
        final date = DateTime.parse(createdAtStr).toLocal();
        timeAgo = timeago.format(date);
        fullDate = DateFormat('MMM d, yyyy • h:mm a').format(date);
      } catch (_) {}
    }

    final bool isMyPost =
        _currentUserId != null && _currentUserId == post['user_id'];
    final bool isAdmin =
        _currentUserEmail == 'nithinappala625@gmail.com' ||
        _currentUserEmail == 'nithinpatel2025@gmail.com';
    final bool canEditDelete = isMyPost || isAdmin;
    final isLiked = post['is_liked'] == true;
    final likeCount = post['like_count'] ?? 0;
    final commentCount = post['comment_count'] ?? 0;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: _gold.withAlpha(80), width: 2),
                  ),
                  child: CircleAvatar(
                    radius: 22,
                    backgroundColor: _gold.withAlpha(30),
                    backgroundImage: avatarUrl != null
                        ? NetworkImage(avatarUrl)
                        : null,
                    child: avatarUrl == null
                        ? Text(
                            name.isNotEmpty ? name[0].toUpperCase() : '?',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: _gold,
                              fontSize: 18,
                            ),
                          )
                        : null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              name,
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 15.5,
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (isAdmin && post['user_id'] == _currentUserId) ...[
                            const SizedBox(width: 4),
                            const Icon(Icons.verified, color: _gold, size: 16),
                          ],
                        ],
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Text(
                            timeAgo,
                            style: TextStyle(
                              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                              fontWeight: FontWeight.w700,
                              fontSize: 12.5,
                            ),
                          ),
                          if (locationName != null) ...[
                            Text(
                              ' • ',
                              style: TextStyle(
                                color: isDark ? const Color(0xFF64748B) : const Color(0xFF64748B),
                                fontWeight: FontWeight.w800,
                                fontSize: 12,
                              ),
                            ),
                            const Icon(
                              Icons.location_on,
                              color: Color(0xFFE11D48),
                              size: 13,
                            ),
                            const SizedBox(width: 2),
                            Flexible(
                              child: Text(
                                locationName,
                                style: TextStyle(
                                  color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF0F172A),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12.5,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                if (canEditDelete)
                  PopupMenuButton<String>(
                    icon: Icon(Icons.more_horiz, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    onSelected: (val) {
                      if (val == 'delete') _deletePost(post['id']);
                      if (val == 'edit') _editPost(post);
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit, size: 18),
                            SizedBox(width: 8),
                            Text('Edit'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 18, color: Colors.red),
                            SizedBox(width: 8),
                            Text('Delete', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                  ),
              ],
            ),

            // Full date
            if (fullDate.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 6, left: 58),
                child: Text(
                  fullDate,
                  style: TextStyle(
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    fontWeight: FontWeight.w700,
                    fontSize: 11.5,
                  ),
                ),
              ),

            // Content
            if (content.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 12, bottom: 4),
                child: _buildRichContent(content),
              ),

            // Image
            if (imageUrl != null && imageUrl.toString().isNotEmpty)
              Container(
                margin: const EdgeInsets.only(top: 10),
                width: double.infinity,
                constraints: const BoxConstraints(maxHeight: 400),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (c, e, s) => Container(
                      height: 200,
                      color: isDark ? const Color(0xFF0F172A) : Colors.grey.shade100,
                      child: const Center(
                        child: Icon(
                          Icons.broken_image,
                          size: 40,
                          color: Colors.grey,
                        ),
                      ),
                    ),
                  ),
                ),
              ),

            // Video attachment
            if (post['video_url'] != null && post['video_url'].toString().isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: FeedVideoPlayer(videoUrl: post['video_url']),
                ),
              ),

            // Document attachment
            if (documentUrl != null && documentUrl.toString().isNotEmpty)
              GestureDetector(
                onTap: () async {
                  final uri = Uri.parse(documentUrl);
                  if (await canLaunchUrl(uri))
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                },
                child: Container(
                  margin: const EdgeInsets.only(top: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isDark ? const Color(0xFF9A3412) : Colors.orange.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.picture_as_pdf,
                        color: Colors.red.shade400,
                        size: 28,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Document / Brochure',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                              ),
                            ),
                            Text(
                              'Tap to view or download',
                              style: TextStyle(
                                color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                                fontWeight: FontWeight.w700,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Icon(
                        Icons.download_rounded,
                        color: isDark ? const Color(0xFFFB923C) : Colors.orange.shade700,
                      ),
                    ],
                  ),
                ),
              ),

            // Link attachment
            if (linkUrl != null && linkUrl.toString().isNotEmpty)
              GestureDetector(
                onTap: () async {
                  final uri = Uri.parse(linkUrl);
                  if (await canLaunchUrl(uri))
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                },
                child: Container(
                  margin: const EdgeInsets.only(top: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : _blue.withAlpha(12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isDark ? const Color(0xFF0369A1) : _blue.withAlpha(40)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.language, color: _blue, size: 24),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          linkUrl,
                          style: const TextStyle(
                            color: _blue,
                            fontWeight: FontWeight.w700,
                            fontSize: 13,
                            decoration: TextDecoration.underline,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const Icon(Icons.open_in_new, color: _blue, size: 18),
                    ],
                  ),
                ),
              ),

            const SizedBox(height: 8),

            // Stats
            if (likeCount > 0 || commentCount > 0)
              Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    if (likeCount > 0) ...[
                      const Icon(Icons.favorite, color: Colors.red, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        '$likeCount',
                        style: TextStyle(
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ],
                    if (likeCount > 0 && commentCount > 0)
                      const SizedBox(width: 16),
                    if (commentCount > 0) ...[
                      Icon(
                        Icons.chat_bubble,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '$commentCount',
                        style: TextStyle(
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

            Divider(height: 16, color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),

            // Actions
            Row(
              children: [
                _actionButton(
                  isLiked ? Icons.favorite : Icons.favorite_border,
                  'Like',
                  isLiked ? Colors.red : (isDark ? const Color(0xFFCBD5E1) : const Color(0xFF1E293B)),
                  () => _toggleLike(post['id'], isLiked),
                ),
                Container(width: 1, height: 20, color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
                _actionButton(
                  Icons.chat_bubble_outline,
                  'Comment',
                  isDark ? const Color(0xFFCBD5E1) : const Color(0xFF1E293B),
                  () => _showComments(post['id']),
                ),
                Container(width: 1, height: 20, color: isDark ? const Color(0xFF334155) : Colors.grey.shade200),
                _actionButton(
                  Icons.share_outlined,
                  'Share',
                  isDark ? const Color(0xFFCBD5E1) : const Color(0xFF1E293B),
                  () => _sharePost(post),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionButton(
    IconData icon,
    String label,
    Color color,
    VoidCallback onTap,
  ) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 19),
              const SizedBox(width: 5),
              Text(
                label,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
