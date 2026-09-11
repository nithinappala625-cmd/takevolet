import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:url_launcher/url_launcher_string.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../widgets/smart_image.dart';
import '../../utils/share_utils.dart';
import '../feed/feed_video_player.dart';

class FlatDetailScreen extends StatefulWidget {
  final String id;
  const FlatDetailScreen({super.key, required this.id});

  @override
  State<FlatDetailScreen> createState() => _FlatDetailScreenState();
}

class _FlatDetailScreenState extends State<FlatDetailScreen> {
  Map<String, dynamic>? flat;
  bool _isLoading = true;
  int _currentImageIndex = 0;
  bool _hasUnlocked = false;
  late Razorpay _razorpay;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _fetchFlatDetails();
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _fetchFlatDetails() async {
    try {
      final res = await Supabase.instance.client.from('property_sales').select().eq('id', widget.id).single();
      setState(() => flat = res);
      
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        if (res['user_id'] == user.id) {
          setState(() => _hasUnlocked = true);
        } else {
          try {
            final unlocks = await Supabase.instance.client.from('contact_unlocks').select('flat_sale_id').eq('user_id', user.id).eq('flat_sale_id', widget.id);
            if (unlocks.isNotEmpty) {
              setState(() => _hasUnlocked = true);
            }
          } catch (_) {
            // Ignore if column doesn't exist yet
          }
        }
      }

      setState(() => _isLoading = false);
    } catch (e) {
      debugPrint('Error: $e');
      setState(() => _isLoading = false);
    }
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      await Supabase.instance.client.from('contact_unlocks').insert({
        'user_id': Supabase.instance.client.auth.currentUser!.id,
        'flat_sale_id': widget.id,
      });
      setState(() => _hasUnlocked = true);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Contact Unlocked Successfully!')));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Failed: ${response.message}')));
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('External Wallet Selected: ${response.walletName}')));
  }

  Future<void> _unlockContact() async {
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    try {
      final response = await Supabase.instance.client.functions.invoke('create-razorpay-order', body: {'amount': 4900}); // ₹49
      if (mounted) Navigator.pop(context);

      final data = response.data;
      var options = {
        'key': data['keyId'],
        'amount': 4900,
        'name': 'Takevolet',
        'description': 'Unlock Owner Contact',
        'order_id': data['id'],
        'prefill': {
          'contact': Supabase.instance.client.auth.currentUser?.phone ?? '',
          'email': Supabase.instance.client.auth.currentUser?.email ?? 'user@takevolet.com'
        }
      };
      _razorpay.open(options);
    } catch (e) {
      if (mounted) Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  String _formatPrice(int price) {
    if (price >= 10000000) return '₹${(price / 10000000).toStringAsFixed(2)} Cr';
    if (price >= 100000) return '₹${(price / 100000).toStringAsFixed(2)} L';
    return '₹${price.toString()}';
  }

  String _formatPartiallyRevealedPhone(String? rawPhone) {
    if (rawPhone == null || rawPhone.trim().isEmpty) return '+91 98•• ••••••';
    final digits = rawPhone.replaceAll(RegExp(r'\D'), '');
    if (digits.length >= 10) {
      final p = digits.length == 12 && digits.startsWith('91') ? digits.substring(2) : digits;
      if (p.length >= 4) return '+91 ${p.substring(0, 4)} •• ••••';
    } else if (digits.length >= 4) {
      return '+91 ${digits.substring(0, 4)} •• ••••';
    }
    return '+91 98•• ••••••';
  }

  Widget _buildSectionTitle(String title, {IconData? icon}) {
    return Row(
      children: [
        if (icon != null) ...[
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFF7B3AEC).withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFFA78BFA) : const Color(0xFF6D28D9), size: 18),
          ),
          const SizedBox(width: 10),
        ],
        Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: Theme.of(context).brightness == Brightness.dark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }

  Widget _buildSpecItem(IconData icon, String label, String value) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width / 2 - 28),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFF7B3AEC).withOpacity(isDark ? 0.25 : 0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: isDark ? const Color(0xFFA78BFA) : const Color(0xFF6D28D9), size: 16),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPropertySpecs(Map<String, dynamic> pOriginal) {
    final metadata = pOriginal['metadata'] ?? {};
    final p = {...pOriginal, ...metadata};
    final type = (p['property_category'] ?? p['property_type'] ?? '').toString().toLowerCase();
    final isPlot = type.contains('plot') || type.contains('land') || type.contains('farm') || type.contains('agricultural');
    final isCommercial = type.contains('commercial') || type.contains('shop') || type.contains('office') || type.contains('warehouse') || type.contains('godown');
    final isHouse = type.contains('house') || type.contains('villa') || type.contains('independent');

    List<Widget> specs = [];

    if (isPlot) {
      // === PLOT / LAND FIELDS ===
      final rawPlotArea = p['plot_area']?.toString() ?? p['area']?.toString() ?? '0';
      final areaUnits = p['area_units']?.toString() ?? 'Sq Yards';
      String formattedArea = rawPlotArea.trim();
      final hasUnit = ['sq', 'yd', 'yard', 'acre', 'cent', 'gunta', 'gaj', 'ft', 'meter']
          .any((u) => formattedArea.toLowerCase().contains(u));
      if (!hasUnit && areaUnits.isNotEmpty) {
        formattedArea = '$formattedArea $areaUnits';
      }
      if (rawPlotArea.isNotEmpty && rawPlotArea != '0') specs.add(_buildSpecItem(Icons.straighten, 'Plot Area', formattedArea));
      if ((p['facing'] ?? '').toString().isNotEmpty) specs.add(_buildSpecItem(Icons.compass_calibration, 'Facing', p['facing'].toString()));
      if ((p['survey_number'] ?? '').toString().isNotEmpty) specs.add(_buildSpecItem(Icons.numbers, 'Survey No.', p['survey_number'].toString()));
      if ((p['plot_number'] ?? '').toString().isNotEmpty) specs.add(_buildSpecItem(Icons.tag, 'Plot No.', p['plot_number'].toString()));
      if ((p['road_width'] ?? '').toString().isNotEmpty) specs.add(_buildSpecItem(Icons.add_road, 'Road Width', p['road_width'].toString()));
      if ((p['soil_type'] ?? '').toString().isNotEmpty) specs.add(_buildSpecItem(Icons.landscape, 'Soil Type', p['soil_type'].toString()));
      specs.add(_buildSpecItem(Icons.apartment, 'Property Type', p['property_type'] ?? type));
      // Boolean features
      final bools = <String>[];
      if (p['is_corner_plot'] == true) bools.add('Corner Plot');
      if (p['boundary_wall'] == true) bools.add('Boundary Wall');
      if (p['rera_approved'] == true) bools.add('RERA Approved');
      if (p['hmda_dtcp_approved'] == true) bools.add('HMDA/DTCP');
      if (p['electricity_available'] == true) bools.add('Electricity');
      if (p['water_available'] == true) bools.add('Water');
      if (p['drainage_available'] == true) bools.add('Drainage');
      if (p['bank_loan_available'] == true) bools.add('Bank Loan Available');
      if (p['borewell_available'] == true) bools.add('Borewell');
      if (p['farmhouse_available'] == true) bools.add('Farmhouse');
      if (bools.isNotEmpty) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: specs,
            ),
            const SizedBox(height: 12),
            const Text('Features & Approvals', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8, runSpacing: 8,
              children: bools.map((b) => Chip(
                label: Text(b, style: const TextStyle(fontSize: 12)),
                backgroundColor: const Color(0xFF7B3AEC).withOpacity(0.1),
                side: BorderSide(color: const Color(0xFF7B3AEC).withOpacity(0.3)),
              )).toList(),
            ),
          ],
        );
      }
    } else if (isCommercial) {
      // === COMMERCIAL FIELDS ===
      final shopArea = p['shop_area']?.toString() ?? p['area']?.toString() ?? '';
      if (shopArea.isNotEmpty && shopArea != '0') specs.add(_buildSpecItem(Icons.store, 'Shop Area', shopArea));
      if ((p['floor_type'] ?? '').toString().isNotEmpty && p['floor_type'] != '0') specs.add(_buildSpecItem(Icons.stairs, 'Floor', p['floor_type'].toString()));
      if ((p['ceiling_height'] ?? '').toString().isNotEmpty && p['ceiling_height'] != '0') specs.add(_buildSpecItem(Icons.height, 'Ceiling Ht.', p['ceiling_height'].toString()));
      if ((p['cabins'] ?? '').toString().isNotEmpty && p['cabins'] != '0') specs.add(_buildSpecItem(Icons.meeting_room, 'Cabins', p['cabins'].toString()));
      if ((p['workstations'] ?? '').toString().isNotEmpty && p['workstations'] != '0') specs.add(_buildSpecItem(Icons.desk, 'Workstations', p['workstations'].toString()));
      if (p['main_road_facing'] == true) specs.add(_buildSpecItem(Icons.add_road, 'Facing', 'Main Road'));
      if ((p['suitable_for'] ?? '').toString().isNotEmpty) specs.add(_buildSpecItem(Icons.business, 'Suitable For', p['suitable_for'].toString()));
      specs.add(_buildSpecItem(Icons.apartment, 'Property Type', p['property_type'] ?? type));
    } else {
      // === FLAT / APARTMENT / HOUSE / VILLA FIELDS ===
      final String bhk = (p['bhk'] ?? '').toString();
      if (bhk.isNotEmpty && bhk != '0') {
        specs.add(_buildSpecItem(Icons.king_bed, 'BHK', bhk));
      }
      
      final String size = p['flat_size_sft']?.toString() ?? p['area']?.toString() ?? '';
      if (size.isNotEmpty && size != '0') {
        String formattedSize = size;
        if (!formattedSize.toLowerCase().contains('sq') && !formattedSize.toLowerCase().contains('yard')) {
          formattedSize = '$formattedSize ${isHouse ? 'Sq Yards' : 'sqft'}';
        }
        specs.add(_buildSpecItem(Icons.square_foot, isHouse ? 'Area (Sq Yards)' : 'Built-up Area', formattedSize));
      }
      
      final String furn = (p['furnishing'] ?? p['furnishing_status'] ?? '').toString();
      if (furn.isNotEmpty) {
        specs.add(_buildSpecItem(Icons.chair, 'Furnishing', furn));
      }
      
      final String floor = p['floor_number']?.toString() ?? '';
      final String totalFloors = p['total_floors']?.toString() ?? '';
      if (isHouse) {
        if (totalFloors.isNotEmpty && totalFloors != '0') {
          specs.add(_buildSpecItem(Icons.stairs, 'Floors', totalFloors));
        }
      } else {
        if (floor.isNotEmpty && floor != '0' && totalFloors.isNotEmpty && totalFloors != '0') {
          specs.add(_buildSpecItem(Icons.stairs, 'Floor', '$floor of $totalFloors'));
        }
      }
      
      final String baths = (p['bathrooms'] ?? p['num_bathrooms'] ?? '').toString();
      if (baths.isNotEmpty && baths != '0') {
        specs.add(_buildSpecItem(Icons.bathtub, 'Bathrooms', baths));
      }
      
      final String balcs = (p['balcony_count'] ?? p['num_balconies'] ?? '').toString();
      if (balcs.isNotEmpty && balcs != '0') {
        specs.add(_buildSpecItem(Icons.balcony, 'Balconies', balcs));
      }
      
      final String age = (p['age_of_property'] ?? '').toString();
      if (age.isNotEmpty && age != '0') {
        specs.add(_buildSpecItem(Icons.history, 'Age', '$age yrs'));
      }
      
      final String facing = (p['facing'] ?? '').toString();
      if (facing.isNotEmpty) {
        specs.add(_buildSpecItem(Icons.compass_calibration, 'Facing', facing));
      }
      
      final String occupancy = (p['occupancy_status'] ?? '').toString();
      if (occupancy.isNotEmpty) {
        specs.add(_buildSpecItem(Icons.home, 'Occupancy', occupancy));
      }
      
      specs.add(_buildSpecItem(Icons.apartment, 'Property Type', p['property_category'] ?? p['property_type'] ?? 'Apartment'));
    }

    final knownFields = {
      'plot_area', 'area', 'area_units', 'facing', 'survey_number', 'plot_number', 'road_width', 'soil_type',
      'is_corner_plot', 'boundary_wall', 'rera_approved', 'hmda_dtcp_approved', 'electricity_available',
      'water_available', 'drainage_available', 'bank_loan_available', 'borewell_available', 'farmhouse_available',
      'shop_area', 'floor_type', 'ceiling_height', 'cabins', 'workstations', 'main_road_facing', 'suitable_for',
      'bhk', 'flat_size_sft', 'furnishing', 'furnishing_status', 'floor_number', 'total_floors', 'bathrooms',
      'num_bathrooms', 'balcony_count', 'num_balconies', 'age_of_property', 'occupancy_status'
    };
    
    for (var entry in metadata.entries) {
      if (!knownFields.contains(entry.key) && entry.value.toString().isNotEmpty && entry.value.toString() != 'false') {
        specs.add(_buildSpecItem(Icons.info_outline, entry.key.replaceAll('_', ' ').split(' ').map((s) => s.isNotEmpty ? '${s[0].toUpperCase()}${s.substring(1)}' : '').join(' '), entry.value.toString()));
      }
    }

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: specs,
    );
  }

  void _openFullScreenGallery(int startIndex, List<String> images) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.black,
          insetPadding: EdgeInsets.zero,
          child: Stack(
            children: [
              PageView.builder(
                controller: PageController(initialPage: startIndex),
                itemCount: images.length,
                itemBuilder: (context, index) {
                  return InteractiveViewer(
                    minScale: 1.0,
                    maxScale: 4.0,
                    child: SmartImage(imageUrl: images[index], fit: BoxFit.contain),
                  );
                },
              ),
              Positioned(
                top: 40,
                right: 20,
                child: IconButton(
                  icon: const Icon(Icons.close, color: Colors.white, size: 30),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (flat == null) return const Scaffold(body: Center(child: Text('Flat not found')));

    List<String> images = [if (flat!['cover_image'] != null) flat!['cover_image']];
    if (flat!['flat_images'] != null) {
      images.addAll(List<String>.from(flat!['flat_images']));
    }

    final rawVideo = flat!['video_url']?.toString().trim();
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

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final amenities = List<String>.from(flat!['amenities'] ?? []);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
                  child: const Icon(Icons.share, color: Colors.white, size: 20),
                ),
                onPressed: () {
                  ShareUtils.generatePropertyShare(context, flat!);
                },
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                children: [
                  if (mediaItems.isNotEmpty)
                    PageView.builder(
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
                        final imgIndex = images.indexOf(item['url']!);
                        return GestureDetector(
                          onTap: () => _openFullScreenGallery(imgIndex >= 0 ? imgIndex : 0, images),
                          child: SizedBox(
                            width: double.infinity,
                            child: SmartImage(imageUrl: item['url']!, fit: BoxFit.cover),
                          ),
                        );
                      },
                    )
                  else
                    Container(color: Colors.grey[300], child: const Center(child: Icon(Icons.home, size: 80, color: Colors.grey))),
                  
                  if (mediaItems.length > 1)
                    Positioned(
                      bottom: 20, left: 0, right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: mediaItems.asMap().entries.map((entry) {
                          final i = entry.key;
                          final isSelected = _currentImageIndex == i;
                          final isVideo = entry.value['type'] == 'video';
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
                            width: isSelected ? 16 : 8, height: 8,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(4),
                              color: isSelected ? const Color(0xFF7B3AEC) : Colors.white.withValues(alpha: 0.5),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Badges
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7B3AEC).withOpacity(isDark ? 0.25 : 0.12),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFF7B3AEC).withOpacity(0.4)),
                        ),
                        child: Text(
                          (flat!['property_category'] ?? flat!['property_type'] ?? 'PROPERTY').toString().toUpperCase(),
                          style: GoogleFonts.outfit(
                            color: isDark ? const Color(0xFFA78BFA) : const Color(0xFF6D28D9),
                            fontWeight: FontWeight.w800,
                            fontSize: 11,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669).withOpacity(isDark ? 0.2 : 0.1),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFF059669).withOpacity(0.3)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.verified_rounded, color: Color(0xFF059669), size: 14),
                            const SizedBox(width: 4),
                            Text(
                              'Verified Listing',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF059669),
                                fontWeight: FontWeight.w800,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Title
                  Text(
                    flat!['title'] ?? 'Property For ${(flat!['listing_type'] ?? 'Sale').toString().toUpperCase()}',
                    style: GoogleFonts.outfit(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // High-visibility Location Pill
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE11D48).withOpacity(0.12),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.location_on_rounded, color: Color(0xFFE11D48), size: 18),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            [
                              if ((flat!['locality'] ?? '').toString().isNotEmpty) flat!['locality'],
                              if ((flat!['village'] ?? '').toString().isNotEmpty) flat!['village'],
                              if ((flat!['mandal'] ?? '').toString().isNotEmpty) flat!['mandal'],
                              if ((flat!['district'] ?? '').toString().isNotEmpty) flat!['district'],
                              if ((flat!['city'] ?? '').toString().isNotEmpty) flat!['city'],
                            ].where((e) => e != null && e.toString().isNotEmpty).join(', '),
                            style: GoogleFonts.outfit(
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                              fontSize: 13.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Luxury Pricing Card
                  // Modern Ultra-Clean Pricing Card (matching Rooms/PGs)
                  Builder(
                    builder: (context) {
                      final isDark = Theme.of(context).brightness == Brightness.dark;
                      final isRent = (flat!['listing_type'] ?? 'Sale').toString().toLowerCase() == 'rent';
                      final listingType = (flat!['listing_type'] ?? (isRent ? 'RENT' : 'FOR SALE')).toString().toUpperCase();
                      return Container(
                        margin: const EdgeInsets.only(top: 14),
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
                                      isRent ? 'MONTHLY RENT' : 'EXPECTED PRICE',
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
                                      _formatPrice(flat!['expected_price'] ?? 0),
                                      style: GoogleFonts.outfit(
                                        fontSize: 30,
                                        fontWeight: FontWeight.w900,
                                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                                        letterSpacing: -0.5,
                                      ),
                                    ),
                                    if (isRent) ...[
                                      const SizedBox(width: 6),
                                      Text(
                                        '/ month',
                                        style: GoogleFonts.outfit(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF7B3AEC), Color(0xFF6D28D9)],
                                ),
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF7B3AEC).withOpacity(0.35),
                                    blurRadius: 8,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.verified_rounded, size: 14, color: Colors.white),
                                  const SizedBox(width: 4),
                                  Text(
                                    listingType,
                                    style: GoogleFonts.outfit(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w800,
                                      fontSize: 12,
                                      letterSpacing: 0.5,
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
                  const SizedBox(height: 24),

                  // Property Specifications Box
                  _buildSectionTitle('Property Specifications', icon: Icons.straighten_rounded),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(isDark ? 0.2 : 0.02),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: _buildPropertySpecs(flat!),
                  ),
                  const SizedBox(height: 24),

                  // Amenities & Facilities Box
                  if (!['plot', 'land', 'agricultural', 'farm'].any((e) => (flat!['property_category'] ?? flat!['property_type'] ?? '').toString().toLowerCase().contains(e)) && amenities.isNotEmpty) ...[
                    _buildSectionTitle('Amenities & Facilities', icon: Icons.pool_rounded),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(isDark ? 0.2 : 0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: amenities.map((a) => Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.check_circle_rounded, color: Color(0xFF059669), size: 14),
                              const SizedBox(width: 6),
                              Text(
                                a,
                                style: GoogleFonts.outfit(
                                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 12.5,
                                ),
                              ),
                            ],
                          ),
                        )).toList(),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Location Details Section
                  if ((flat!['village'] != null && flat!['village'].toString().isNotEmpty) || (flat!['mandal'] != null && flat!['mandal'].toString().isNotEmpty)) ...[
                    _buildSectionTitle('Location Specifics', icon: Icons.map_rounded),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(isDark ? 0.2 : 0.02),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          if ((flat!['locality'] ?? '').toString().isNotEmpty) _buildSpecItem(Icons.map, 'Locality', flat!['locality'].toString()),
                          if ((flat!['village'] ?? '').toString().isNotEmpty) _buildSpecItem(Icons.holiday_village, 'Village', flat!['village'].toString()),
                          if ((flat!['mandal'] ?? '').toString().isNotEmpty) _buildSpecItem(Icons.location_city, 'Mandal', flat!['mandal'].toString()),
                          if ((flat!['district'] ?? '').toString().isNotEmpty) _buildSpecItem(Icons.map_outlined, 'District', flat!['district'].toString()),
                          if ((flat!['state'] ?? '').toString().isNotEmpty) _buildSpecItem(Icons.public, 'State', flat!['state'].toString()),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Property Description Box
                  _buildSectionTitle('Property Description', icon: Icons.description_rounded),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(isDark ? 0.2 : 0.02),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      (flat!['description'] ?? '').toString().trim().isNotEmpty
                          ? flat!['description']
                          : 'Property verified by Homies Rentals. Contact owner directly for immediate scheduling.',
                      style: GoogleFonts.outfit(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        color: isDark ? const Color(0xFFE2E8F0) : const Color(0xFF0F172A),
                        height: 1.6,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Property Documents
                  if (flat!['document_url'] != null && flat!['document_url'].toString().isNotEmpty) ...[
                    _buildSectionTitle('Property Documents', icon: Icons.folder_shared_rounded),
                    const SizedBox(height: 12),
                    InkWell(
                      onTap: () => launchUrlString(flat!['document_url'], mode: LaunchMode.externalApplication),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF7B3AEC).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF7B3AEC)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFF6D28D9)),
                            const SizedBox(width: 10),
                            Text(
                              'View Verified Documents (PDF)',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF6D28D9),
                                fontWeight: FontWeight.w800,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                  
                  // RERA Details
                  if (flat!['rera_number'] != null && flat!['rera_number'].toString().isNotEmpty) ...[
                    _buildSectionTitle('RERA Registration', icon: Icons.verified_user_rounded),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF6EE7B7)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.check_circle_rounded, color: Color(0xFF059669), size: 20),
                          const SizedBox(width: 10),
                          Text(
                            'RERA ID: ${flat!['rera_number']}',
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.w800,
                              color: const Color(0xFF065F46),
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],



                  // Contact Owner Section
                  _buildSectionTitle('Owner / Agent Contact', icon: Icons.person_rounded),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: _hasUnlocked ? const Color(0xFF059669).withOpacity(0.4) : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                        width: _hasUnlocked ? 1.5 : 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(isDark ? 0.2 : 0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: _hasUnlocked
                        ? Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF059669).withOpacity(0.12),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.person, color: Color(0xFF059669), size: 28),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      flat!['owner_name'] ?? 'Property Owner',
                                      style: GoogleFonts.outfit(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w900,
                                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Phone: ${flat!['owner_mobile'] ?? 'Verified'}',
                                      style: GoogleFonts.outfit(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                        color: const Color(0xFF059669),
                                      ),
                                    ),
                                    if (flat!['alt_contact'] != null && flat!['alt_contact'].toString().isNotEmpty) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        'Alt: ${flat!['alt_contact']}',
                                        style: GoogleFonts.outfit(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          )
                        : Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF7B3AEC).withOpacity(isDark ? 0.25 : 0.12),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.lock_rounded, color: Color(0xFF7B3AEC), size: 24),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      flat!['owner_name'] ?? 'Property Owner',
                                      style: GoogleFonts.outfit(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w900,
                                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF7B3AEC).withOpacity(isDark ? 0.25 : 0.1),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        'Phone: ${_formatPartiallyRevealedPhone(flat!['owner_mobile']?.toString() ?? flat!['contact_phone']?.toString())}',
                                        style: GoogleFonts.outfit(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w800,
                                          color: isDark ? const Color(0xFFA78BFA) : const Color(0xFF7B3AEC),
                                          letterSpacing: 0.8,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      'Unlock instantly to reveal full phone number & call directly.',
                                      style: GoogleFonts.outfit(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: !_hasUnlocked ? SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
          child: InkWell(
            onTap: _unlockContact,
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
                    'Unlock Owner Contact (₹49)',
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
                      'INSTANT ACCESS',
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
          ),
        ),
      ) : SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton.icon(
              onPressed: () => launchUrl(Uri.parse('tel:${flat!['owner_mobile']}')),
              icon: const Icon(Icons.phone),
              label: Text('Call ${flat!['owner_name'] ?? 'Owner'}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            ),
          ),
        ),
      ),
    );
  }
}
