import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../widgets/smart_image.dart';
import 'dart:ui';

class FlatsFeedScreen extends StatefulWidget {
  final String category;

  const FlatsFeedScreen({super.key, required this.category});

  @override
  State<FlatsFeedScreen> createState() => _FlatsFeedScreenState();
}

class _FlatsFeedScreenState extends State<FlatsFeedScreen> {
  static const _gold = Color(0xFF7B3AEC);

  String _searchQuery = '';

  Future<List<Map<String, dynamic>>> _fetchProperties() async {
    var query = Supabase.instance.client.from('property_sales').select();

    if (widget.category == 'Commercial') {
      query = query.ilike('property_category', '%Commercial%');
    } else if (widget.category == 'Gated Community') {
      query = query.ilike('property_category', '%Gated Community%');
    } else if (widget.category != 'All') {
      query = query.eq('property_category', widget.category);
    }

    if (_searchQuery.isNotEmpty) {
      // Search across title, locality, district, village, mandal
      query = query.or('title.ilike.%$_searchQuery%,locality.ilike.%$_searchQuery%,district.ilike.%$_searchQuery%');
    }

    return await query.order('created_at', ascending: false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.black),
          onPressed: () => context.canPop() ? context.pop() : null,
        ),
        title: Text(widget.category == 'All' ? 'All Properties' : widget.category, style: GoogleFonts.outfit(color: _gold, fontWeight: FontWeight.bold, fontSize: 20)),
        centerTitle: true,
      ),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _buildSearchBar()),
          _buildPropertyFeed(),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: TextField(
        style: const TextStyle(color: Colors.black),
        onChanged: (val) => setState(() => _searchQuery = val),
        decoration: InputDecoration(
          hintText: 'What are you looking for?',
          hintStyle: const TextStyle(color: Colors.grey),
          filled: true,
          fillColor: Colors.grey.shade100,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
          suffixIcon: IconButton(
            icon: const Icon(Icons.tune, color: _gold),
            onPressed: () {
              // Open filter bottom sheet
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
                builder: (context) => StatefulBuilder(
                  builder: (context, setModalState) {
                    return Padding(
                      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 24, right: 24, top: 24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Filters', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black)),
                              IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context)),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const Text('Property Type', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.black)),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                              children: ['All', 'Apartment / Flat', 'Independent House', 'Open Plot', 'Commercial'].map((c) {
                              final isSelected = widget.category == c;
                              return ChoiceChip(
                                label: Text(c, style: TextStyle(color: isSelected ? Colors.white : Colors.black)),
                                selected: isSelected,
                                selectedColor: const Color(0xFFC09E57),
                                onSelected: (val) {
                                  // Navigating to the same screen with new category
                                  Navigator.pop(context);
                                  context.pushReplacement('/flats/list', extra: {'category': c});
                                },
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 32),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFC09E57),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                padding: const EdgeInsets.symmetric(vertical: 16)
                              ),
                              onPressed: () {
                                setState(() {}); // Refresh main screen with new filter
                                Navigator.pop(context);
                              },
                              child: const Text('Apply Filters', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    );
                  }
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildPropertyFeed() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      key: ValueKey('$_searchQuery${widget.category}'),
      future: _fetchProperties(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(32.0), child: CircularProgressIndicator(color: _gold))));
        }
        final data = snapshot.data;
        if (data == null || data.isEmpty) {
          return const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(32.0), child: Text('No properties found', style: TextStyle(color: Colors.grey, fontSize: 16)))));
        }

        return SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) {
              final prop = data[index];
              return _buildPropertyCard(prop);
            },
            childCount: data.length,
          ),
        );
      },
    );
  }

  Widget _buildPropertyCard(Map<String, dynamic> prop) {
    // Legacy support: old data used 'expected_price', new uses 'price'
    final double price = (prop['price'] ?? prop['expected_price'] ?? 0).toDouble();
    String formattedPrice = price >= 10000000 ? '₹${(price / 10000000).toStringAsFixed(2)} Cr' 
                          : price >= 100000 ? '₹${(price / 100000).toStringAsFixed(2)} L' 
                          : '₹${price.toInt()}';

    // Legacy support: old data used 'city' and 'area', new uses 'district' and 'locality'
    final List<String> locationParts = [
      prop['village'],
      prop['locality'],
      prop['area'],
      prop['district'],
      prop['city']
    ].where((e) => e != null && e.toString().trim().isNotEmpty).cast<String>().toList();
    
    final String location = locationParts.take(2).join(', ').trim();
    final String title = prop['title'] ?? 'Property for Sale';
    final List images = prop['flat_images'] ?? [];

    return GestureDetector(
      onTap: () {
        context.push('/flat-sale/${prop['id']}');
      },
      child: Container(
        margin: const EdgeInsets.only(left: 16, right: 16, bottom: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 5))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              child: Stack(
                children: [
                  prop['cover_image'] != null
                      ? SizedBox(height: 220, width: double.infinity, child: SmartImage(imageUrl: prop['cover_image'], fit: BoxFit.cover))
                      : Container(height: 220, width: double.infinity, color: Colors.grey[800], child: const Icon(Icons.home, size: 60, color: Colors.grey)),
                  Positioned(
                    top: 12, right: 12,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          color: Colors.black.withOpacity(0.4),
                          child: Row(
                            children: [
                              const Icon(Icons.photo_library, color: Colors.white, size: 14),
                              const SizedBox(width: 4),
                              Text('${images.length}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 12, left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: _gold, borderRadius: BorderRadius.circular(8)),
                      child: Text(
                        (prop['purpose'] ?? prop['listing_type'] ?? 'Sell').toString().toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 11, letterSpacing: 0.5),
                      ),
                    ),
                  )
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(title, style: const TextStyle(color: Colors.black87, fontSize: 18, fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      Text(formattedPrice, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: _gold)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Expanded(child: Text(location.replaceAll(RegExp(r'^,\s*'), ''), style: const TextStyle(color: Colors.grey), maxLines: 1, overflow: TextOverflow.ellipsis)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildFeature(Icons.category, prop['property_category'] ?? 'Apartment / Flat'),
                      if (prop['bhk'] != null && 
                            !(prop['property_category'] ?? '').toString().toLowerCase().contains('plot') && 
                            !(prop['property_category'] ?? '').toString().toLowerCase().contains('land') &&
                            !(prop['property_category'] ?? '').toString().toLowerCase().contains('commercial')) 
                          _buildFeature(Icons.king_bed_outlined, prop['bhk']),
                      if (prop['plot_area'] != null && prop['plot_area'].toString().isNotEmpty) 
                        _buildFeature(Icons.square_foot, '${prop['plot_area']} ${prop['area_units']}'),
                      if (prop['flat_size_sft'] != null && prop['flat_size_sft'].toString().isNotEmpty) 
                        _buildFeature(Icons.square_foot, '${prop['flat_size_sft']} sqft'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeature(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: _gold),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(color: Colors.black54, fontSize: 13)),
      ],
    );
  }
}
