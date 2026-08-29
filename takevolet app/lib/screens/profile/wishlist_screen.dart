import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class WishlistScreen extends StatefulWidget {
  final bool isTab;
  const WishlistScreen({super.key, this.isTab = false});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  final _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _wishlists = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchWishlists();
  }

  Future<void> _fetchWishlists() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return;

      final res = await _supabase
          .from('wishlists')
          .select('*, build_listings(*)')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _wishlists = List<Map<String, dynamic>>.from(res);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: widget.isTab ? null : AppBar(title: const Text('My Wishlist')),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _wishlists.isEmpty 
          ? const Center(child: Text('Wishlist is empty.'))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _wishlists.length,
              itemBuilder: (ctx, i) {
                final item = _wishlists[i];
                final listing = item['build_listings'];
                if (listing == null) return const SizedBox.shrink();
                
                return Card(
                  child: ListTile(
                    title: Text(listing['title'] ?? 'Listing'),
                    subtitle: Text('₹${listing['price'] ?? 0}'),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete, color: Colors.red),
                      onPressed: () async {
                        await _supabase.from('wishlists').delete().eq('id', item['id']);
                        _fetchWishlists();
                      },
                    ),
                  ),
                );
              },
            ),
    );
  }
}
