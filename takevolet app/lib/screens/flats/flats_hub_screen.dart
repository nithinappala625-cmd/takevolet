import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../legal/legal_hub_screen.dart';
import 'dart:ui';
import '../../widgets/smart_image.dart';

class FlatsHubScreen extends StatefulWidget {
  const FlatsHubScreen({Key? key}) : super(key: key);

  @override
  State<FlatsHubScreen> createState() => _FlatsHubScreenState();
}

class _FlatsHubScreenState extends State<FlatsHubScreen> {
  static const Color _gold = Color(0xFFD4AF37);

  final List<Map<String, dynamic>> _categories = [
    {'name': 'Apartment / Flat', 'icon': Icons.apartment},
    {'name': 'Independent House', 'icon': Icons.house},
    {'name': 'Open Plot', 'icon': Icons.landscape},
    {'name': 'Farm Land', 'icon': Icons.agriculture},
    {'name': 'Villa', 'icon': Icons.villa},
    {'name': 'Gated Community', 'icon': Icons.holiday_village},
    {'name': 'Commercial', 'icon': Icons.storefront},
    {'name': 'Legal Cell', 'icon': Icons.gavel},
  ];

  Future<List<Map<String, dynamic>>> _fetchSponsoredBanners() async {
    return await Supabase.instance.client
        .from('sponsored_banners')
        .select()
        .eq('is_active', true)
        .order('display_order', ascending: true);
  }

