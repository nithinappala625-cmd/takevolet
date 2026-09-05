import os

client_dashboard_code = """import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ClientDashboardScreen extends StatefulWidget {
  const ClientDashboardScreen({super.key});

  @override
  State<ClientDashboardScreen> createState() => _ClientDashboardScreenState();
}

class _ClientDashboardScreenState extends State<ClientDashboardScreen> {
  final _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _bookings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchBookings();
  }

  Future<void> _fetchBookings() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return;

      final res = await _supabase
          .from('bookings')
          .select('*, build_listings(title, display_id)')
          .eq('provider_id', user.id)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _bookings = List<Map<String, dynamic>>.from(res);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Client Dashboard')),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _bookings.isEmpty 
          ? const Center(child: Text('No bookings received yet.'))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _bookings.length,
              itemBuilder: (ctx, i) {
                final bk = _bookings[i];
                final listing = bk['build_listings'] ?? {};
                final data = bk['booking_data'] as Map<String, dynamic>? ?? {};
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(listing['title'] ?? 'Listing', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            Chip(label: Text(bk['status'] ?? 'PENDING', style: const TextStyle(fontSize: 12))),
                          ],
                        ),
                        Text('ID: ${listing['display_id']}', style: const TextStyle(color: Colors.grey)),
                        const Divider(),
                        ...data.entries.map((e) => Padding(
                          padding: const EdgeInsets.symmetric(vertical: 2),
                          child: Text('${e.key}: ${e.value}'),
                        )),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
"""

user_bookings_code = """import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class UserBookingsScreen extends StatefulWidget {
  const UserBookingsScreen({super.key});

  @override
  State<UserBookingsScreen> createState() => _UserBookingsScreenState();
}

class _UserBookingsScreenState extends State<UserBookingsScreen> {
  final _supabase = Supabase.instance.client;
  List<Map<String, dynamic>> _bookings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchBookings();
  }

  Future<void> _fetchBookings() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return;

      final res = await _supabase
          .from('bookings')
          .select('*, build_listings(title, display_id)')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);

      if (mounted) {
        setState(() {
          _bookings = List<Map<String, dynamic>>.from(res);
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
      appBar: AppBar(title: const Text('My Bookings')),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _bookings.isEmpty 
          ? const Center(child: Text('No bookings placed yet.'))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _bookings.length,
              itemBuilder: (ctx, i) {
                final bk = _bookings[i];
                final listing = bk['build_listings'] ?? {};
                return Card(
                  child: ListTile(
                    title: Text(listing['title'] ?? 'Listing'),
                    subtitle: Text('Status: ${bk['status']}\\nPlaced: ${DateTime.parse(bk['created_at']).toLocal().toString().split(' ')[0]}'),
                    trailing: const Icon(Icons.chevron_right),
                  ),
                );
              },
            ),
    );
  }
}
"""

wishlist_code = """import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

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
      appBar: AppBar(title: const Text('My Wishlist')),
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
"""

os.makedirs("takevolet app/lib/screens/profile", exist_ok=True)
with open("takevolet app/lib/screens/profile/client_dashboard_screen.dart", "w", encoding="utf-8") as f:
    f.write(client_dashboard_code)
with open("takevolet app/lib/screens/profile/user_bookings_screen.dart", "w", encoding="utf-8") as f:
    f.write(user_bookings_code)
with open("takevolet app/lib/screens/profile/wishlist_screen.dart", "w", encoding="utf-8") as f:
    f.write(wishlist_code)

# Update profile dashboard screen
with open("takevolet app/lib/screens/profile/profile_dashboard_screen.dart", "r", encoding="utf-8") as f:
    c = f.read()

menu_items = """          _buildMenuSection('CRM & DASHBOARDS', [
            _buildMenuItem(Icons.dashboard_customize, 'Client Dashboard', onTap: () => context.push('/client-dashboard')),
            _buildMenuItem(Icons.receipt_long, 'My Bookings', onTap: () => context.push('/my-bookings')),
            _buildMenuItem(Icons.favorite, 'My Wishlist', onTap: () => context.push('/my-wishlist')),
          ]),
          const SizedBox(height: 24),"""

c = c.replace("          _buildMenuSection('ACCOUNT SETTINGS', [", menu_items + "\n          _buildMenuSection('ACCOUNT SETTINGS', [")

with open("takevolet app/lib/screens/profile/profile_dashboard_screen.dart", "w", encoding="utf-8") as f:
    f.write(c)

# Add routes to app_router.dart
with open("takevolet app/lib/app_router.dart", "r", encoding="utf-8") as f:
    router_code = f.read()

import_code = """import 'screens/profile/client_dashboard_screen.dart';
import 'screens/profile/user_bookings_screen.dart';
import 'screens/profile/wishlist_screen.dart';
"""
if "client_dashboard_screen.dart" not in router_code:
    router_code = router_code.replace("import 'package:go_router/go_router.dart';", "import 'package:go_router/go_router.dart';\n" + import_code)

routes_code = """    GoRoute(path: '/client-dashboard', builder: (context, state) => const ClientDashboardScreen()),
    GoRoute(path: '/my-bookings', builder: (context, state) => const UserBookingsScreen()),
    GoRoute(path: '/my-wishlist', builder: (context, state) => const WishlistScreen()),
"""
if "/client-dashboard" not in router_code:
    router_code = router_code.replace("GoRoute(path: '/login',", routes_code + "\n    GoRoute(path: '/login',")

with open("takevolet app/lib/app_router.dart", "w", encoding="utf-8") as f:
    f.write(router_code)

print("Created CRM screens and updated router")
