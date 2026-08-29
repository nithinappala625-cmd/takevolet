import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:url_launcher/url_launcher_string.dart';
import '../../widgets/smart_image.dart';
import '../../utils/share_utils.dart';

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

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildSpecItem(IconData icon, String label, String value) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: const Color(0xFFD4AF37), size: 20),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
            const SizedBox(height: 2),
            Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          ],
        )
      ],
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
      final plotArea = p['plot_area']?.toString() ?? p['area']?.toString() ?? '0';
      final areaUnits = p['area_units']?.toString() ?? 'Sq Yards';
      if (plotArea.isNotEmpty && plotArea != '0') specs.add(_buildSpecItem(Icons.straighten, 'Plot Area', '$plotArea $areaUnits'));
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
            GridView.count(
              crossAxisCount: 2, shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(), childAspectRatio: 3,
              children: specs,
            ),
            const SizedBox(height: 12),
            const Text('Features & Approvals', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8, runSpacing: 8,
              children: bools.map((b) => Chip(
                label: Text(b, style: const TextStyle(fontSize: 12)),
                backgroundColor: const Color(0xFFD4AF37).withOpacity(0.1),
                side: BorderSide(color: const Color(0xFFD4AF37).withOpacity(0.3)),
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
        specs.add(_buildSpecItem(Icons.square_foot, isHouse ? 'Area (Sq Yards)' : 'Built-up Area', '$size ${isHouse ? 'Sq Yards' : 'sqft'}'));
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

    return GridView.count(
      crossAxisCount: 2, shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(), childAspectRatio: 3,
      children: specs,
    );
  }

  void _openFullScreenGallery(int startIndex, List<String> images) {
    int currentIndex = startIndex;
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
                onPageChanged: (index) => currentIndex = index,
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
                  final String title = flat!['title'] ?? 'Property for Sale';
                  final String desc = 'Price: ₹${flat!['price']}\nLocation: ${flat!['location']}';
                  ShareUtils.shareListing(
                    context: context,
                    title: title,
                    description: desc,
                    imageUrl: images.isNotEmpty ? images.first : null,
                  );
                },
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                children: [
                  if (images.isNotEmpty)
                    PageView.builder(
                      onPageChanged: (i) => setState(() => _currentImageIndex = i),
                      itemCount: images.length,
                      itemBuilder: (context, index) {
                        return GestureDetector(
                          onTap: () => _openFullScreenGallery(index, images),
                          child: SizedBox(
                            width: double.infinity,
                            child: SmartImage(imageUrl: images[index], fit: BoxFit.cover),
                          ),
                        );
                      },
                    )
                  else
                    Container(color: Colors.grey[300], child: const Center(child: Icon(Icons.home, size: 80, color: Colors.grey))),
                  
                  if (images.length > 1)
                    Positioned(
                      bottom: 20, left: 0, right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: images.asMap().entries.map((entry) {
                          return Container(
                            width: 8, height: 8,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _currentImageIndex == entry.key ? const Color(0xFFD4AF37) : Colors.white.withOpacity(0.5),
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(_formatPrice(flat!['expected_price'] ?? 0), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFFD4AF37))),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                        child: Text(flat!['listing_type'] ?? 'Sale', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(flat!['title'] ?? '', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.grey, size: 18),
                      const SizedBox(width: 4),
                      Expanded(child: Text(
                          [
                            if ((flat!['locality'] ?? '').toString().isNotEmpty) flat!['locality'],
                            if ((flat!['village'] ?? '').toString().isNotEmpty) flat!['village'],
                            if ((flat!['mandal'] ?? '').toString().isNotEmpty) flat!['mandal'],
                            if ((flat!['district'] ?? '').toString().isNotEmpty) flat!['district'],
                            if ((flat!['city'] ?? '').toString().isNotEmpty) flat!['city'],
                          ].where((e) => e != null && e.toString().isNotEmpty).join(', '),
                        style: TextStyle(color: Colors.grey[700], fontSize: 16),
                      )),
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Divider(),

                  _buildSectionTitle('Property Specifications'),
                  _buildPropertySpecs(flat!),
                  const Divider(),

                  if (!['plot', 'land', 'agricultural', 'farm', 'independent house', 'commercial'].any((e) => (flat!['property_category'] ?? flat!['property_type'] ?? '').toString().toLowerCase().contains(e))) ...[
                    _buildSectionTitle('Amenities'),
                    if (amenities.isEmpty) const Text('No amenities specified') else Wrap(
                      spacing: 8, runSpacing: 8,
                      children: amenities.map((a) => Chip(
                        label: Text(a),
                        backgroundColor: const Color(0xFFD4AF37).withOpacity(0.1),
                        side: BorderSide(color: const Color(0xFFD4AF37).withOpacity(0.2)),
                      )).toList(),
                    ),
                    const Divider(),
                  ],

                  // Location Details Section
                  if ((flat!['village'] != null && flat!['village'].toString().isNotEmpty) || (flat!['mandal'] != null && flat!['mandal'].toString().isNotEmpty)) ...[
                    _buildSectionTitle('Location Details'),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(16)),
                      child: Column(
                        children: [
                          if ((flat!['locality'] ?? '').toString().isNotEmpty) _buildSpecItem(Icons.map, 'Locality', flat!['locality'].toString()),
                          if ((flat!['village'] ?? '').toString().isNotEmpty) _buildSpecItem(Icons.holiday_village, 'Village', flat!['village'].toString()),
                          if ((flat!['mandal'] ?? '').toString().isNotEmpty) _buildSpecItem(Icons.location_city, 'Mandal/Municipality', flat!['mandal'].toString()),
                          if ((flat!['district'] ?? '').toString().isNotEmpty) _buildSpecItem(Icons.map_outlined, 'District', flat!['district'].toString()),
                          if ((flat!['state'] ?? '').toString().isNotEmpty) _buildSpecItem(Icons.public, 'State', flat!['state'].toString()),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  _buildSectionTitle('Description'),
                  Text(flat!['description'] ?? 'No description provided.', style: const TextStyle(fontSize: 16, height: 1.5)),
                  const SizedBox(height: 24),

                  if (flat!['document_url'] != null && flat!['document_url'].toString().isNotEmpty) ...[
                    const Divider(),
                    _buildSectionTitle('Property Documents'),
                    InkWell(
                      onTap: () => launchUrlString(flat!['document_url'], mode: LaunchMode.externalApplication),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD4AF37).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFD4AF37)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.picture_as_pdf, color: Color(0xFFD4AF37)),
                            SizedBox(width: 8),
                            Text('View Documents', style: TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                  
                  if (flat!['rera_number'] != null && flat!['rera_number'].toString().isNotEmpty) ...[
                    const Divider(),
                    _buildSectionTitle('RERA Details'),
                    Text('RERA Number: ${flat!['rera_number']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 24),
                  ],

                  const Divider(),
                  _buildSectionTitle('Contact Owner'),
                  if (_hasUnlocked) ...[
                    ListTile(
                      leading: const CircleAvatar(backgroundColor: Colors.green, child: Icon(Icons.person, color: Colors.white)),
                      title: Text(flat!['owner_name'] ?? 'Owner', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Phone: ${flat!['owner_mobile']}', style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
                          if (flat!['alt_contact'] != null && flat!['alt_contact'].toString().isNotEmpty)
                            Text('Alt: ${flat!['alt_contact']}'),
                        ],
                      ),
                    ),
                  ] else ...[
                    const Text('To view contact details, please unlock the owner contact.'),
                  ],
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: !_hasUnlocked ? SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              onPressed: _unlockContact,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD4AF37), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: const Text('Unlock Owner Contact (₹49)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
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
