import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../main.dart';

class UserDashboardScreen extends StatelessWidget {
  const UserDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Previous Listings'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Rooms'),
              Tab(text: 'Flatmates'),
              Tab(text: 'Items'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildListingTab('rooms', Icons.home),
            _buildListingTab('flatmates', Icons.people),
            _buildListingTab('items', Icons.shopping_bag),
          ],
        ),
      ),
    );
  }

  Widget _buildListingTab(String table, IconData icon) {
    final userId = supabase.auth.currentUser?.id;
    if (userId == null) return const Center(child: Text('Not logged in.'));

    return FutureBuilder<List<Map<String, dynamic>>>(
      future: supabase.from(table).select().eq('user_id', userId).order('created_at', ascending: false),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
        final data = snapshot.data;
        if (data == null || data.isEmpty) return Center(child: Text('No listings found in $table.'));

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: data.length,
          itemBuilder: (context, index) {
            final item = data[index];
            final images = (item['images'] as List<dynamic>?)?.cast<String>() ?? [];
            final thumbnailUrl = images.isNotEmpty ? images.first : null;

            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              clipBehavior: Clip.antiAlias,
              child: InkWell(
                onTap: () {
                  if (table == 'rooms') context.push('/room/${item['id']}');
                },
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      height: 150,
                      width: double.infinity,
                      child: thumbnailUrl != null
                          ? CachedNetworkImage(imageUrl: thumbnailUrl, fit: BoxFit.cover)
                          : Container(color: Colors.grey[200], child: Icon(icon, size: 50, color: Colors.grey)),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(child: Text(item['title'] ?? 'Untitled', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18), maxLines: 1, overflow: TextOverflow.ellipsis)),
                              if (item['rent'] != null || item['price'] != null)
                                Text('₹${item['rent'] ?? item['price']}', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 18)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.location_on, color: Colors.grey, size: 14),
                              const SizedBox(width: 4),
                              Expanded(child: Text(item['location'] ?? 'Location N/A', style: const TextStyle(color: Colors.grey, fontSize: 14), overflow: TextOverflow.ellipsis)),
                            ],
                          ),
                        ],
                      ),
                    )
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}
