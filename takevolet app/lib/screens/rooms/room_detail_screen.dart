import 'dart:io';
import 'dart:convert';
import 'package:image_picker/image_picker.dart';
import '../../services/r2_storage_service.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../services/onesignal_service.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../main.dart';
import '../../utils/image_utils.dart';
import '../../utils/share_utils.dart';
import '../../widgets/full_screen_image_viewer.dart';
import '../feed/feed_video_player.dart';

class RoomDetailScreen extends StatefulWidget {
  final String id;
  const RoomDetailScreen({super.key, required this.id});

  @override
  State<RoomDetailScreen> createState() => _RoomDetailScreenState();
}

class _RoomDetailScreenState extends State<RoomDetailScreen> {
  Map<String, dynamic>? room;
  Map<String, dynamic>? posterProfile;
  bool isLoading = true;

  String _formatNumber(dynamic n) {
    if (n == null) return '0';
    final numVal = int.tryParse(n.toString().replaceAll(RegExp(r'[^\d]'), ''));
    if (numVal == null) return n.toString();
    final str = numVal.toString();
    if (str.length <= 3) return str;
    String result = str.substring(str.length - 3);
    String remaining = str.substring(0, str.length - 3);
    while (remaining.length > 2) {
      result = '${remaining.substring(remaining.length - 2)},$result';
      remaining = remaining.substring(0, remaining.length - 2);
    }
    if (remaining.isNotEmpty) {
      result = '$remaining,$result';
    }
    return result;
  }
  bool _hasUnlocked = false;
  String? _selectedPlanId;
  int _contactBalance = 0;
  int _pendingAmount = 0;
  int _pendingUnlocks = 1;
  List<Map<String, dynamic>> _reviews = [];
  bool _isLoadingReviews = true;

