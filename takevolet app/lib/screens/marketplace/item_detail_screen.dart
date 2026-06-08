import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../../main.dart';
import '../../utils/image_utils.dart';
import '../../widgets/full_screen_image_viewer.dart';

class ItemDetailScreen extends StatefulWidget {
  final String id;
  const ItemDetailScreen({super.key, required this.id});

  @override
  State<ItemDetailScreen> createState() => _ItemDetailScreenState();
}

class _ItemDetailScreenState extends State<ItemDetailScreen> {
  Map<String, dynamic>? item;
  Map<String, dynamic>? userProfile;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchItem();
  }

  Future<void> _fetchItem() async {
    try {
      final data = await supabase.from('items').select().eq('id', widget.id).single();
      final profileData = await supabase.from('profiles').select('full_name, phone, whatsapp, avatar_url, email').eq('id', data['user_id']).single();
      
      if (mounted) {
        setState(() {
          item = data;
          userProfile = profileData;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        setState(() => isLoading = false);
      }
    }
  }

  void _contactSeller() async {
    if (userProfile == null || userProfile!['phone'] == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Phone number not available')));
      return;
    }
    final uri = Uri.parse('tel:${userProfile!['phone']}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch phone app')));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (item == null) return const Scaffold(body: Center(child: Text('Item not found.')));

    final imageUrls = ImageUtils.parseImages(item!['image'] ?? item!['images']);
    final imageUrl = imageUrls.isNotEmpty ? imageUrls.first : null;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.share, color: Colors.white),
            onPressed: () {
              Share.share('Check out this item on Takevolet! ${item!['title']} for ₹${item!['price']} at ${item!['location']}.');
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(bottom: 100),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Header
            Container(
              height: 350,
              width: double.infinity,
              decoration: BoxDecoration(color: Colors.grey[200]),
              child: imageUrl != null
                  ? GestureDetector(
                      onTap: () {
                        Navigator.push(context, MaterialPageRoute(builder: (_) => FullScreenImageViewer(imageUrls: imageUrls, initialIndex: 0)));
                      },
                      child: CachedNetworkImage(imageUrl: imageUrl, fit: BoxFit.cover),
                    )
                  : const Icon(Icons.image, size: 80, color: Colors.grey),
            ),
            
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(item!['title'] ?? 'Untitled', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold))),
                      Text('₹${item!['price'] ?? 0}', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.grey, size: 16),
                      const SizedBox(width: 4),
                      Text(item!['location'] ?? 'Location N/A', style: const TextStyle(color: Colors.grey, fontSize: 16)),
                    ],
                  ),
                  const Divider(height: 32),
                  
                  const Text('Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 12, runSpacing: 12,
                    children: [
                      _buildOverviewChip(Icons.category, item!['category'] ?? 'General'),
                      _buildOverviewChip(Icons.star, item!['condition'] ?? 'Good'),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  const Text('Description', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(item!['description'] ?? 'No description provided.', style: const TextStyle(fontSize: 15, height: 1.5, color: Colors.black87)),
                  
                  const Divider(height: 32),
                  const Text('Seller Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      radius: 25,
                      backgroundColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                      backgroundImage: userProfile?['avatar_url'] != null ? NetworkImage(userProfile!['avatar_url']) : null,
                      child: userProfile?['avatar_url'] == null 
                          ? Text((userProfile?['full_name'] ?? 'S')[0].toUpperCase(), style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 20))
                          : null,
                    ),
                    title: Text(userProfile?['full_name'] ?? 'Seller', style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: const Text('Member'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
        ),
        child: SizedBox(
          width: double.infinity,
          height: 54,
          child: ElevatedButton.icon(
            onPressed: _contactSeller,
            icon: const Icon(Icons.phone),
            label: const Text('Contact Seller', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOverviewChip(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        ],
      ),
    );
  }
}
