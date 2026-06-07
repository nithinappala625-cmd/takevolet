import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../main.dart';

class FlatmatesScreen extends StatefulWidget {
  const FlatmatesScreen({super.key});

  @override
  State<FlatmatesScreen> createState() => _FlatmatesScreenState();
}

class _FlatmatesScreenState extends State<FlatmatesScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flatmates'),
        centerTitle: false,
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: () {}),
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: supabase.from('flatmates').select().order('created_at', ascending: false),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
          final data = snapshot.data;
          if (data == null || data.isEmpty) return const Center(child: Text('No flatmate listings yet.'));

          return ListView.builder(
            padding: const EdgeInsets.all(16).copyWith(bottom: 100),
            itemCount: data.length,
            itemBuilder: (context, index) {
              final item = data[index];
              final images = (item['images'] as List<dynamic>?)?.cast<String>() ?? [];
              final thumbnailUrl = images.isNotEmpty ? images.first : null;

              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 2,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          thumbnailUrl != null
                              ? CircleAvatar(
                                  radius: 24,
                                  backgroundImage: CachedNetworkImageProvider(thumbnailUrl),
                                  backgroundColor: Colors.grey[200],
                                )
                              : CircleAvatar(
                                  backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                                  radius: 24,
                                  child: Icon(Icons.person, color: Theme.of(context).colorScheme.primary),
                                ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(item['title'] ?? 'Looking for Flatmate', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                Text('${item['location'] ?? 'Unknown'}', style: const TextStyle(color: Colors.grey, fontSize: 14)),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary, borderRadius: BorderRadius.circular(20)),
                            child: Text('₹${item['rent_share']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          )
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildDetail(Icons.wc, item['gender_pref'] ?? 'Any'),
                          _buildDetail(Icons.bed, '${item['vacancy_count'] ?? 1} Vacancy'),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: () => context.push('/flatmate/${item['id']}'),
                          child: const Text('View Details'),
                        ),
                      )
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildDetail(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(color: Colors.grey)),
      ],
    );
  }
}
