import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../main.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  Future<List<Map<String, dynamic>>> _fetchData(String table) async {
    return await supabase.from(table).select().order('created_at', ascending: false).limit(10);
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
    final images = (room['images'] as List<dynamic>?)?.cast<String>() ?? [];
    final thumbnailUrl = images.isNotEmpty ? images.first : null;

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
    final images = (flatmate['images'] as List<dynamic>?)?.cast<String>() ?? [];
    final thumbnailUrl = images.isNotEmpty ? images.first : null;

    return Container(
      width: 220,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).colorScheme.primary.withOpacity(0.2)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          thumbnailUrl != null
              ? CircleAvatar(
                  radius: 30,
                  backgroundImage: CachedNetworkImageProvider(thumbnailUrl),
                  backgroundColor: Colors.grey[200],
                )
              : CircleAvatar(
                  backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  radius: 30,
                  child: Icon(Icons.people, color: Theme.of(context).colorScheme.primary, size: 30),
                ),
          const Spacer(),
          Text(flatmate['title'] ?? 'Looking for Flatmate', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 2),
          const SizedBox(height: 8),
          Text('Location: ${flatmate['location'] ?? 'N/A'}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary, borderRadius: BorderRadius.circular(8)),
            child: Text('₹${flatmate['rent_share'] ?? flatmate['price']} Share', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
          )
        ],
      ),
    );
  }

  Widget _buildItemCard(Map<String, dynamic> item) {
    final thumbnailUrl = item['image'] as String?;

    return Container(
      width: 180,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      clipBehavior: Clip.antiAlias,
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
          IconButton(icon: const Icon(Icons.notifications_none), onPressed: () {}),
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
            ListTile(leading: const Icon(Icons.info), title: const Text('About Us'), onTap: () { Navigator.pop(context); context.push('/about'); }),
            ListTile(leading: const Icon(Icons.article), title: const Text('Articles & Blog'), onTap: () { Navigator.pop(context); context.push('/articles'); }),
            ListTile(leading: const Icon(Icons.handshake), title: const Text('Partners'), onTap: () { Navigator.pop(context); context.push('/partners'); }),
            ListTile(leading: const Icon(Icons.contact_mail), title: const Text('Contact Us'), onTap: () { Navigator.pop(context); context.push('/contact'); }),
            const Divider(),
            ListTile(leading: const Icon(Icons.privacy_tip), title: const Text('Privacy Policy'), onTap: () { Navigator.pop(context); context.push('/privacy'); }),
            ListTile(leading: const Icon(Icons.gavel), title: const Text('Terms of Service'), onTap: () { Navigator.pop(context); context.push('/terms'); }),
            ListTile(leading: const Icon(Icons.money_off), title: const Text('Refund Policy'), onTap: () { Navigator.pop(context); context.push('/refund-policy'); }),
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
