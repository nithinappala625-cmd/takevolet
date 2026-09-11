import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';
import '../../services/onesignal_service.dart';
import '../../theme/app_theme.dart';
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
  bool _pushNotifications = true;
  bool _inAppNotifications = true;
  bool _listingUpdates = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _togglePushNotifications(bool val) async {
    setState(() => _pushNotifications = val);
    try {
      if (val) {
        OneSignal.Notifications.requestPermission(true);
        OneSignal.User.pushSubscription.optIn();
      } else {
        OneSignal.User.pushSubscription.optOut();
      }
      await supabase.auth.updateUser(UserAttributes(data: {'push_notifications': val}));
    } catch (_) {}
  }

  Future<void> _toggleInAppNotifications(bool val) async {
    setState(() => _inAppNotifications = val);
    try {
      await supabase.auth.updateUser(UserAttributes(data: {'in_app_notifications': val}));
    } catch (_) {}
  }

  Future<void> _toggleListingUpdates(bool val) async {
    setState(() => _listingUpdates = val);
    try {
      await supabase.auth.updateUser(UserAttributes(data: {'listing_updates': val}));
    } catch (_) {}
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
    if (meta != null) {
      if ((meta['avatar_url'] ?? '').isNotEmpty) return meta['avatar_url'];
      if ((meta['picture'] ?? '').isNotEmpty) return meta['picture'];
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
                  colors: [const Color(0xFF7B3AEC), const Color(0xFF7B3AEC).withOpacity(0.7)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: const Color(0xFF7B3AEC).withOpacity(0.3), blurRadius: 16, offset: const Offset(0, 6))],
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
            _buildMenuItem(Icons.dashboard_customize, 'Client Panel (My Listings)', Colors.blue, () => context.push('/client-dashboard')),
            _buildMenuItem(Icons.person, 'User Panel (Wishlist & Bookings)', Colors.indigo, () => context.push('/user-dashboard')),
            _buildMenuItem(Icons.lock_open, 'Unlock History', Colors.purple, () => context.push('/unlock-history')),
            _buildMenuItem(Icons.card_giftcard, 'Refer & Earn', Colors.orange, () => context.push('/refer')),
            _buildMenuItem(Icons.star, 'Premium Plans', Colors.amber, () => context.push('/pricing')),

            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 4),

            _buildMenuItem(Icons.person_outline, profileComplete ? 'Edit Profile' : 'Complete Profile', AppTheme.primary,
                () => context.push(profileComplete ? '/profile-edit' : '/profile-complete')),

            if (user?.email?.toLowerCase() == 'nithinappala625@gmail.com')
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

            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 8),

            const Text('Notification Preferences', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 3)),
                ],
              ),
              child: Column(
                children: [
                  SwitchListTile(
                    secondary: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.notifications_active_rounded, color: AppTheme.primary, size: 20),
                    ),
                    title: const Text('Push Notifications', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Receive instant alerts on your device', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    value: _pushNotifications,
                    activeColor: AppTheme.primary,
                    onChanged: _togglePushNotifications,
                  ),
                  const Divider(height: 1, indent: 60),
                  SwitchListTile(
                    secondary: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.blue.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.mark_chat_unread_rounded, color: Colors.blue, size: 20),
                    ),
                    title: const Text('In-App Notifications', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Show alerts inside notifications hub', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    value: _inAppNotifications,
                    activeColor: AppTheme.primary,
                    onChanged: _toggleInAppNotifications,
                  ),
                  const Divider(height: 1, indent: 60),
                  SwitchListTile(
                    secondary: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: Colors.green.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.bolt_rounded, color: Colors.green, size: 20),
                    ),
                    title: const Text('Instant Listing Alerts', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Instant alerts for newly posted rooms & properties', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    value: _listingUpdates,
                    activeColor: AppTheme.primary,
                    onChanged: _toggleListingUpdates,
                  ),
                  const Divider(height: 1, indent: 60),
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.send_to_mobile_rounded, color: AppTheme.primary, size: 20),
                    ),
                    title: const Text('Test Notification Alert', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    subtitle: const Text('Trigger immediate test notification banner', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    trailing: const Icon(Icons.chevron_right, size: 18),
                    onTap: () async {
                      OneSignalService.showInAppAlert(
                        title: '🎉 Push Notifications Active!',
                        message: 'Real-time alert engine is active and ready on your device.',
                      );
                      await OneSignalService.broadcastInAppNotification(
                        title: 'Test Alert: Takevolet Live',
                        body: 'Push & in-app alerts are configured and active!',
                        type: 'system',
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),
            const Divider(),

            const SizedBox(height: 12),
            const Text('Legal & Support', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 8),

            _buildMenuItem(Icons.privacy_tip_outlined, 'Privacy Policy', Colors.blueGrey, () => _launchUrl('https://takevolet.online/privacy-policy')),
            _buildMenuItem(Icons.gavel_outlined, 'Terms & Conditions', Colors.blueGrey, () => _launchUrl('https://takevolet.online/terms-and-conditions')),
            _buildMenuItem(Icons.receipt_long_outlined, 'Refund Policy', Colors.blueGrey, () => _launchUrl('https://takevolet.online/refund-policy')),
            _buildMenuItem(Icons.contact_support_outlined, 'Contact Us', Colors.blueGrey, () => _launchUrl('https://takevolet.online/contact-us')),

            if (user?.email == 'nithinappala625@gmail.com' || user?.email == 'nithinpatel2025@gmail.com')
              _buildMenuItem(Icons.cell_tower_rounded, 'OneSignal Push Gateway Setup', const Color(0xFF7B3AEC), _showOneSignalKeyDialog),

            const SizedBox(height: 12),
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
            
            const SizedBox(height: 12),
            
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.black.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.delete_forever, color: Colors.black87, size: 20),
              ),
              title: const Text('Delete Account', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w600)),
              subtitle: const Text('Permanently remove your data', style: TextStyle(fontSize: 11, color: Colors.grey)),
              trailing: const Icon(Icons.chevron_right, color: Colors.black87),
              onTap: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Delete Account', style: TextStyle(color: Colors.red)),
                    content: const Text('Are you sure you want to delete your account? This action cannot be undone. All your listings, earnings, and profile data will be permanently removed.'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                      ElevatedButton(
                        onPressed: () async {
                          Navigator.pop(ctx);
                          // Handle account deletion by calling edge function or sending request
                          try {
                            await supabase.rpc('delete_user_account');
                            await supabase.auth.signOut();
                            if (mounted) context.go('/login');
                          } catch (e) {
                            if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to delete account. Please contact support@takevolet.online.'), backgroundColor: Colors.red));
                          }
                        },
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
                        child: const Text('Delete'),
                      ),
                    ],
                  ),
                );
              },
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

  void _showOneSignalKeyDialog() async {
    final controller = TextEditingController();
    try {
      final res = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'onesignal_rest_api_key').maybeSingle();
      if (res != null && res['setting_value'] != null) {
        final val = res['setting_value'];
        if (val is Map && val['api_key'] != null) {
          controller.text = val['api_key'].toString();
        } else if (val is String) {
          controller.text = val;
        }
      }
    } catch (_) {}

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('OneSignal Push Gateway Setup'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter your OneSignal REST API Key to broadcast high-priority push notifications to all users outside the app.',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 10),
            TextButton.icon(
              onPressed: () => _launchUrl('https://dashboard.onesignal.com/apps/b03d9671-382a-45ff-af9a-2ee01ae0a5e6/settings/keys_and_ids'),
              icon: const Icon(Icons.open_in_new, size: 16, color: Color(0xFF7B3AEC)),
              label: const Text('Copy Key from OneSignal Dashboard', style: TextStyle(fontSize: 12.5, color: Color(0xFF7B3AEC), fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              decoration: const InputDecoration(
                labelText: 'REST API Key',
                hintText: 'os_v2_app_...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              final key = controller.text.trim();
              if (key.isNotEmpty) {
                final success = await OneSignalService.setOneSignalRestApiKey(key);
                if (success) {
                  // Fire immediate push
                  await OneSignalService.sendPushNotification(
                    title: '🚀 Test Notification from Takevolet',
                    message: 'Push notifications are now working properly outside the app!',
                  );
                }
                if (ctx.mounted) Navigator.pop(ctx);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(success ? 'OneSignal Key updated & Test Push dispatched!' : 'Failed to save key'),
                      backgroundColor: success ? Colors.green : Colors.red,
                    ),
                  );
                }
              }
            },
            icon: const Icon(Icons.send_rounded, size: 16, color: Colors.white),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF7B3AEC)),
            label: const Text('Save & Test Push', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not launch $url')));
      }
    }
  }
}
