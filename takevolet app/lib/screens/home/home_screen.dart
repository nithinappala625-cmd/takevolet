import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../main.dart';
import '../../utils/image_utils.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Future<List<Map<String, dynamic>>> _fetchData(String table) async {
    return await supabase.from(table).select().order('created_at', ascending: false).limit(10);
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
                  ? CachedNetworkImage(imageUrl: thumbnailUrl, fit: BoxFit.cover, placeholder: (context, url) => Container(color: Colors.grey[200]))
                  : Container(color: Colors.grey[200], child: const Icon(Icons.home, size: 50, color: Colors.grey)),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(room['title'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(room['location'] ?? 'Location', style: const TextStyle(color: Colors.grey, fontSize: 12), overflow: TextOverflow.ellipsis)),
                      Text('₹${room['rent']}/mo', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
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
                  ? CachedNetworkImage(imageUrl: thumbnailUrl, fit: BoxFit.cover, placeholder: (_, __) => Container(color: Colors.grey[200]))
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
                  Text(flatmate['title'] ?? 'Looking for Flatmate', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 1, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(flatmate['location'] ?? 'N/A', style: const TextStyle(color: Colors.grey, fontSize: 12), overflow: TextOverflow.ellipsis)),
                      Text('₹${flatmate['rent_share'] ?? flatmate['price']}/mo', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
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
                  ? CachedNetworkImage(imageUrl: thumbnailUrl, fit: BoxFit.cover, placeholder: (context, url) => Container(color: Colors.grey[200]))
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
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('🔔 No new notifications'), duration: Duration(seconds: 2))),
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Icon(Icons.real_estate_agent, size: 50, color: Colors.white),
                  SizedBox(height: 12),
                  Text('Takevolet', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            ListTile(leading: const Icon(Icons.info), title: const Text('About Us'), onTap: () { Navigator.pop(context); _launchUrl('https://takevolet.online/about'); }),
            ListTile(leading: const Icon(Icons.article), title: const Text('Articles & Blog'), onTap: () { Navigator.pop(context); _launchUrl('https://takevolet.online/articles'); }),
            ListTile(leading: const Icon(Icons.handshake), title: const Text('Partners'), onTap: () { Navigator.pop(context); _launchUrl('https://takevolet.online/partners'); }),
            ListTile(leading: const Icon(Icons.contact_mail), title: const Text('Contact Us'), onTap: () { Navigator.pop(context); _launchUrl('https://takevolet.online/contact'); }),
            const Divider(),
            ListTile(leading: const Icon(Icons.privacy_tip), title: const Text('Privacy Policy'), onTap: () { Navigator.pop(context); _launchUrl('https://takevolet.online/privacy-policy'); }),
            ListTile(leading: const Icon(Icons.gavel), title: const Text('Terms of Service'), onTap: () { Navigator.pop(context); _launchUrl('https://takevolet.online/terms-of-service'); }),
            ListTile(leading: const Icon(Icons.money_off), title: const Text('Refund Policy'), onTap: () { Navigator.pop(context); _launchUrl('https://takevolet.online/refund-policy'); }),
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
            CarouselSlider(
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
                        image: DecorationImage(image: NetworkImage(i), fit: BoxFit.cover),
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          gradient: LinearGradient(
                            colors: [Colors.black.withOpacity(0.6), Colors.transparent],
                            begin: Alignment.bottomCenter, end: Alignment.topCenter,
                          ),
                        ),
                        alignment: Alignment.bottomLeft,
                        padding: const EdgeInsets.all(16),
                        child: const Text('Premium Rooms Available\nBook now and get ₹1000 off', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    );
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            _buildSectionHeader('Featured Rooms', () => context.go('/rooms')),
            _buildHorizontalList(table: 'rooms', itemBuilder: _buildRoomCard),
            const SizedBox(height: 24),
            _buildSectionHeader('Find Flatmates', () => context.go('/flatmates')),
            _buildHorizontalList(table: 'flatmates', itemBuilder: _buildFlatmateCard),
            const SizedBox(height: 24),
            _buildSectionHeader('Marketplace Items', () => context.go('/marketplace')),
            _buildHorizontalList(table: 'items', itemBuilder: _buildItemCard),
            const SizedBox(height: 32),
          ],
        ),
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
