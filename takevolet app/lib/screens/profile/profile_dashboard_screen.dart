import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../main.dart';

class ProfileDashboardScreen extends StatefulWidget {
  const ProfileDashboardScreen({super.key});

  @override
  State<ProfileDashboardScreen> createState() => _ProfileDashboardScreenState();
}

class _ProfileDashboardScreenState extends State<ProfileDashboardScreen> {
  final user = supabase.auth.currentUser;
  Map<String, dynamic>? profile;
  bool isLoading = true;
  bool profileComplete = false;
  int totalEarnings = 0;
  int totalListings = 0;
  int totalUnlocks = 0;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final userId = user?.id;
      if (userId != null) {
        // Fetch profile
        try {
          final p = await supabase.from('profiles').select().eq('id', userId).single();
          profile = p;
          profileComplete = (p['full_name'] ?? '').isNotEmpty && (p['phone'] ?? '').isNotEmpty;
        } catch (_) {
          profileComplete = false;
        }

        // Fetch earnings
        try {
          final earnings = await supabase.from('earnings').select('amount').eq('user_id', userId);
          totalEarnings = (earnings as List).fold<int>(0, (sum, e) => sum + ((e['amount'] ?? 0) as num).toInt());
        } catch (_) {}

        // Fetch listings count
        try {
          final rooms = await supabase.from('rooms').select('id').eq('user_id', userId);
          final flatmates = await supabase.from('flatmates').select('id').eq('user_id', userId);
          totalListings = (rooms as List).length + (flatmates as List).length;
        } catch (_) {}

        // Fetch unlock count
        try {
          final unlocks = await supabase.from('contact_unlocks').select('id').eq('user_id', userId);
          totalUnlocks = (unlocks as List).length;
        } catch (_) {}
      }
    } catch (_) {}
    setState(() => isLoading = false);
  }

  String get displayName {
    if (profile != null && (profile!['full_name'] ?? '').isNotEmpty) {
      return profile!['full_name'];
    }
    final meta = user?.userMetadata;
    if (meta != null) {
      if ((meta['full_name'] ?? '').isNotEmpty) return meta['full_name'];
      if ((meta['name'] ?? '').isNotEmpty) return meta['name'];
    }
    return user?.email?.split('@').first ?? 'User';
  }

  String? get avatarUrl {
    if (profile != null && (profile!['avatar_url'] ?? '').isNotEmpty) {
      return profile!['avatar_url'];
    }
    final meta = user?.userMetadata;
    if (meta != null && (meta['avatar_url'] ?? '').isNotEmpty) {
      return meta['avatar_url'];
    }
    return null;
  }

  String get profession {
    return profile?['profession'] ?? '';
  }

  Future<void> _signOut() async {
    await supabase.auth.signOut();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: false,
      ),
      body: RefreshIndicator(
        onRefresh: _loadProfile,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Profile Header Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [const Color(0xFFD4AF37), const Color(0xFFD4AF37).withOpacity(0.7)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: const Color(0xFFD4AF37).withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 6))],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: Colors.white.withOpacity(0.3),
                    backgroundImage: avatarUrl != null ? CachedNetworkImageProvider(avatarUrl!) : null,
                    child: avatarUrl == null
                        ? Text(displayName.isNotEmpty ? displayName[0].toUpperCase() : 'U',
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white))
                        : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(displayName, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),
                        if (profession.isNotEmpty)
                          Text(profession, style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 13)),
                        const SizedBox(height: 4),
                        Row(children: [
                          Icon(Icons.verified, size: 14, color: Colors.white.withOpacity(0.9)),
                          const SizedBox(width: 4),
                          Text(profileComplete ? 'Verified Member' : 'Profile Incomplete',
                              style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 12)),
                        ]),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit, color: Colors.white),
                    onPressed: () => context.push(profileComplete ? '/profile-edit' : '/profile-complete'),
                  ),
                ],
              ),
            ),

            // Profile Incomplete Banner
            if (!profileComplete) ...[
              const SizedBox(height: 12),
              InkWell(
                onTap: () => context.push('/profile-complete'),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.orange[50],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange[300]!),
                  ),
                  child: Row(children: [
                    Icon(Icons.warning_amber_rounded, color: Colors.orange[700]),
                    const SizedBox(width: 12),
                    const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Complete Your Profile', style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('Add your details to start receiving contacts', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    ])),
                    Icon(Icons.arrow_forward_ios, size: 16, color: Colors.orange[700]),
                  ]),
                ),
              ),
            ],

            const SizedBox(height: 20),

            // Stats Grid
            Row(children: [
              Expanded(child: _buildStatCard('₹$totalEarnings', 'Earnings', Icons.account_balance_wallet, Colors.green)),
              const SizedBox(width: 12),
              Expanded(child: _buildStatCard('$totalListings', 'Listings', Icons.home_work, Colors.blue)),
              const SizedBox(width: 12),
              Expanded(child: _buildStatCard('$totalUnlocks', 'Unlocks', Icons.lock_open, Colors.purple)),
            ]),

            const SizedBox(height: 24),
            const Text('My Activity', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 8),

            _buildMenuItem(Icons.account_balance_wallet, 'Earnings & Wallet', Colors.green, () => context.push('/earnings')),
            _buildMenuItem(Icons.list_alt, 'My Listings', Colors.blue, () => context.push('/user-dashboard')),
            _buildMenuItem(Icons.lock_open, 'Unlock History', Colors.purple, () => context.push('/unlock-history')),
            _buildMenuItem(Icons.card_giftcard, 'Refer & Earn', Colors.orange, () => context.push('/refer')),
            _buildMenuItem(Icons.star, 'Premium Plans', Colors.amber, () => context.push('/pricing')),

            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 4),

            _buildMenuItem(Icons.person_outline, profileComplete ? 'Edit Profile' : 'Complete Profile', const Color(0xFFD4AF37),
                () => context.push(profileComplete ? '/profile-edit' : '/profile-complete')),

            _buildMenuItem(Icons.admin_panel_settings, 'Admin Panel', Colors.redAccent, () {
              final TextEditingController passwordController = TextEditingController();
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  title: const Text('Admin Access'),
                  content: TextField(
                    controller: passwordController,
                    obscureText: true,
                    decoration: InputDecoration(
                      labelText: 'Admin Password',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      prefixIcon: const Icon(Icons.lock),
                    ),
                  ),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                    ElevatedButton(
                      onPressed: () {
                        if (passwordController.text == 'Nithin@RoomRelay2026') {
                          Navigator.pop(ctx);
                          context.push('/admin');
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Incorrect Password'), backgroundColor: Colors.red));
                        }
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent, foregroundColor: Colors.white),
                      child: const Text('Login'),
                    ),
                  ],
                ),
              );
            }),

            const SizedBox(height: 8),
            const Divider(),

            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.logout, color: Colors.red, size: 20),
              ),
              title: const Text('Sign Out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600)),
              trailing: const Icon(Icons.chevron_right, color: Colors.red),
              onTap: _signOut,
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String value, String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 8),
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: color)),
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 11)),
      ]),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, Color color, VoidCallback onTap) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      trailing: const Icon(Icons.chevron_right, color: Colors.grey),
      onTap: onTap,
    );
  }
}