  late Razorpay _razorpay;
  final PageController _pageController = PageController();
  int _currentImageIndex = 0;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _fetchRoom();
    _fetchReviews();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _razorpay.clear();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId != null) {
      try {
        // ALWAYS unlock the current room immediately
        await supabase.from('contact_unlocks').insert({'room_id': widget.id, 'user_id': userId});
        
        // If they bought more than 1 contact, add the remainder to their balance
        if (_pendingUnlocks > 1) {
          final remainder = _pendingUnlocks - 1;
          await supabase.from('profiles').update({'contact_balance': _contactBalance + remainder}).eq('id', userId);
          if (mounted) setState(() => _contactBalance += remainder);
        }

        // Notify the owner that their room contact was unlocked
        if (room != null && room!['user_id'] != null) {
          try {
             await OneSignalService.sendPushNotification(
               title: 'Contact Unlocked!',
               message: 'Someone just unlocked your contact details for: ${room!['title']}',
             );
          } catch (_) {}
        }
      } catch (e) {}
    }

    // Verify payment on backend
    try {
      await supabase.functions.invoke('verify-razorpay-payment', body: {
        'order_id': response.orderId,
        'payment_id': response.paymentId,
        'signature': response.signature,
        'room_id': widget.id,
        'user_id': userId,
      });
    } catch (_) {}

    // Close bottom sheet if open
    if (context.mounted) {
      try { Navigator.pop(context); } catch (_) {}
    }

    // Fetch poster profile and mark unlocked
    await _fetchPosterProfile();
    setState(() => _hasUnlocked = true);

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('✅ Contact Unlocked Successfully!'),
        backgroundColor: Colors.green,
      ));
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('Payment Failed: ${response.message}'),
      backgroundColor: Colors.red,
    ));
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('External Wallet: ${response.walletName}'),
    ));
  }

  Future<void> _fetchRoom() async {
    try {
      final res = await supabase.from('rooms').select().eq('id', widget.id).single();
      setState(() {
        room = res;
      });

      // Check if user already unlocked this room
      final userId = supabase.auth.currentUser?.id;
      if (userId != null) {
        final unlocks = await supabase
            .from('contact_unlocks')
            .select()
            .eq('room_id', widget.id)
            .eq('user_id', userId);
        if (unlocks != null && (unlocks as List).isNotEmpty) {
          setState(() => _hasUnlocked = true);
        }
        
        try {
          final p = await supabase.from('profiles').select('contact_balance').eq('id', userId).single();
          setState(() => _contactBalance = p['contact_balance'] ?? 0);
        } catch (_) {}
      }

      await _fetchPosterProfile();
      setState(() => isLoading = false);
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  Future<void> _fetchPosterProfile() async {
    if (room == null) return;
    try {
      final profile = await supabase
          .from('profiles')
          .select('full_name, phone, whatsapp, avatar_url, profession, email')
          .eq('id', room!['user_id'])
          .single();
          
      // Override with custom contact if the admin provided one
      if (room!['custom_contact'] != null && room!['custom_contact'].toString().trim().isNotEmpty) {
        final customContact = room!['custom_contact'].toString().trim();
        profile['phone'] = customContact;
        profile['whatsapp'] = customContact;
      }
      
      setState(() => posterProfile = profile);
    } catch (_) {}
  }

  Future<void> _fetchReviews() async {
    List<Map<String, dynamic>> loadedReviews = [];
    // 1. Try from property_reviews table
    try {
      final res = await supabase
          .from('property_reviews')
          .select()
          .eq('room_id', widget.id)
          .order('created_at', ascending: false);
      if (res is List && res.isNotEmpty) {
        loadedReviews.addAll(List<Map<String, dynamic>>.from(res));
      }
    } catch (_) {}

    // 2. Fetch from room metadata reviews fallback
    try {
      final r = await supabase.from('rooms').select('metadata').eq('id', widget.id).maybeSingle();
      if (r != null && r['metadata'] != null) {
        dynamic meta = r['metadata'];
        if (meta is String) {
          try { meta = jsonDecode(meta); } catch (_) {}
        }
        if (meta is Map && meta['reviews'] is List) {
          for (var item in (meta['reviews'] as List)) {
            if (item is Map) {
              final mapItem = Map<String, dynamic>.from(item);
              final exists = loadedReviews.any((x) => x['id'] != null && x['id'].toString() == mapItem['id']?.toString());
              if (!exists) {
                loadedReviews.add(mapItem);
              }
            }
          }
        }
      }
    } catch (_) {}

    if (mounted) {
      setState(() {
        _reviews = loadedReviews;
        _isLoadingReviews = false;
      });
    }
  }

  void _openAddReviewSheet() {
    final user = supabase.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to leave a review')),
      );
      return;
    }

    int selectedRating = 5;
    final TextEditingController commentController = TextEditingController();
    List<File> selectedReviewPhotos = [];
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final isDark = Theme.of(context).brightness == Brightness.dark;
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(sheetCtx).viewInsets.bottom),
            child: Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(sheetCtx).size.height * 0.85,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade400,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Rate & Review This Property',
                      style: GoogleFonts.outfit(
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Upload real photos of the room/PG to help future tenants compare!',
                      style: TextStyle(
                        fontSize: 13,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Star Rating Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        final star = index + 1;
                        return IconButton(
                          icon: Icon(
                            star <= selectedRating ? Icons.star_rounded : Icons.star_outline_rounded,
                            color: const Color(0xFFF59E0B),
                            size: 36,
                          ),
                          onPressed: () {
                            setSheetState(() => selectedRating = star);
                          },
                        );
                      }),
                    ),
                    const SizedBox(height: 12),
                    // Comment Text Field
                    TextField(
                      controller: commentController,
                      maxLines: 4,
                      minLines: 2,
                      keyboardType: TextInputType.multiline,
                      textInputAction: TextInputAction.newline,
                      autofocus: false,
                      enableInteractiveSelection: true,
                      style: TextStyle(
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 14,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Share your genuine experience (room condition, food, cleanliness, wifi...)',
                        hintStyle: TextStyle(
                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF94A3B8),
                          fontSize: 13,
                        ),
                        filled: true,
                        fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                        contentPadding: const EdgeInsets.all(14),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                        ),
                        focusedBorder: const OutlineInputBorder(
                          borderRadius: BorderRadius.all(Radius.circular(12)),
                          borderSide: BorderSide(color: Color(0xFF7B3AEC), width: 2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Photos upload section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Actual Visitor Photos (${selectedReviewPhotos.length})',
                          style: TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                        TextButton.icon(
                          onPressed: () async {
                            final picker = ImagePicker();
                            final images = await picker.pickMultiImage();
                            if (images.isNotEmpty) {
                              setSheetState(() {
                                selectedReviewPhotos.addAll(images.map((x) => File(x.path)));
                              });
                            }
                          },
                          icon: const Icon(Icons.add_a_photo_rounded, size: 16, color: Color(0xFF7B3AEC)),
                          label: const Text('Add Photos', style: TextStyle(color: Color(0xFF7B3AEC), fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                    if (selectedReviewPhotos.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      SizedBox(
                        height: 80,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: selectedReviewPhotos.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (ctx, i) {
                            return Stack(
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(10),
                                  child: Image.file(
                                    selectedReviewPhotos[i],
                                    width: 80,
                                    height: 80,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                Positioned(
                                  top: 2,
                                  right: 2,
                                  child: GestureDetector(
                                    onTap: () {
                                      setSheetState(() {
                                        selectedReviewPhotos.removeAt(i);
                                      });
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(2),
                                      decoration: const BoxDecoration(
                                        color: Colors.black54,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.close, size: 14, color: Colors.white),
                                    ),
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                    ],
                    const SizedBox(height: 20),
                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: isSubmitting
                            ? null
                            : () async {
                                if (commentController.text.trim().isEmpty) {
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    const SnackBar(content: Text('Please enter a review comment')),
                                  );
                                  return;
                                }
                                setSheetState(() => isSubmitting = true);
                                try {
                                  List<String> photoUrls = [];
                                  for (var f in selectedReviewPhotos) {
                                    final ext = f.path.split('.').last;
                                    final remotePath = 'reviews/${DateTime.now().millisecondsSinceEpoch}_${photoUrls.length}.$ext';
                                    final url = await R2StorageService.uploadFile(f, remotePath);
                                    if (url != null) photoUrls.add(url);
                                  }

                                  Map<String, dynamic>? profile;
                                  try {
                                    profile = await supabase
                                        .from('profiles')
                                        .select('full_name, avatar_url')
                                        .eq('id', user.id)
                                        .maybeSingle();
                                  } catch (_) {}

                                  final newReview = {
                                    'id': DateTime.now().millisecondsSinceEpoch.toString(),
                                    'room_id': widget.id,
                                    'user_id': user.id,
                                    'user_name': profile?['full_name'] ?? (user.email != null && user.email!.contains('@') ? user.email!.split('@').first : 'Verified Tenant'),
                                    'user_avatar': profile?['avatar_url'],
                                    'rating': selectedRating,
                                    'review_text': commentController.text.trim(),
                                    'photo_urls': photoUrls,
                                    'created_at': DateTime.now().toIso8601String(),
                                  };

                                  // 1. Try inserting into property_reviews table
                                  try {
                                    await supabase.from('property_reviews').insert(newReview);
                                  } catch (tableErr) {
                                    debugPrint('[Reviews] property_reviews table insert: $tableErr');
                                  }

                                  // 2. ALWAYS save into rooms.metadata['reviews'] JSONB (100% resilient & no PostgresException)
                                  try {
                                    final currentRoom = await supabase.from('rooms').select('metadata').eq('id', widget.id).single();
                                    Map<String, dynamic> meta = {};
                                    if (currentRoom['metadata'] != null) {
                                      if (currentRoom['metadata'] is Map) {
                                        meta = Map<String, dynamic>.from(currentRoom['metadata']);
                                      } else if (currentRoom['metadata'] is String) {
                                        try {
                                          meta = Map<String, dynamic>.from(jsonDecode(currentRoom['metadata']));
                                        } catch (_) {}
                                      }
                                    }
                                    List existing = [];
                                    if (meta['reviews'] is List) {
                                      existing = List.from(meta['reviews']);
                                    }
                                    existing.insert(0, newReview);
                                    meta['reviews'] = existing;

                                    await supabase.from('rooms').update({'metadata': meta}).eq('id', widget.id);
                                  } catch (metaErr) {
                                    debugPrint('[Reviews] room metadata save error: $metaErr');
                                  }

                                  if (ctx.mounted) Navigator.pop(ctx);
                                  _fetchReviews();
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text('Review & photos submitted successfully!'),
                                        backgroundColor: Colors.green,
                                      ),
                                    );
                                  }
                                } catch (err) {
                                  setSheetState(() => isSubmitting = false);
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(content: Text('Failed to submit review: $err')),
                                  );
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF7B3AEC),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                        child: isSubmitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text(
                                'Post Review',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPgSharingTariffsCard(Map<String, dynamic> metadata, bool isDark) {
    final sharingPrices = metadata['sharing_prices'];
    if (sharingPrices == null || sharingPrices is! Map || sharingPrices.isEmpty) {
      return const SizedBox.shrink();
    }

    final Map<String, String> labels = {
      '1_sharing': '1 Sharing (Single)',
      '2_sharing': '2 Sharing (Double)',
      '3_sharing': '3 Sharing (Triple)',
      '4_sharing': '4 Sharing (4-Bed)',
    };

    final items = <MapEntry<String, dynamic>>[];
    for (var key in ['1_sharing', '2_sharing', '3_sharing', '4_sharing']) {
      if (sharingPrices.containsKey(key) && sharingPrices[key] != null && sharingPrices[key].toString().isNotEmpty) {
        items.add(MapEntry(key, sharingPrices[key]));
      }
    }

    if (items.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(top: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF4338CA) : const Color(0xFFDDD6FE),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF7B3AEC).withOpacity(isDark ? 0.2 : 0.06),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: const Color(0xFF7B3AEC).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.people_outline_rounded, color: Color(0xFF6D28D9), size: 18),
              ),
              const SizedBox(width: 10),
              Text(
                'Sharing Tariffs & Room Options',
                style: GoogleFonts.outfit(
                  fontSize: 15.5,
                  fontWeight: FontWeight.w800,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 2.2,
            ),
            itemCount: items.length,
            itemBuilder: (ctx, i) {
              final item = items[i];
              final label = labels[item.key] ?? item.key.replaceAll('_', ' ').toUpperCase();
              final price = item.value;
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF5F3FF),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? const Color(0xFF4338CA) : const Color(0xFFC4B5FD),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF5B21B6),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '₹${_formatNumber(price)}/mo',
                      style: GoogleFonts.outfit(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: isDark ? Colors.white : const Color(0xFF7B3AEC),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildReviewsSection(bool isDark) {
    double avgRating = 0;
    if (_reviews.isNotEmpty) {
      final total = _reviews.fold<double>(0, (sum, r) => sum + ((r['rating'] as num?)?.toDouble() ?? 5.0));
      avgRating = total / _reviews.length;
    }

    return Container(
      margin: const EdgeInsets.only(top: 20, left: 16, right: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF59E0B).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 20),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Tenant Reviews & Real Pics',
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      Text(
                        _reviews.isEmpty ? 'No reviews yet' : '${_reviews.length} ${_reviews.length == 1 ? 'review' : 'reviews'} • ${avgRating.toStringAsFixed(1)} ★',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              ElevatedButton.icon(
                onPressed: _openAddReviewSheet,
                icon: const Icon(Icons.rate_review_rounded, size: 15, color: Colors.white),
                label: const Text('Review', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12.5)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7B3AEC),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
              ),
            ],
          ),

          if (_reviews.isEmpty) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline_rounded, color: Color(0xFF7B3AEC), size: 22),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Have you visited or stayed here? Share actual photos and ratings to help prospective tenants verify condition before visiting!',
                      style: TextStyle(
                        fontSize: 12.5,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                        height: 1.35,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 16),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _reviews.length,
              separatorBuilder: (_, __) => Divider(
                height: 24,
                color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
              ),
              itemBuilder: (ctx, idx) {
                final rev = _reviews[idx];
                final rating = (rev['rating'] as num?)?.toInt() ?? 5;
                final reviewerName = rev['user_name'] ?? 'Tenant';
                final reviewerAvatar = rev['user_avatar'];
                final comment = rev['review_text'] ?? '';
                final List photos = rev['photo_urls'] is List ? rev['photo_urls'] : [];

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: const Color(0xFF7B3AEC).withOpacity(0.15),
                          backgroundImage: reviewerAvatar != null && reviewerAvatar.toString().isNotEmpty
                              ? NetworkImage(reviewerAvatar.toString())
                              : null,
                          child: reviewerAvatar == null
                              ? Text(
                                  reviewerName.isNotEmpty ? reviewerName[0].toUpperCase() : 'U',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF7B3AEC), fontSize: 13),
                                )
                              : null,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                reviewerName,
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13.5,
                                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                                ),
                              ),
                              Row(
                                children: List.generate(5, (starIdx) {
                                  return Icon(
                                    starIdx < rating ? Icons.star_rounded : Icons.star_outline_rounded,
                                    size: 14,
                                    color: const Color(0xFFF59E0B),
                                  );
                                }),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (comment.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        comment,
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                          height: 1.4,
                        ),
                      ),
                    ],
                    if (photos.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      SizedBox(
                        height: 70,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: photos.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (pCtx, pIdx) {
                            final photoUrl = photos[pIdx].toString();
                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => FullScreenImageViewer(
                                      imageUrls: photos.map((e) => e.toString()).toList(),
                                      initialIndex: pIdx,
                                    ),
                                  ),
                                );
                              },
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: CachedNetworkImage(
                                  imageUrl: photoUrl,
                                  width: 70,
                                  height: 70,
                                  fit: BoxFit.cover,
                                  placeholder: (_, __) => Container(
                                    width: 70,
                                    height: 70,
                                    color: Colors.grey.shade200,
                                    child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                                  ),
                                  errorWidget: (_, __, ___) => Container(
                                    width: 70,
                                    height: 70,
                                    color: Colors.grey.shade200,
                                    child: const Icon(Icons.broken_image, size: 20, color: Colors.grey),
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ],
                );
              },
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _purchasePlan(int amount, String desc, {int unlocks = 1}) async {
    _pendingAmount = amount;
    _pendingUnlocks = unlocks;
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    try {
      String? planId;
      if (desc != 'Visitor Pass' && desc != 'Premium Visitor Pass') {
        if (amount == 50) planId = 'single';
        else if (amount == 100) planId = 'starter';
        else if (amount == 200) planId = 'growth';
        else if (amount >= 500) planId = 'unlimited';
        else planId = 'single';
      }

      final Map<String, dynamic> bodyPayload = {
        'amount': amount * 100,
        'roomId': widget.id,
      };
      if (planId != null) {
        bodyPayload['planId'] = planId;
      }

      String keyId = 'rzp_live_SqU0ZW4NCgp5jo';
      String? orderId;

      try {
        final response = await supabase.functions.invoke('create-razorpay-order', body: bodyPayload);
        final data = response.data;
        if (data != null && data['id'] != null) {
          orderId = data['id'];
          if (data['keyId'] != null) keyId = data['keyId'];
        }
      } catch (fnErr) {
        debugPrint('create-razorpay-order edge function warning: $fnErr');
      }

      if (context.mounted) Navigator.pop(context);

      final Map<String, dynamic> options = {
        'key': keyId,
        'amount': amount * 100,
        'name': 'Takevolet',
        'description': desc,
        'theme': {
          'color': '#0F172A'
        },
        'prefill': {
          'contact': supabase.auth.currentUser?.phone ?? '',
          'email': supabase.auth.currentUser?.email ?? 'user@takevolet.com'
        }
      };

      if (orderId != null) {
        options['order_id'] = orderId;
      }

      _razorpay.open(options);
    } catch (e) {
      if (context.mounted) {
        try { Navigator.pop(context); } catch (_) {}
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Payment Error 🚨', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            content: Text('Could not start payment:\n\n$e'),
            actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
          ),
        );
      }
    }
  }

  void _showUnlockDialog() {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Unlock Contact'),
          content: Text('You have $_contactBalance contacts remaining.\nUse 1 to unlock this contact?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  await supabase.from('contact_unlocks').insert({'room_id': widget.id, 'user_id': supabase.auth.currentUser!.id});
                  await supabase.from('profiles').update({'contact_balance': _contactBalance - 1}).eq('id', supabase.auth.currentUser!.id);
                  setState(() {
                    _contactBalance--;
                    _hasUnlocked = true;
                  });
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Contact Unlocked!'), backgroundColor: Colors.green));
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red));
                  }
                }
              },
              child: const Text('Unlock'),
            ),
          ],
        ),
      );
  }

  void _showUnlockSheet() {
    final String location = (room!['location'] ?? '').toLowerCase();
    final String city = (room!['city'] ?? '').toLowerCase();
    // Contact plans only
    final List<Map<String, dynamic>> plans = [
      {'title': 'Single Contact', 'subtitle': '1 Room', 'price': 50, 'color': Colors.blue, 'unlocks': 1},
      {'title': 'Quick Connect', 'subtitle': '5 Rooms', 'price': 100, 'color': Colors.orange, 'unlocks': 5},
      {'title': 'Smart Connect', 'subtitle': '15 Rooms', 'price': 200, 'color': Colors.purple, 'isBestValue': true, 'unlocks': 15},
      {'title': 'Mega Connect', 'subtitle': '50 Rooms', 'price': 500, 'color': Colors.green, 'unlocks': 50},
    ];

    Map<String, dynamic>? selectedPlan = plans[2]; // Default to Smart Connect (15 Rooms - ₹200)

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                children: [
                  Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
                  const SizedBox(height: 20),
                  const Text('Unlock Contact', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const Text('Note: no brokers involved', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Choose a plan to contact the owner directly', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 20),
                  Expanded(
                    child: ListView.builder(
                      itemCount: plans.length,
                      itemBuilder: (context, index) {
                        final plan = plans[index];
                        final isSelected = selectedPlan == plan;
                        final isVisitor = plan['isVisitor'] == true;
                        
                        return GestureDetector(
                          onTap: () {
                            setModalState(() {
                              selectedPlan = plan;
                            });
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected ? plan['color'] : (plan['isBestValue'] == true ? plan['color'].withOpacity(0.5) : Colors.grey[200]!),
                                width: isSelected ? 2 : 1,
                              ),
                              boxShadow: [if (isSelected) BoxShadow(color: plan['color'].withOpacity(0.2), blurRadius: 8, offset: const Offset(0, 4))],
                            ),
                            child: Stack(
                              children: [
                                if (plan['isBestValue'] == true)
                                  Positioned(
                                    top: 0, right: 12,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(color: plan['color'], borderRadius: const BorderRadius.vertical(bottom: Radius.circular(6))),
                                      child: const Text('BEST VALUE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                if (isSelected)
                                  Positioned(
                                    top: 16, right: 16,
                                    child: Icon(Icons.check_circle, color: plan['color'], size: 24),
                                  ),
                                ListTile(
                                  contentPadding: const EdgeInsets.all(16),
                                  leading: CircleAvatar(
                                    backgroundColor: plan['color'].withOpacity(0.1),
                                    child: Icon(Icons.bolt, color: plan['color']),
                                  ),
                                  title: Text(plan['title'], style: const TextStyle(fontWeight: FontWeight.bold)),
                                  subtitle: Text(plan['subtitle'], style: const TextStyle(color: Colors.grey)),
                                  trailing: isSelected ? null : Text('₹${plan['price']}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: plan['color'])),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: selectedPlan != null ? () {
                        Navigator.pop(context); // close modal first
                        _purchasePlan(selectedPlan!['price'], selectedPlan!['title'], unlocks: selectedPlan!['unlocks'] ?? 1); // selectedPlan!['title']);
                      } : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: selectedPlan != null ? Theme.of(context).colorScheme.primary : Colors.grey,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(selectedPlan != null ? 'Proceed to Pay ₹${selectedPlan!['price']}' : 'Select a Plan', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _formatPartiallyRevealedPhone(String? rawPhone) {
    if (rawPhone == null || rawPhone.trim().isEmpty) return '+91 98•• ••••••';
    final digits = rawPhone.replaceAll(RegExp(r'\D'), '');
    if (digits.length >= 10) {
      final p = digits.length == 12 && digits.startsWith('91') ? digits.substring(2) : digits;
      if (p.length >= 4) {
        final first4 = p.substring(0, 4);
        return '+91 $first4 •• ••••';
      }
    } else if (digits.length >= 4) {
      return '+91 ${digits.substring(0, 4)} •• ••••';
    }
    return '+91 98•• ••••••';
  }

  Widget _buildContactUnlockedCard() {
    final name = posterProfile?['full_name'] ?? room?['title'] ?? 'Owner';
    final phone = posterProfile?['phone'] ?? '';
    final whatsapp = posterProfile?['whatsapp'] ?? phone;
    final profession = posterProfile?['profession'] ?? '';
    final avatar = posterProfile?['avatar_url'];
    final fullAddress = room?['full_address'] ?? room?['house_no'] ?? '';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green.shade50, Colors.green.shade100.withOpacity(0.5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.green.shade300),
        boxShadow: [BoxShadow(color: Colors.green.withOpacity(0.15), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          // Header
          Row(children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.green.shade400, borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.check_circle, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Contact Unlocked ✅', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green)),
                Text('You can now contact the owner', style: TextStyle(color: Colors.grey, fontSize: 12)),
              ]),
            ),
          ]),
          const SizedBox(height: 20),
          // Owner info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
            child: Column(
              children: [
                Row(children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: const Color(0xFF7B3AEC).withOpacity(0.2),
                    backgroundImage: avatar != null ? NetworkImage(avatar) : null,
                    child: avatar == null ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'O', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: Color(0xFF7B3AEC))) : null,
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                    if (profession.isNotEmpty)
                      Text(profession, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                  ])),
                ]),
                if (phone.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(10)),
                    child: Row(children: [
                      Icon(Icons.phone, color: Colors.green[600], size: 18),
                      const SizedBox(width: 10),
                      Text(phone, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16, letterSpacing: 0.5)),
                    ]),
                  ),
                ],
                if (fullAddress.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(10)),
                    child: Row(children: [
                      Icon(Icons.location_on, color: Colors.orange[700], size: 18),
                      const SizedBox(width: 10),
                      Expanded(child: Text(fullAddress, style: TextStyle(color: Colors.grey[800], fontSize: 13))),
                    ]),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPosterInfoCard() {
    final name = (posterProfile?['full_name'] ?? '').toString().trim();
    final displayName = name.isNotEmpty ? name : 'Takevolet Partner';
    final avatar = posterProfile?['avatar_url'];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row with verified pill
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'POSTED BY',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF64748B),
                  letterSpacing: 1.2,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF86EFAC)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.verified_rounded, size: 13, color: Color(0xFF16A34A)),
                    SizedBox(width: 4),
                    Text(
                      'Verified Listing',
                      style: TextStyle(
                        color: Color(0xFF16A34A),
                        fontWeight: FontWeight.w800,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Poster Profile Info
          Row(
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF7B3AEC), width: 2),
                ),
                child: CircleAvatar(
                  radius: 28,
                  backgroundColor: const Color(0xFF0F172A),
                  backgroundImage: avatar != null ? CachedNetworkImageProvider(avatar) : null,
                  child: avatar == null
                      ? Text(
                          displayName.isNotEmpty ? displayName[0].toUpperCase() : 'T',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: Color(0xFF7B3AEC)),
                        )
                      : null,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 3),
                    const Row(
                      children: [
                        Icon(Icons.star_rounded, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star_rounded, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star_rounded, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star_rounded, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star_rounded, color: Color(0xFF7B3AEC), size: 16),
                        SizedBox(width: 6),
                        Text(
                          'Takevolet Partner',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF6D28D9),
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Masked Contact Box (With First 4 Digits Revealed for Verification)
          Builder(
            builder: (context) {
              final isDark = Theme.of(context).brightness == Brightness.dark;
              final rawPhone = (room?['custom_contact'] ?? posterProfile?['phone'] ?? '').toString();
              final revealedPhone = _formatPartiallyRevealedPhone(rawPhone);
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(Icons.lock_rounded, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569), size: 18),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            revealedPhone,
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w900,
                              color: isDark ? Colors.white : const Color(0xFF1E293B),
                              letterSpacing: 1.5,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Verified Contact • First 4 digits revealed',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
          const SizedBox(height: 14),

          // Trust Micro Badges
          Row(
            children: [
              _buildTrustBadge(Icons.shield_outlined, '100% Genuine'),
              const SizedBox(width: 8),
              _buildTrustBadge(Icons.person_outline, 'Direct Owner'),
              const SizedBox(width: 8),
              _buildTrustBadge(Icons.bolt, 'Instant Unlock'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTrustBadge(IconData icon, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 13, color: const Color(0xFF475569)),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF334155),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomActionButtons() {
    if (_hasUnlocked) {
      final phone = posterProfile?['phone'] ?? '';
      final whatsapp = posterProfile?['whatsapp'] ?? phone;
      return Row(children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: phone.isNotEmpty ? () => launchUrl(Uri.parse('tel:$phone')) : null,
            icon: const Icon(Icons.call, size: 18),
            label: const Text('Call Now', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green[600],
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: whatsapp.isNotEmpty
                ? () => launchUrl(Uri.parse('https://wa.me/${whatsapp.replaceAll(RegExp(r'[^\d]'), '')}'))
                : null,
            icon: const Icon(Icons.message, size: 18),
            label: const Text('WhatsApp', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF25D366),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
          ),
        ),
      ]);
    } else {
      return InkWell(
        onTap: _contactBalance > 0 ? _showUnlockDialog : _showUnlockSheet,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          height: 56,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF7B3AEC), Color(0xFF6D28D9)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF7B3AEC).withOpacity(0.35),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.lock_open_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 10),
              Text(
                'Unlock Owner Details',
                style: GoogleFonts.outfit(
                  fontSize: 16.5,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'DIRECT ACCESS',
                  style: GoogleFonts.outfit(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF6D28D9),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (room == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Room not found')));

    final images = ImageUtils.parseImages(room!['images']);
    final metadata = room!['metadata'] ?? {};
    final type = (room!['type'] ?? room!['listing_type'] ?? room!['category'] ?? '').toString().toLowerCase();
    final bool isDayWise = type.contains('day') || room!['is_day_wise'] == true || (metadata['duration'] != null || metadata['duration_hours'] != null);
    final bool isPg = type.contains('pg') || type.contains('hostel') || (metadata['sharing'] != null);
    if (images.isEmpty) {
      final imgStr = room!['image'] as String?;
      if (imgStr != null && imgStr.isNotEmpty) images.add(imgStr);
      else images.add('https://images.unsplash.com/photo-1502690266266-ce3f2824cd16?w=800&q=80');
    }

    final rawVideo = (room!['video_url'] ?? metadata['video_url'])?.toString().trim();
    final String? videoUrl = (rawVideo != null && rawVideo.isNotEmpty) ? rawVideo : null;

    final List<Map<String, String>> mediaItems = [];
    if (images.isNotEmpty) {
      mediaItems.add({'type': 'image', 'url': images[0]});
    }
    if (videoUrl != null) {
      mediaItems.add({'type': 'video', 'url': videoUrl});
    }
    if (images.length > 1) {
      for (int i = 1; i < images.length; i++) {
        mediaItems.add({'type': 'image', 'url': images[i]});
      }
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                children: [
                  PageView.builder(
                    controller: _pageController,
                    onPageChanged: (i) => setState(() => _currentImageIndex = i),
                    itemCount: mediaItems.length,
                    itemBuilder: (context, index) {
                      final item = mediaItems[index];
                      if (item['type'] == 'video') {
                        return Container(
                          color: Colors.black,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              FeedVideoPlayer(videoUrl: item['url']!),
                              Positioned(
                                top: 45,
                                left: 16,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.65),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white24),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.videocam_rounded, color: Color(0xFFA78BFA), size: 14),
                                      SizedBox(width: 5),
                                      Text('PROPERTY VIDEO', style: TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }
                      return InkWell(
                        onTap: () {
                          final imgIndex = images.indexOf(item['url']!);
                          Navigator.push(context, MaterialPageRoute(builder: (_) => FullScreenImageViewer(
                            imageUrls: images,
                            initialIndex: imgIndex >= 0 ? imgIndex : 0,
                          )));
                        },
                        child: CachedNetworkImage(imageUrl: item['url']!, fit: BoxFit.cover,
                          placeholder: (_, __) => Container(color: Colors.grey[200])),
                      );
                    },
                  ),
                  if (mediaItems.length > 1) ...[
                    Positioned(left: 10, top: 0, bottom: 0, child: Center(child: IconButton(
                      icon: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 28),
                      onPressed: () => _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut),
                    ))),
                    Positioned(right: 10, top: 0, bottom: 0, child: Center(child: IconButton(
                      icon: const Icon(Icons.arrow_forward_ios, color: Colors.white, size: 28),
                      onPressed: () => _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut),
                    ))),
                    Positioned(
                      bottom: 20, left: 0, right: 0,
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(mediaItems.length, (i) {
                        final isSelected = _currentImageIndex == i;
                        final isVideo = mediaItems[i]['type'] == 'video';
                        if (isVideo) {
                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              color: isSelected ? const Color(0xFF7B3AEC) : Colors.black.withValues(alpha: 0.55),
                              border: Border.all(color: isSelected ? Colors.white : Colors.white24),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.play_arrow_rounded, size: 12, color: isSelected ? Colors.white : Colors.white70),
                                const SizedBox(width: 2),
                                Text('Video', style: TextStyle(color: isSelected ? Colors.white : Colors.white70, fontSize: 10, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          );
                        }
                        return Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: isSelected ? 12 : 8, height: isSelected ? 12 : 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isSelected ? Theme.of(context).colorScheme.primary : Colors.white.withValues(alpha: 0.5),
                          ),
                        );
                      })),
                    ),
                  ],
                  Positioned(
                    top: 40, right: 10,
                    child: IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
                        child: const Icon(Icons.share, color: Colors.white, size: 20),
                      ),
                      onPressed: () {
                        ShareUtils.generateRoomShare(context, room!);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category Badge + Available Badge
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF5F3FF),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFDDD6FE)),
                            ),
                            child: Text(
                              isDayWise ? 'DAY-WISE STAY' : (isPg ? 'PG / HOSTEL' : 'ROOM / FLAT'),
                              style: const TextStyle(
                                color: Color(0xFF7B3AEC),
                                fontWeight: FontWeight.w900,
                                fontSize: 11,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFF86EFAC)),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF16A34A)),
                                SizedBox(width: 4),
                                Text(
                                  'Available Now',
                                  style: TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.w800, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Listing Title
                      Text(
                        room!['title'] ?? 'Premium Room',
                        style: GoogleFonts.outfit(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF0F172A),
                          letterSpacing: -0.5,
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 10),

                      // High-visibility Location Badge (NO ash color, NO leading comma!)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFCBD5E1)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.location_on_rounded, color: Color(0xFFE11D48), size: 18),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                [
                                  if ((room!['colony'] ?? '').toString().trim().isNotEmpty) (room!['colony'] ?? '').toString().trim(),
                                  if ((room!['location'] ?? '').toString().trim().isNotEmpty) (room!['location'] ?? '').toString().trim(),
                                  if ((room!['city'] ?? '').toString().trim().isNotEmpty && (room!['city'] ?? '').toString().trim().toLowerCase() != (room!['location'] ?? '').toString().trim().toLowerCase()) (room!['city'] ?? '').toString().trim(),
                                ].where((e) => e.isNotEmpty).join(', ').isNotEmpty
                                    ? [
                                        if ((room!['colony'] ?? '').toString().trim().isNotEmpty) (room!['colony'] ?? '').toString().trim(),
                                        if ((room!['location'] ?? '').toString().trim().isNotEmpty) (room!['location'] ?? '').toString().trim(),
                                        if ((room!['city'] ?? '').toString().trim().isNotEmpty && (room!['city'] ?? '').toString().trim().toLowerCase() != (room!['location'] ?? '').toString().trim().toLowerCase()) (room!['city'] ?? '').toString().trim(),
                                      ].where((e) => e.isNotEmpty).join(', ')
                                    : 'Location verified with owner',
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                                softWrap: true,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Modern Ultra-Clean Pricing Card
                      Builder(
                        builder: (context) {
                          final isDark = Theme.of(context).brightness == Brightness.dark;
                          return Container(
                            margin: const EdgeInsets.only(top: 16),
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: isDark
                                    ? [const Color(0xFF1E1B4B), const Color(0xFF0F172A)]
                                    : [const Color(0xFFFAF5FF), const Color(0xFFF3E8FF)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isDark ? const Color(0xFF4338CA) : const Color(0xFFDDD6FE),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF7B3AEC).withOpacity(isDark ? 0.25 : 0.12),
                                  blurRadius: 16,
                                  offset: const Offset(0, 5),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF7B3AEC).withOpacity(0.15),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(Icons.currency_rupee_rounded, size: 12, color: Color(0xFF7B3AEC)),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'MONTHLY TARIFF',
                                          style: GoogleFonts.outfit(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF7B3AEC),
                                            letterSpacing: 1.2,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.baseline,
                                      textBaseline: TextBaseline.alphabetic,
                                      children: [
                                        Text(
                                          '₹${_formatNumber(room!['rent'])}',
                                          style: GoogleFonts.outfit(
                                            fontSize: 30,
                                            fontWeight: FontWeight.w900,
                                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                                            letterSpacing: -0.5,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          isDayWise
                                              ? (metadata['duration'] != null && metadata['duration'].toString().trim().isNotEmpty
                                                  ? '/ ${metadata['duration'].toString().trim()}'
                                                  : (metadata['duration_hours'] != null
                                                      ? '/ ${metadata['duration_hours']} hrs'
                                                      : '/ day'))
                                              : (isPg ? '/ month' : '/ month'),
                                          style: GoogleFonts.outfit(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFF059669), Color(0xFF047857)],
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF059669).withOpacity(0.3),
                                        blurRadius: 8,
                                        offset: const Offset(0, 3),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.shield_rounded, color: Colors.white, size: 14),
                                      const SizedBox(width: 5),
                                      Text(
                                        '0 Brokerage',
                                        style: GoogleFonts.outfit(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 11.5,
                                          letterSpacing: 0.3,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),

                      // Sharing Tariffs for PGs / Hostels (if multi-sharing prices are specified)
                      _buildPgSharingTariffsCard(metadata, Theme.of(context).brightness == Brightness.dark),

                      // Box-Oriented Overview & Specifications Card
                      Container(
                        margin: const EdgeInsets.only(top: 20),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF7B3AEC).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.apartment_rounded, color: Color(0xFF6D28D9), size: 18),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                'Overview & Highlights',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                              ),
                            ]),
                            const SizedBox(height: 14),
                            Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: [
                                _buildOverviewBox(Icons.wc_rounded, 'Preference', metadata['gender_preference']?.toString() ?? room!['gender_preference']?.toString() ?? 'Any'),
                                _buildOverviewBox(Icons.chair_rounded, 'Furnishing', metadata['furnishing']?.toString() ?? room!['furnishing']?.toString() ?? 'Furnished'),
                                _buildOverviewBox(Icons.group_rounded, 'Capacity', '${metadata['members_allowed']?.toString() ?? room!['members_allowed']?.toString() ?? 1} Max'),
                                if ((metadata['parking'] ?? room!['parking']) != null && (metadata['parking'] ?? room!['parking']) != 'None')
                                  _buildOverviewBox(Icons.local_parking_rounded, 'Parking', (metadata['parking'] ?? room!['parking']).toString()),
                                if (isDayWise && metadata['duration'] != null)
                                  _buildOverviewBox(Icons.schedule_rounded, 'Duration', metadata['duration'].toString()),
                                if (isPg && metadata['sharing'] != null)
                                  _buildOverviewBox(Icons.hotel_rounded, 'Sharing', metadata['sharing'].toString()),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Box-Oriented Additional Specifications Card
                      if (metadata.keys.any((k) => !['gender_preference', 'furnishing', 'members_allowed', 'parking', 'commission', 'tenant_type', 'duration', 'duration_hours', 'sharing'].contains(k))) ...[
                        Container(
                          margin: const EdgeInsets.only(top: 16),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3)),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF7B3AEC).withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.tune_rounded, color: Color(0xFF6D28D9), size: 18),
                                ),
                                const SizedBox(width: 10),
                                const Text(
                                  'Additional Specifications',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                                ),
                              ]),
                              const SizedBox(height: 14),
                              Wrap(
                                spacing: 10,
                                runSpacing: 10,
                                children: metadata.entries
                                  .where((e) => !['gender_preference', 'furnishing', 'members_allowed', 'parking', 'commission', 'tenant_type', 'duration', 'duration_hours', 'sharing'].contains(e.key))
                                  .where((e) {
                                    if (e.value == null) return false;
                                    if (e.value is List && (e.value as List).isEmpty) return false;
                                    if (e.value.toString().trim().isEmpty) return false;
                                    return true;
                                  })
                                  .map<Widget>((e) {
                                    String val;
                                    if (e.value is List) {
                                      val = (e.value as List).map((x) => x.toString()).join(', ');
                                    } else {
                                      val = e.value.toString().replaceAll('_', ' ');
                                    }
                                    final keyName = e.key.replaceAll('_', ' ').split(' ').map((s) => s.isNotEmpty ? '${s[0].toUpperCase()}${s.substring(1)}' : '').join(' ');
                                    return _buildOverviewBox(Icons.info_outline_rounded, keyName, val);
                                  })
                                  .toList(),
                              ),
                            ],
                          ),
                        ),
                      ],

                      // Box-Oriented Property Description Card (Bold, High Contrast, Rich UI)
                      Container(
                        margin: const EdgeInsets.only(top: 16),
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF7B3AEC).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.notes_rounded, color: Color(0xFF6D28D9), size: 18),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                'Property Description',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                              ),
                            ]),
                            const SizedBox(height: 12),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Text(
                                (room!['description'] != null && room!['description'].toString().trim().isNotEmpty)
                                    ? room!['description'].toString().trim()
                                    : 'All genuine amenities and standard facilities are provided with this listing. Contact the owner directly to schedule a physical walkthrough or for further inquiries.',
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700, // BOLD
                                  height: 1.6,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // CONTACT UNLOCKED CARD
                if (_hasUnlocked) _buildContactUnlockedCard()
                else ...[
                  _buildPosterInfoCard(),
                  const SizedBox(height: 16),
                ],

                // TENANT REVIEWS & REAL VISITOR PHOTOS SECTION
                _buildReviewsSection(Theme.of(context).brightness == Brightness.dark),

                const SizedBox(height: 24),
              ],
            ),
          )
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24), // padding for bottom safe area
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: _buildBottomActionButtons(),
        ),
      ),
      bottomSheet: const SizedBox.shrink(),
    );
  }

  Widget _buildOverviewChip(IconData icon, String label) {
    return Container(
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width - 48),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 8),
          Flexible(
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
              softWrap: true,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOverviewBox(IconData icon, String title, String value) {
    return Container(
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width / 2 - 28),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFF7B3AEC).withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: const Color(0xFF6D28D9)),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF64748B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                  softWrap: true,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
