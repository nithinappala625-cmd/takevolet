import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../legal/legal_hub_screen.dart';

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
              height: 220,
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
                      width: 240,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 4))],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                            child: Image.network(
                              imgUrl,
                              height: 120,
                              width: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (ctx, err, stack) => Container(height: 120, color: Colors.grey[200]),
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

  Widget _buildCategoryGrid() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(bottom: 16.0),
            child: Text('Property Types', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
          ),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              childAspectRatio: 0.85,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: _categories.length,
            itemBuilder: (context, index) {
              final cat = _categories[index];
              return InkWell(
                onTap: () {
                  if (cat['name'] == 'Legal Cell') {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const LegalHubScreen()));
                  } else {
                    context.push('/flats/list', extra: {'category': cat['name']});
                  }
                },
                borderRadius: BorderRadius.circular(16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        border: Border.all(color: const Color(0xFFD4AF37), width: 1.5),
                        boxShadow: [BoxShadow(color: const Color(0xFFD4AF37).withOpacity(0.2), blurRadius: 8, offset: const Offset(0, 4))],
                      ),
                      child: Icon(cat['icon'] as IconData, size: 32, color: const Color(0xFFD4AF37)),
                    ),
                    const SizedBox(height: 12),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4.0),
                      child: Text(
                        cat['name'] as String,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.black87),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
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
}
