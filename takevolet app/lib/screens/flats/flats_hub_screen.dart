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
  static const Color _gold = Color(0xFF7B3AEC);

  final List<Map<String, dynamic>> _categories = [
    {
      'name': 'Apartment / Flat',
      'icon': Icons.apartment_rounded,
      'color': Color(0xFF2563EB), // Royal Blue
      'bg': Color(0xFFEFF6FF),
    },
    {
      'name': 'Independent House',
      'icon': Icons.home_rounded,
      'color': Color(0xFFEA580C), // Warm Orange
      'bg': Color(0xFFFFF7ED),
    },
    {
      'name': 'Open Plot',
      'icon': Icons.landscape_rounded,
      'color': Color(0xFF059669), // Vibrant Emerald
      'bg': Color(0xFFECFDF5),
    },
    {
      'name': 'Farm Land',
      'icon': Icons.agriculture_rounded,
      'color': Color(0xFF0D9488), // Lush Teal
      'bg': Color(0xFFF0FDFA),
    },
    {
      'name': 'Villa',
      'icon': Icons.villa_rounded,
      'color': Color(0xFF7C3AED), // Electric Purple
      'bg': Color(0xFFF5F3FF),
    },
    {
      'name': 'Gated Community',
      'icon': Icons.holiday_village_rounded,
      'color': Color(0xFF0284C7), // Sky Blue
      'bg': Color(0xFFF0F9FF),
    },
    {
      'name': 'Commercial',
      'icon': Icons.storefront_rounded,
      'color': Color(0xFFD97706), // Amber Gold
      'bg': Color(0xFFFFFBEB),
    },
    {
      'name': 'Legal Cell',
      'icon': Icons.gavel_rounded,
      'color': Color(0xFFE11D48), // Crimson Rose
      'bg': Color(0xFFFFF1F2),
    },
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
      elevation: 0,
      centerTitle: false,
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Properties & Lands',
            style: GoogleFonts.outfit(
              color: const Color(0xFF0F172A),
              fontWeight: FontWeight.w900,
              fontSize: 22,
            ),
          ),
          Text(
            'Verified Direct Owner & Builder Properties',
            style: GoogleFonts.outfit(
              color: const Color(0xFF64748B),
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Icon(Icons.search_rounded, color: Color(0xFF0F172A), size: 20),
          ),
          onPressed: () => context.push('/flats/list', extra: {'category': 'All'}),
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildHeroBanner() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _fetchSponsoredBanners(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            height: 180,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              image: const DecorationImage(
                image: NetworkImage('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop'),
                fit: BoxFit.cover,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withOpacity(0.12),
                  blurRadius: 14,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: LinearGradient(
                      colors: [Colors.black.withOpacity(0.85), Colors.transparent],
                      begin: Alignment.bottomLeft,
                      end: Alignment.topRight,
                    ),
                  ),
                ),
                Positioned(
                  bottom: 20,
                  left: 20,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _gold,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'PREMIUM LAUNCH',
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF0F172A),
                            fontWeight: FontWeight.w900,
                            fontSize: 10,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Prestige Group\nLuxury Living Spaces',
                        style: GoogleFonts.outfit(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          height: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }
        
        final banners = snapshot.data!;
        
        return SizedBox(
          height: 190,
          child: PageView.builder(
            itemCount: banners.length,
            itemBuilder: (context, index) {
              final banner = banners[index];
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withOpacity(0.12),
                      blurRadius: 14,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      CachedNetworkImage(
                        imageUrl: banner['banner_url']?.toString().isNotEmpty == true
                            ? banner['banner_url']!
                            : 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop',
                        fit: BoxFit.cover,
                        errorWidget: (context, url, error) => Container(color: Colors.grey[800]),
                      ),
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Colors.black.withOpacity(0.85), Colors.transparent],
                            begin: Alignment.bottomLeft,
                            end: Alignment.topRight,
                          ),
                        ),
                      ),
                      if (banner['title'] != null)
                        Positioned(
                          bottom: 20,
                          left: 20,
                          child: Text(
                            banner['title'],
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
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
        final isDark = Theme.of(context).brightness == Brightness.dark;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 18,
                        decoration: BoxDecoration(
                          color: const Color(0xFF7B3AEC),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Top Projects',
                        style: GoogleFonts.outfit(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () => context.push('/flats/list', extra: {'category': 'Top Projects'}),
                    child: Text(
                      'See All',
                      style: GoogleFonts.outfit(
                        color: isDark ? const Color(0xFFA78BFA) : const Color(0xFF6D28D9),
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              height: 220,
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                scrollDirection: Axis.horizontal,
                itemCount: snapshot.data!.length,
                itemBuilder: (context, index) {
                  final project = snapshot.data![index];
                  final List<dynamic> images = project['media_urls'] ?? [];
                  final String imgUrl = images.isNotEmpty
                      ? images[0]
                      : (project['cover_image'] ?? '');
                  return GestureDetector(
                    onTap: () => context.push('/top-project/${project['id']}', extra: project),
                    child: Container(
                      width: 210,
                      margin: const EdgeInsets.symmetric(horizontal: 5, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF0F172A).withOpacity(0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
                            child: Stack(
                              children: [
                                Image.network(
                                  imgUrl,
                                  height: 110,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                  errorBuilder: (ctx, err, stack) => Container(
                                    height: 110,
                                    color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                                    child: const Icon(Icons.apartment_rounded, size: 40, color: Color(0xFF94A3B8)),
                                  ),
                                ),
                                Positioned(
                                  top: 8,
                                  left: 8,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF7B3AEC),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      'TOP PROJECT',
                                      style: GoogleFonts.outfit(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 9.5,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  project['project_name'] ?? 'Project',
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 14.5,
                                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    const Icon(Icons.location_on_rounded, size: 13, color: Color(0xFFE11D48)),
                                    const SizedBox(width: 3),
                                    Expanded(
                                      child: Text(
                                        project['location'] ?? project['locality'] ?? project['city'] ?? 'Prime Location',
                                        style: GoogleFonts.outfit(
                                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                                          fontSize: 11.5,
                                          fontWeight: FontWeight.w700,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Starting ₹${project['starting_price'] ?? '--'}',
                                  style: GoogleFonts.outfit(
                                    color: isDark ? const Color(0xFFA78BFA) : const Color(0xFF7B3AEC),
                                    fontWeight: FontWeight.w900,
                                    fontSize: 13,
                                  ),
                                ),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final Color iconColor = cat['color'] as Color? ?? const Color(0xFF7B3AEC);
    final Color bgColor = cat['bg'] as Color? ?? const Color(0xFFF5F3FF);

    return InkWell(
      onTap: () {
        if (cat['name'] == 'Legal Cell') {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const LegalHubScreen()));
        } else {
          context.push('/flats/list', extra: {'category': cat['name']});
        }
      },
      borderRadius: BorderRadius.circular(14),
      child: Container(
        width: isGrid ? null : 86,
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withOpacity(isDark ? 0.2 : 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? iconColor.withOpacity(0.2) : bgColor,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: iconColor.withOpacity(isDark ? 0.4 : 0.25)),
              ),
              child: Icon(cat['icon'] as IconData, size: 22, color: iconColor),
            ),
            const SizedBox(height: 8),
            Text(
              cat['name'] as String,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 11,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
                height: 1.15,
              ),
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
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  color: const Color(0xFF7B3AEC),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Property Types',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF0F172A),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: EdgeInsets.zero,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              childAspectRatio: 0.82,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
            ),
            itemCount: _categories.length + 1,
            itemBuilder: (context, index) {
              if (index == _categories.length) {
                // The "All" button
                return InkWell(
                  onTap: () => context.push('/flats/list', extra: {'category': 'All'}),
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0F172A).withOpacity(0.12),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 10),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF7B3AEC).withOpacity(0.2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.grid_view_rounded, size: 22, color: Color(0xFF7B3AEC)),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'View All\nProperties',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.outfit(
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFF7B3AEC),
                            height: 1.15,
                          ),
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
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  color: const Color(0xFF7B3AEC),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Listed Properties',
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  Text(
                    'Verified direct listings from owners',
                    style: GoogleFonts.outfit(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                ],
              ),
            ],
          ),
          GestureDetector(
            onTap: () => context.push('/flats/list', extra: {'category': 'All'}),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Text(
                    'All',
                    style: GoogleFonts.outfit(
                      color: const Color(0xFF0F172A),
                      fontWeight: FontWeight.w800,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_forward_ios_rounded, size: 10, color: Color(0xFF0F172A)),
                ],
              ),
            ),
          ),
        ],
      ),
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
    String formattedPrice = price >= 10000000
        ? '₹${(price / 10000000).toStringAsFixed(2)} Cr'
        : price >= 100000
            ? '₹${(price / 100000).toStringAsFixed(2)} L'
            : '₹${price.toInt()}';

    final List<String> locationParts = [
      prop['village'],
      prop['locality'],
      prop['area'],
      prop['district'],
      prop['city']
    ].where((e) => e != null && e.toString().trim().isNotEmpty).cast<String>().toList();

    final String location = locationParts.take(2).join(', ').trim();
    final String cleanLocation = location.replaceAll(RegExp(r'^,\s*'), '').trim();
    final String title = prop['title'] ?? 'Property for Sale';
    final List images = prop['flat_images'] ?? [];
    final String listingType = (prop['purpose'] ?? prop['listing_type'] ?? 'SALE').toString().toUpperCase();
    final bool isRent = listingType.contains('RENT');

    return GestureDetector(
      onTap: () {
        context.push('/flat-sale/${prop['id']}');
      },
      child: Container(
        margin: const EdgeInsets.only(left: 16, right: 16, bottom: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withOpacity(0.06),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(19)),
              child: Stack(
                children: [
                  prop['cover_image'] != null
                      ? SizedBox(
                          height: 200,
                          width: double.infinity,
                          child: SmartImage(imageUrl: prop['cover_image'], fit: BoxFit.cover),
                        )
                      : Container(
                          height: 200,
                          width: double.infinity,
                          color: const Color(0xFFF1F5F9),
                          child: const Icon(Icons.home_work_rounded, size: 60, color: Color(0xFF94A3B8)),
                        ),
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 60,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.transparent, Colors.black.withOpacity(0.5)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: isRent ? const Color(0xFF059669) : const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.2),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isRent ? Colors.white : const Color(0xFF7B3AEC),
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 5),
                          Text(
                            isRent ? 'FOR RENT' : 'FOR SALE',
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontWeight: FontWeight.w900,
                              fontSize: 10.5,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          color: Colors.black.withOpacity(0.5),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.photo_library_rounded, color: Colors.white, size: 13),
                              const SizedBox(width: 4),
                              Text(
                                '${images.isNotEmpty ? images.length : 1} Photos',
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF0F172A),
                            fontSize: 17,
                            fontWeight: FontWeight.w900,
                            height: 1.25,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            formattedPrice,
                            style: GoogleFonts.outfit(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF6D28D9),
                              letterSpacing: -0.3,
                            ),
                          ),
                          if (isRent)
                            Text(
                              '/ month',
                              style: GoogleFonts.outfit(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.location_on_rounded, size: 14, color: Color(0xFFE11D48)),
                        const SizedBox(width: 5),
                        Flexible(
                          child: Text(
                            cleanLocation.isNotEmpty ? cleanLocation : 'Prime City Location',
                            style: GoogleFonts.outfit(
                              color: const Color(0xFF0F172A),
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildFeatureTag(
                        Icons.category_rounded,
                        prop['property_category'] ?? 'Apartment',
                      ),
                      if (prop['bhk'] != null &&
                          !(prop['property_category'] ?? '').toString().toLowerCase().contains('plot') &&
                          !(prop['property_category'] ?? '').toString().toLowerCase().contains('land') &&
                          !(prop['property_category'] ?? '').toString().toLowerCase().contains('commercial'))
                        _buildFeatureTag(Icons.king_bed_rounded, '${prop['bhk']} BHK'),
                      if (prop['plot_area'] != null && prop['plot_area'].toString().isNotEmpty)
                        _buildFeatureTag(Icons.straighten_rounded, '${prop['plot_area']} ${prop['area_units'] ?? 'Sq.Yds'}'),
                      if (prop['flat_size_sft'] != null && prop['flat_size_sft'].toString().isNotEmpty)
                        _buildFeatureTag(Icons.straighten_rounded, '${prop['flat_size_sft']} sq.ft'),
                      _buildFeatureTag(Icons.verified_user_rounded, '0 Brokerage', isGold: true),
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

  Widget _buildFeatureTag(IconData icon, String text, {bool isGold = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isGold ? const Color(0xFFF5F3FF) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: isGold ? const Color(0xFFDDD6FE) : const Color(0xFFE2E8F0),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: isGold ? const Color(0xFF6D28D9) : const Color(0xFF64748B)),
          const SizedBox(width: 4),
          Text(
            text,
            style: GoogleFonts.outfit(
              color: isGold ? const Color(0xFF6D28D9) : const Color(0xFF334155),
              fontSize: 11.5,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