  Future<List<Map<String, dynamic>>> _fetchTopProjects() async {
    return await Supabase.instance.client
        .from('top_projects')
        .select()
        .eq('status', 'published')
        .order('created_at', ascending: false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          _buildAppBar(),
          SliverToBoxAdapter(child: _buildHeroBanner()),
          SliverToBoxAdapter(child: _buildTopProjects()),
          SliverToBoxAdapter(child: _buildCategoryGrid()),
          SliverToBoxAdapter(child: _buildListedPropertiesHeader()),
          _buildListedProperties(),
          const SliverPadding(padding: EdgeInsets.only(bottom: 40)),
        ],
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      backgroundColor: Colors.white,
      floating: true,
      title: Text('Buy Property', style: GoogleFonts.outfit(color: _gold, fontWeight: FontWeight.bold, fontSize: 24)),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined, color: _gold),
          onPressed: () {},
        ),
      ],
    );
  }

  Widget _buildHeroBanner() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _fetchSponsoredBanners(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return Container(
            margin: const EdgeInsets.all(16),
            height: 180,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              image: const DecorationImage(
                image: NetworkImage('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop'),
                fit: BoxFit.cover,
              ),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 10, offset: const Offset(0, 5))],
            ),
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: LinearGradient(colors: [Colors.black.withOpacity(0.8), Colors.transparent], begin: Alignment.bottomLeft, end: Alignment.topRight),
                  ),
                ),
                Positioned(
                  bottom: 20, left: 20,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: _gold, borderRadius: BorderRadius.circular(4)),
                        child: const Text('NEW LAUNCH', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 10)),
                      ),
                      const SizedBox(height: 8),
                      Text('Prestige Group\nLuxury Villas', style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                    ],
                  ),
                )
              ],
            ),
          );
        }
        
        final banners = snapshot.data!;
        
        return SizedBox(
          height: 180,
          child: PageView.builder(
            itemCount: banners.length,
            itemBuilder: (context, index) {
              final banner = banners[index];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 5))],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      CachedNetworkImage(
                        imageUrl: banner['banner_url']?.toString().isNotEmpty == true ? banner['banner_url']! : 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
                        fit: BoxFit.cover,
                        errorWidget: (context, url, error) => Container(color: Colors.grey[800]),
                      ),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: [Colors.black.withOpacity(0.8), Colors.transparent], begin: Alignment.bottomLeft, end: Alignment.topRight),
                        ),
                      ),
                      if (banner['title'] != null)
                        Positioned(
                          bottom: 20, left: 20,
                          child: Text(banner['title'], style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                        )
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildTopProjects() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _fetchTopProjects(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Top Projects', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
                  const Text('See All', style: TextStyle(color: _gold, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            SizedBox(
              height: 200,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                scrollDirection: Axis.horizontal,
                itemCount: snapshot.data!.length,
                itemBuilder: (context, index) {
                  final project = snapshot.data![index];
                  final List<dynamic> images = project['media_urls'] ?? [];
                  final String imgUrl = images.isNotEmpty ? images[0] : '';
                  return GestureDetector(
                    onTap: () => context.push('/top-project/${project['id']}', extra: project),
                    child: Container(
                      width: 200,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.black12, width: 1),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, 4))],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                            child: Image.network(
                              imgUrl,
                              height: 100,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (ctx, err, stack) => Container(height: 100, color: Colors.grey[200]),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(project['project_name'] ?? 'Project', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on, size: 14, color: Colors.grey),
                                    const SizedBox(width: 4),
                                    Expanded(child: Text(project['location'] ?? 'Location', style: const TextStyle(color: Colors.grey, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text('Starting ₹${project['starting_price'] ?? '--'}', style: const TextStyle(color: _gold, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCategoryBox(Map<String, dynamic> cat, {bool isGrid = false}) {
    return InkWell(
      onTap: () {
        if (cat['name'] == 'Legal Cell') {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const LegalHubScreen()));
        } else {
          context.push('/flats/list', extra: {'category': cat['name']});
        }
      },
      borderRadius: BorderRadius.circular(10),
      child: Container(
        width: isGrid ? null : 80,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.black87, width: 0.8),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 4, offset: const Offset(0, 2))],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(cat['icon'] as IconData, size: 20, color: const Color(0xFFD4AF37)),
            const SizedBox(height: 6),
            Text(
              cat['name'] as String,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.black87),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryGrid() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: Text('Property Types', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
          ),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: EdgeInsets.zero,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              childAspectRatio: 0.85,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: _categories.length + 1,
            itemBuilder: (context, index) {
              if (index == _categories.length) {
                // The "All" button
                return InkWell(
                  onTap: () => context.push('/flats/list', extra: {'category': 'All'}),
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    decoration: BoxDecoration(
                      color: _gold.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: _gold.withOpacity(0.5), width: 0.8),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.grid_view_rounded, size: 20, color: _gold),
                        const SizedBox(height: 6),
                        const Text(
                          'View All\nProperties',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _gold),
                        ),
                      ],
                    ),
                  ),
                );
              }
              final cat = _categories[index];
              return _buildCategoryBox(cat, isGrid: true);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildListedPropertiesHeader() {
    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 12),
      child: Text('Listed Properties', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
    );
  }

  Widget _buildListedProperties() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: Supabase.instance.client.from('property_sales').select().order('created_at', ascending: false).limit(20),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const SliverToBoxAdapter(
            child: Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator())),
          );
        }
        if (snapshot.hasError) {
          return const SliverToBoxAdapter(
            child: Padding(padding: EdgeInsets.all(32), child: Center(child: Text('Error loading properties'))),
          );
        }

        final data = snapshot.data ?? [];
        if (data.isEmpty) {
          return const SliverToBoxAdapter(
            child: Padding(padding: EdgeInsets.all(32), child: Center(child: Text('No properties listed yet.'))),
          );
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
    final double price = (prop['price'] ?? prop['expected_price'] ?? 0).toDouble();
    String formattedPrice = price >= 10000000 ? '₹${(price / 10000000).toStringAsFixed(2)} Cr' 
                          : price >= 100000 ? '₹${(price / 100000).toStringAsFixed(2)} L' 
                          : '₹${price.toInt()}';

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
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: _gold, borderRadius: BorderRadius.circular(8)),
                      child: Text(prop['purpose'] ?? prop['listing_type'] ?? 'Sell', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12)),
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
        Icon(icon, size: 14, color: Colors.grey),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(color: Colors.black87, fontSize: 12, fontWeight: FontWeight.w500)),
      ],
    );
  }
}
