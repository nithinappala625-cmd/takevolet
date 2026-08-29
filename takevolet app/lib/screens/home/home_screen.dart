import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../main.dart';
import '../../utils/image_utils.dart';
import '../../widgets/smart_image.dart';
import '../info/static_screens.dart';
import '../notifications/notifications_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  
  Future<List<Map<String, dynamic>>> _fetchAds(String placement) async {
    return await supabase.from('ads').select().eq('placement', placement).eq('is_active', true).order('created_at', ascending: false);
  }

  Future<List<Map<String, dynamic>>> _fetchData(String table) async {
    var query = supabase.from(table).select();
    if (table == 'rooms') query = query.eq('is_available', true);
    if (table == 'flatmates') query = query.eq('is_available', true);
    if (table == 'items') query = query.eq('is_available', true);
    return await query.order('created_at', ascending: false).limit(10);
  }

  Future<List<Map<String, dynamic>>> _fetchRecentRequirements() async {
    final reqs = await supabase.from('requirements').select().order('created_at', ascending: false).limit(2);
    List<Map<String, dynamic>> finalReqs = List<Map<String, dynamic>>.from(reqs);
    if (finalReqs.isNotEmpty) {
      final userIds = finalReqs.map((e) => e['user_id']).where((id) => id != null).toSet().toList();
      if (userIds.isNotEmpty) {
        try {
          final profiles = await supabase.from('profiles').select('id, full_name, avatar_url').inFilter('id', userIds);
          final profileMap = { for (var p in profiles) p['id']: p };
          for (var r in finalReqs) {
            final pid = r['user_id'];
            if (profileMap.containsKey(pid)) {
              r['avatar_url'] = profileMap[pid]?['avatar_url'];
              r['name'] = profileMap[pid]?['full_name'] ?? r['name'];
            }
          }
        } catch (_) {}
      }
    }
    return finalReqs;
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not open $url')));
    }
  }

  Widget _buildSectionHeader(String title, VoidCallback onSeeAll) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          TextButton(
            onPressed: onSeeAll,
            child: Text('See All', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      itemCount: 3,
      itemBuilder: (context, index) => Container(
        width: 260,
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  Widget _buildHorizontalList({required String table, required Widget Function(Map<String, dynamic>) itemBuilder}) {
    return SizedBox(
      height: 280,
      child: FutureBuilder<List<Map<String, dynamic>>>(
        future: _fetchData(table),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return _buildLoadingSkeleton();
          final data = snapshot.data;
          if (data == null || data.isEmpty) return const Center(child: Text('Nothing available yet.'));
          return ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: data.length,
            itemBuilder: (context, index) => itemBuilder(data[index]),
          );
        },
      ),
    );
  }

  Widget _buildRoomCard(Map<String, dynamic> room) {
    final metadata = room['metadata'] ?? {};
    final thumbnailUrl = ImageUtils.getThumbnail(room);

    return Container(
      width: 260,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/room/${room['id']}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 160,
              width: double.infinity,
              child: thumbnailUrl != null
                  ? SmartImage(imageUrl: thumbnailUrl, fit: BoxFit.cover)
                  : Container(color: Colors.grey[200], child: const Icon(Icons.home, size: 50, color: Colors.grey)),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(room['title']?.toString() ?? metadata['title']?.toString() ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(room['location']?.toString() ?? metadata['location']?.toString() ?? 'Location', style: const TextStyle(color: Colors.grey, fontSize: 12), overflow: TextOverflow.ellipsis)),
                      Text('₹${room['rent'] ?? metadata['rent'] ?? 0}/mo', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
                    ],
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildFlatmateCard(Map<String, dynamic> flatmate) {
    final metadata = flatmate['metadata'] ?? {};
    final thumbnailUrl = ImageUtils.getThumbnail(flatmate);

    return Container(
      width: 260,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/flatmate/${flatmate['id']}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 160,
              width: double.infinity,
              child: thumbnailUrl != null
                  ? SmartImage(imageUrl: thumbnailUrl, fit: BoxFit.cover)
                  : Container(
                      color: const Color(0xFFF5EFD0),
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(Icons.people_alt_rounded, size: 48, color: const Color(0xFFD4AF37).withOpacity(0.6)),
                        const SizedBox(height: 4),
                        Text('Flatmate', style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                      ]),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(flatmate['title']?.toString() ?? metadata['title']?.toString() ?? 'Looking for Flatmate', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(flatmate['location']?.toString() ?? metadata['location']?.toString() ?? 'N/A', style: const TextStyle(color: Colors.grey, fontSize: 12), overflow: TextOverflow.ellipsis)),
                      Text('₹${flatmate['rent_share'] ?? flatmate['price'] ?? metadata['rent_share'] ?? metadata['price'] ?? 0}/mo', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  String _formatFlatPrice(dynamic price) {
    if (price == null) return '₹0';
    double p = 0;
    if (price is int) p = price.toDouble();
    else if (price is double) p = price;
    else if (price is String) p = double.tryParse(price) ?? 0;

    if (p >= 10000000) return '₹${(p / 10000000).toStringAsFixed(2)} Cr';
    if (p >= 100000) return '₹${(p / 100000).toStringAsFixed(2)} L';
    return '₹${p.toStringAsFixed(0)}';
  }

  Widget _buildFlatSaleCard(Map<String, dynamic> flat) {
    final metadata = flat['metadata'] ?? {};
    return Container(
      width: 260,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/flat-sale/${flat['id']}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 160,
              width: double.infinity,
              child: flat['cover_image'] != null
                  ? SmartImage(imageUrl: flat['cover_image'], fit: BoxFit.cover)
                  : Container(color: Colors.grey[200], child: const Icon(Icons.home_work, size: 50, color: Colors.grey)),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(flat['title']?.toString() ?? metadata['title']?.toString() ?? 'Flat', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          [flat['village'] ?? metadata['village'], flat['locality'] ?? metadata['locality'], flat['area'] ?? metadata['area'], flat['district'] ?? metadata['district'], flat['city'] ?? metadata['city']]
                              .where((e) => e != null && e.toString().trim().isNotEmpty)
                              .take(2)
                              .join(', '),
                          style: const TextStyle(color: Colors.grey, fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(_formatFlatPrice(flat['expected_price'] ?? flat['price'] ?? metadata['expected_price'] ?? metadata['price']), style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold)),
                    ],
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildBuildCard(Map<String, dynamic> buildListing) {
    return Container(
      width: 260,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/build/detail', extra: buildListing),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 160,
              width: double.infinity,
              child: buildListing['image_url'] != null
                  ? SmartImage(imageUrl: buildListing['image_url'], fit: BoxFit.cover)
                  : Container(color: Colors.grey[200], child: const Icon(Icons.handyman, size: 50, color: Colors.grey)),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(buildListing['title'] ?? 'Construction Service', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(buildListing['location_name'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12), overflow: TextOverflow.ellipsis)),
                      Text('${buildListing['sub_category'] ?? 'Service'}', style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildItemCard(Map<String, dynamic> item) {
    final thumbnailUrl = ImageUtils.getThumbnail(item);

    return Container(
      width: 180,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/item/${item['id']}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 120,
              width: double.infinity,
              child: thumbnailUrl != null
                  ? SmartImage(imageUrl: thumbnailUrl, fit: BoxFit.cover)
                  : Container(color: Colors.grey[200], child: const Icon(Icons.shopping_bag, size: 40, color: Colors.grey)),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item['title'] ?? 'Item', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text('₹${item['price'] ?? 0}', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Takevolet', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 24, letterSpacing: 0.5)),
        centerTitle: true,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        actions: [
          IconButton(
            icon: Stack(children: [
              const Icon(Icons.notifications_none),
              Positioned(right: 0, top: 0, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle))),
            ]),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
          ),
        ],
      ),
      drawer: Drawer(
        backgroundColor: Colors.white,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: Colors.white),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Image.asset('assets/images/tvl_real_logo.jpg', height: 50),
                  const SizedBox(height: 12),
                  const Text('Takevolet', style: TextStyle(color: Colors.black, fontSize: 24, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            ListTile(leading: const Icon(Icons.info_outline, color: Colors.black87), title: const Text('About Us', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const AboutScreen())); }),
            ListTile(leading: const Icon(Icons.article_outlined, color: Colors.black87), title: const Text('Articles & Blog', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const ArticlesScreen())); }),
            ListTile(leading: const Icon(Icons.handshake_outlined, color: Colors.black87), title: const Text('Partners', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const PartnersScreen())); }),
            ListTile(leading: const Icon(Icons.contact_support_outlined, color: Colors.black87), title: const Text('Contact Us', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const ContactScreen())); }),
            const Divider(color: Colors.black12),
            ListTile(leading: const Icon(Icons.privacy_tip_outlined, color: Colors.black87), title: const Text('Privacy Policy', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const PrivacyScreen())); }),
            ListTile(leading: const Icon(Icons.gavel_outlined, color: Colors.black87), title: const Text('Terms of Service', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const TermsScreen())); }),
            ListTile(leading: const Icon(Icons.currency_exchange_outlined, color: Colors.black87), title: const Text('Refund Policy', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const RefundScreen())); }),
          ],
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async { setState(() {}); },
        child: ListView(
          padding: const EdgeInsets.only(bottom: 100),
          children: [
            // Search Bar
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'What are you looking for?',
                  prefixIcon: const Icon(Icons.search, color: Colors.grey),
                  filled: true,
                  fillColor: Colors.grey[100],
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 0),
                ),
              ),
            ),
            
            
            // Advertisement Carousel
            FutureBuilder<List<Map<String, dynamic>>>(
              future: _fetchAds('home_page'),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const SizedBox(height: 180, child: Center(child: CircularProgressIndicator()));
                }
                
                final ads = snapshot.data ?? [];
                
                if (ads.isEmpty) {
                  // Fallback hardcoded carousel
                  return CarouselSlider(
                    options: CarouselOptions(
                      height: 180.0,
                      autoPlay: true,
                      enlargeCenterPage: true,
                      viewportFraction: 0.9,
                      aspectRatio: 16/9,
                      initialPage: 0,
                    ),
                    items: [
                      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
                      'https://images.unsplash.com/photo-1502672260266-1c1c29408447?w=800&q=80',
                      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80'
                    ].map((i) {
                      return Builder(
                        builder: (BuildContext context) {
                          return Container(
                            width: MediaQuery.of(context).size.width,
                            margin: const EdgeInsets.symmetric(horizontal: 5.0),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              color: Colors.grey[200],
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                SmartImage(imageUrl: i, fit: BoxFit.cover),
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [Colors.black.withOpacity(0.6), Colors.transparent],
                                      begin: Alignment.bottomCenter, end: Alignment.topCenter,
                                    ),
                                  ),
                                  alignment: Alignment.bottomLeft,
                                  padding: const EdgeInsets.all(16),
                                  child: const Text('Premium Rooms Available\nBook now and get ₹1000 off', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                ),
                              ],
                            ),
                          );
                        },
                      );
                    }).toList(),
                  );
                }

                return CarouselSlider(
                  options: CarouselOptions(
                    height: 180.0,
                    autoPlay: true,
                    enlargeCenterPage: true,
                    viewportFraction: 0.9,
                    aspectRatio: 16/9,
                    initialPage: 0,
                  ),
                  items: ads.map((ad) {
                    return Builder(
                      builder: (BuildContext context) {
                        return GestureDetector(
                          onTap: () {
                            if (ad['url'] != null && ad['url'].isNotEmpty) {
                              _launchUrl(ad['url']);
                            }
                          },
                          child: Container(
                            width: MediaQuery.of(context).size.width,
                            margin: const EdgeInsets.symmetric(horizontal: 5.0),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              color: Colors.grey[200],
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                if (ad['image_url'] != null && ad['image_url'].isNotEmpty)
                                  SmartImage(imageUrl: ad['image_url'], fit: BoxFit.cover)
                                else
                                  Container(color: Theme.of(context).colorScheme.primary.withOpacity(0.1)),
                                  
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [Colors.black.withOpacity(0.6), Colors.transparent],
                                      begin: Alignment.bottomCenter, end: Alignment.topCenter,
                                    ),
                                  ),
                                  alignment: Alignment.bottomLeft,
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(ad['title'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                                      if (ad['description'] != null && ad['description'].isNotEmpty)
                                        Text(ad['description'], style: const TextStyle(color: Colors.white, fontSize: 12)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  }).toList(),
                );
              },
            ),

            const SizedBox(height: 16),

            _buildSectionHeader('Featured Rooms', () => context.go('/rooms')),
            _buildHorizontalList(table: 'rooms', itemBuilder: _buildRoomCard),
            const SizedBox(height: 24),
            _buildSectionHeader('Properties for Sale', () => context.go('/flats')),
            _buildHorizontalList(table: 'property_sales', itemBuilder: _buildFlatSaleCard),
            _buildSectionHeader('Construction & Materials', () => context.go('/build')),
            _buildHorizontalList(table: 'build_listings', itemBuilder: _buildBuildCard),
            const SizedBox(height: 24),
            _buildSectionHeader('Find Flatmates', () => context.go('/flatmates')),
            _buildHorizontalList(table: 'flatmates', itemBuilder: _buildFlatmateCard),
            const SizedBox(height: 24),
            _buildSectionHeader('Recent Requirements', () => context.go('/feed')),
            _buildRecentRequirements(),
            const SizedBox(height: 24),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentRequirements() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _fetchRecentRequirements(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const SizedBox(height: 100, child: Center(child: CircularProgressIndicator()));
        final reqs = snapshot.data;
        if (reqs == null || reqs.isEmpty) return const Center(child: Text('No recent requirements.'));
        return Column(
          children: reqs.map((req) => _buildReqCard(req)).toList(),
        );
      },
    );
  }

  Widget _buildReqCard(Map<String, dynamic> req) {
    final name = req['name'] ?? 'Unknown';
    final location = req['preferred_locations'] ?? 'Any location';
    final budget = req['budget'] ?? 'Negotiable';
    final description = req['description'] ?? '';
    final createdAtStr = req['created_at'];
    final avatarUrl = req['avatar_url'];
    final roomType = req['room_type'] ?? 'Any';
    
    String timeAgo = '';
    if (createdAtStr != null) {
      try {
        timeAgo = timeago.format(DateTime.parse(createdAtStr));
      } catch (_) {}
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 6)),
        ],
        border: Border.all(color: Colors.grey.shade200, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: const Color(0xFFD4AF37).withOpacity(0.2),
                  backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                  child: avatarUrl == null 
                      ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFD4AF37), fontSize: 16))
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      if (timeAgo.isNotEmpty) Text(timeAgo, style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12)),
                  child: Text('Looking for Room', style: TextStyle(color: Colors.blue.shade700, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            if (description.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(description, style: TextStyle(fontSize: 14, color: Colors.grey.shade800), maxLines: 2, overflow: TextOverflow.ellipsis),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _buildSmallTag(Icons.location_on, location, Colors.red),
                _buildSmallTag(Icons.currency_rupee, budget, Colors.green),
                _buildSmallTag(Icons.house_siding, roomType, Colors.purple),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSmallTag(IconData icon, String text, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color.shade700),
          const SizedBox(width: 4),
          Text(text, style: TextStyle(color: color.shade800, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildTag(BuildContext context, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(text, style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 12, fontWeight: FontWeight.w500)),
    );
  }
}
