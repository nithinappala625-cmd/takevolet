import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../services/onesignal_service.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../main.dart';
import '../../utils/image_utils.dart';
import '../../utils/share_utils.dart';
import '../../widgets/full_screen_image_viewer.dart';
import '../feed/feed_video_player.dart';

class DayWiseDetailScreen extends StatefulWidget {
  final String id;
  const DayWiseDetailScreen({super.key, required this.id});

  @override
  State<DayWiseDetailScreen> createState() => _DayWiseDetailScreenState();
}

class _DayWiseDetailScreenState extends State<DayWiseDetailScreen> {
  Map<String, dynamic>? room;
  Map<String, dynamic>? posterProfile;
  bool isLoading = true;
  bool _hasUnlocked = false;
  String? _selectedPlanId;
  int _contactBalance = 0;
  int _pendingAmount = 0;
  int _pendingUnlocks = 1;

  late Razorpay _razorpay;
  final PageController _pageController = PageController();
  int _currentImageIndex = 0;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _fetchRoom();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _razorpay.clear();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId != null) {
      try {
        // ALWAYS unlock the current room immediately
        await supabase.from('contact_unlocks').insert({'room_id': widget.id, 'user_id': userId});
        
        // If they bought more than 1 contact, add the remainder to their balance
        if (_pendingUnlocks > 1) {
          final remainder = _pendingUnlocks - 1;
          await supabase.from('profiles').update({'contact_balance': _contactBalance + remainder}).eq('id', userId);
          if (mounted) setState(() => _contactBalance += remainder);
        }

        // Notify the owner that their room contact was unlocked
        if (room != null && room!['user_id'] != null) {
          try {
             await OneSignalService.sendPushNotification(
               title: 'Contact Unlocked!',
               message: 'Someone just unlocked your contact details for: ${room!['title']}',
             );
          } catch (_) {}
        }
      } catch (e) {}
    }

    // Verify payment on backend
    try {
      await supabase.functions.invoke('verify-razorpay-payment', body: {
        'order_id': response.orderId,
        'payment_id': response.paymentId,
        'signature': response.signature,
        'room_id': widget.id,
        'user_id': userId,
      });
    } catch (_) {}

    // Close bottom sheet if open
    if (context.mounted) {
      try { Navigator.pop(context); } catch (_) {}
    }

    // Fetch poster profile and mark unlocked
    await _fetchPosterProfile();
    setState(() => _hasUnlocked = true);

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('✅ Contact Unlocked Successfully!'),
        backgroundColor: Colors.green,
      ));
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('Payment Failed: ${response.message}'),
      backgroundColor: Colors.red,
    ));
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text('External Wallet: ${response.walletName}'),
    ));
  }

  Future<void> _fetchRoom() async {
    try {
      final res = await supabase.from('day_wise_stays').select().eq('id', widget.id).single();
      setState(() {
        room = res;
      });

      // Check if user already unlocked this room
      final userId = supabase.auth.currentUser?.id;
      if (userId != null) {
        final unlocks = await supabase
            .from('contact_unlocks')
            .select()
            .eq('room_id', widget.id)
            .eq('user_id', userId);
        if (unlocks != null && (unlocks as List).isNotEmpty) {
          setState(() => _hasUnlocked = true);
        }
        
        try {
          final p = await supabase.from('profiles').select('contact_balance').eq('id', userId).single();
          setState(() => _contactBalance = p['contact_balance'] ?? 0);
        } catch (_) {}
      }

      await _fetchPosterProfile();
      setState(() => isLoading = false);
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  Future<void> _fetchPosterProfile() async {
    if (room == null) return;
    try {
      final profile = await supabase
          .from('profiles')
          .select('full_name, phone, whatsapp, avatar_url, profession, email')
          .eq('id', room!['user_id'])
          .single();
          
      // Override with custom contact if the admin provided one
      if (room!['custom_contact'] != null && room!['custom_contact'].toString().trim().isNotEmpty) {
        final customContact = room!['custom_contact'].toString().trim();
        profile['phone'] = customContact;
        profile['whatsapp'] = customContact;
      }
      
      setState(() => posterProfile = profile);
    } catch (_) {}
  }

  Future<void> _purchasePlan(int amount, String desc, {int unlocks = 1}) async {
    _pendingAmount = amount;
    _pendingUnlocks = unlocks;
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    try {
      String? planId;
      if (desc != 'Visitor Pass' && desc != 'Premium Visitor Pass') {
        if (amount == 50) planId = 'single';
        else if (amount == 100) planId = 'starter';
        else if (amount == 200) planId = 'growth';
        else if (amount >= 500) planId = 'unlimited';
        else planId = 'single';
      }

      final Map<String, dynamic> bodyPayload = {
        'amount': amount * 100,
        'roomId': widget.id,
      };
      if (planId != null) {
        bodyPayload['planId'] = planId;
      }

      String keyId = 'rzp_live_SqU0ZW4NCgp5jo';
      String? orderId;

      try {
        final response = await supabase.functions.invoke('create-razorpay-order', body: bodyPayload);
        final data = response.data;
        if (data != null && data['id'] != null) {
          orderId = data['id'];
          if (data['keyId'] != null) keyId = data['keyId'];
        }
      } catch (fnErr) {
        debugPrint('create-razorpay-order edge function warning: $fnErr');
      }

      if (context.mounted) Navigator.pop(context);

      final Map<String, dynamic> options = {
        'key': keyId,
        'amount': amount * 100,
        'name': 'Takevolet',
        'description': desc,
        'theme': {
          'color': '#0F172A'
        },
        'prefill': {
          'contact': supabase.auth.currentUser?.phone ?? '',
          'email': supabase.auth.currentUser?.email ?? 'user@takevolet.com'
        }
      };

      if (orderId != null) {
        options['order_id'] = orderId;
      }

      _razorpay.open(options);
    } catch (e) {
      if (context.mounted) {
        try { Navigator.pop(context); } catch (_) {}
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Payment Error 🚨', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            content: Text('Could not start payment:\n\n$e'),
            actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
          ),
        );
      }
    }
  }

  void _showUnlockDialog() {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Unlock Contact'),
          content: Text('You have $_contactBalance contacts remaining.\nUse 1 to unlock this contact?'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  await supabase.from('contact_unlocks').insert({'room_id': widget.id, 'user_id': supabase.auth.currentUser!.id});
                  await supabase.from('profiles').update({'contact_balance': _contactBalance - 1}).eq('id', supabase.auth.currentUser!.id);
                  setState(() {
                    _contactBalance--;
                    _hasUnlocked = true;
                  });
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Contact Unlocked!'), backgroundColor: Colors.green));
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red));
                  }
                }
              },
              child: const Text('Unlock'),
            ),
          ],
        ),
      );
  }

  void _showUnlockSheet() {
    final String location = (room!['location'] ?? '').toLowerCase();
    final String city = (room!['city'] ?? '').toLowerCase();
    // Contact plans only
    final List<Map<String, dynamic>> plans = [
      {'title': 'Single Contact', 'subtitle': '1 Room', 'price': 50, 'color': Colors.blue, 'unlocks': 1},
      {'title': 'Quick Connect', 'subtitle': '5 Rooms', 'price': 100, 'color': Colors.orange, 'unlocks': 5},
      {'title': 'Smart Connect', 'subtitle': '15 Rooms', 'price': 200, 'color': Colors.purple, 'isBestValue': true, 'unlocks': 15},
      {'title': 'Mega Connect', 'subtitle': '50 Rooms', 'price': 500, 'color': Colors.green, 'unlocks': 50},
    ];

    Map<String, dynamic>? selectedPlan = plans[2]; // Default to Smart Connect (15 Rooms - ₹200)

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setModalState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                children: [
                  Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
                  const SizedBox(height: 20),
                  const Text('Unlock Contact', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const Text('Note: no brokers involved', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Choose a plan to contact the owner directly', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 20),
                  Expanded(
                    child: ListView.builder(
                      itemCount: plans.length,
                      itemBuilder: (context, index) {
                        final plan = plans[index];
                        final isSelected = selectedPlan == plan;
                        final isVisitor = plan['isVisitor'] == true;
                        
                        return GestureDetector(
                          onTap: () {
                            setModalState(() {
                              selectedPlan = plan;
                            });
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected ? plan['color'] : (plan['isBestValue'] == true ? plan['color'].withOpacity(0.5) : Colors.grey[200]!),
                                width: isSelected ? 2 : 1,
                              ),
                              boxShadow: [if (isSelected) BoxShadow(color: plan['color'].withOpacity(0.2), blurRadius: 8, offset: const Offset(0, 4))],
                            ),
                            child: Stack(
                              children: [
                                if (plan['isBestValue'] == true)
                                  Positioned(
                                    top: 0, right: 12,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(color: plan['color'], borderRadius: const BorderRadius.vertical(bottom: Radius.circular(6))),
                                      child: const Text('BEST VALUE', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                if (isSelected)
                                  Positioned(
                                    top: 16, right: 16,
                                    child: Icon(Icons.check_circle, color: plan['color'], size: 24),
                                  ),
                                ListTile(
                                  contentPadding: const EdgeInsets.all(16),
                                  leading: CircleAvatar(
                                    backgroundColor: plan['color'].withOpacity(0.1),
                                    child: Icon(Icons.bolt, color: plan['color']),
                                  ),
                                  title: Text(plan['title'], style: const TextStyle(fontWeight: FontWeight.bold)),
                                  subtitle: Text(plan['subtitle'], style: const TextStyle(color: Colors.grey)),
                                  trailing: isSelected ? null : Text('₹${plan['price']}', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: plan['color'])),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: selectedPlan != null ? () {
                        Navigator.pop(context); // close modal first
                        _purchasePlan(selectedPlan!['price'], selectedPlan!['title'], unlocks: selectedPlan!['unlocks'] ?? 1); // selectedPlan!['title']);
                      } : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: selectedPlan != null ? Theme.of(context).colorScheme.primary : Colors.grey,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(selectedPlan != null ? 'Proceed to Pay ₹${selectedPlan!['price']}' : 'Select a Plan', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        );
      },
    );
  }

  String _formatPartiallyRevealedPhone(String? rawPhone) {
    if (rawPhone == null || rawPhone.trim().isEmpty) return '+91 98•• ••••••';
    final digits = rawPhone.replaceAll(RegExp(r'\D'), '');
    if (digits.length >= 10) {
      final p = digits.length == 12 && digits.startsWith('91') ? digits.substring(2) : digits;
      if (p.length >= 4) {
        final first4 = p.substring(0, 4);
        return '+91 $first4 •• ••••';
      }
    } else if (digits.length >= 4) {
      return '+91 ${digits.substring(0, 4)} •• ••••';
    }
    return '+91 98•• ••••••';
  }

  Widget _buildContactUnlockedCard() {
    final name = posterProfile?['full_name'] ?? room?['title'] ?? 'Owner';
    final phone = posterProfile?['phone'] ?? '';
    final whatsapp = posterProfile?['whatsapp'] ?? phone;
    final profession = posterProfile?['profession'] ?? '';
    final avatar = posterProfile?['avatar_url'];
    final fullAddress = room?['full_address'] ?? room?['house_no'] ?? '';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green.shade50, Colors.green.shade100.withOpacity(0.5)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.green.shade300),
        boxShadow: [BoxShadow(color: Colors.green.withOpacity(0.15), blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: Column(
        children: [
          // Header
          Row(children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.green.shade400, borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.check_circle, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Contact Unlocked ✅', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green)),
                Text('You can now contact the owner', style: TextStyle(color: Colors.grey, fontSize: 12)),
              ]),
            ),
          ]),
          const SizedBox(height: 20),
          // Owner info
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
            child: Column(
              children: [
                Row(children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: const Color(0xFF7B3AEC).withOpacity(0.2),
                    backgroundImage: avatar != null ? NetworkImage(avatar) : null,
                    child: avatar == null ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'O', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: Color(0xFF7B3AEC))) : null,
                  ),
                  const SizedBox(width: 14),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
                    if (profession.isNotEmpty)
                      Text(profession, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                  ])),
                ]),
                if (phone.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(10)),
                    child: Row(children: [
                      Icon(Icons.phone, color: Colors.green[600], size: 18),
                      const SizedBox(width: 10),
                      Text(phone, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16, letterSpacing: 0.5)),
                    ]),
                  ),
                ],
                if (fullAddress.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(10)),
                    child: Row(children: [
                      Icon(Icons.location_on, color: Colors.orange[700], size: 18),
                      const SizedBox(width: 10),
                      Expanded(child: Text(fullAddress, style: TextStyle(color: Colors.grey[800], fontSize: 13))),
                    ]),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPosterInfoCard() {
    // Use the profile's full_name. If profile not loaded yet, fallback to 'Takevolet Partner'
    final name = (posterProfile?['full_name'] ?? '').toString().trim();
    final displayName = name.isNotEmpty ? name : 'Takevolet Partner';
    final profession = 'Takevolet Partner';
    final avatar = posterProfile?['avatar_url'];
    final int rent = room!['rent'] ?? 0;
    final String location = (room!['location'] ?? '').toLowerCase();
    final String city = (room!['city'] ?? '').toLowerCase();
    final bool isTier1City = city.contains('bangalore') || city.contains('bengaluru') || 
                             city.contains('pune') || city.contains('mumbai') || 
                             city.contains('delhi') || city.contains('chennai');
    
    // Show only visiting charges on button (not total)
    int visitingCharges = 0;
    int platformFee = 0;
    if (isTier1City) {
      if (rent <= 20000) { visitingCharges = 600; platformFee = 2400; }
      else { visitingCharges = 1000; platformFee = 4000; }
    } else {
      if (rent <= 20000) { visitingCharges = 300; platformFee = 1200; }
      else { visitingCharges = 500; platformFee = 2000; }
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('POSTED BY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2)),
          const SizedBox(height: 16),
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: const Color(0xFF7B3AEC).withOpacity(0.2),
                backgroundImage: avatar != null ? CachedNetworkImageProvider(avatar) : null,
                child: avatar == null ? Text(displayName.isNotEmpty ? displayName[0].toUpperCase() : 'T', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Color(0xFF7B3AEC))) : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(displayName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    Text(profession, style: const TextStyle(color: Color(0xFF7B3AEC), fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    const Row(
                      children: [
                        Icon(Icons.star, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star, color: Color(0xFF7B3AEC), size: 16),
                        SizedBox(width: 4),
                        Text('Verified', style: TextStyle(fontSize: 12, color: Color(0xFF7B3AEC), fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Masked phone container
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A).withOpacity(0.06),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.phone_locked_rounded, color: Color(0xFF0F172A), size: 18),
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PHONE NUMBER',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF94A3B8),
                          letterSpacing: 1,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        _formatPartiallyRevealedPhone(phone),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                          letterSpacing: 1.5,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Verified Contact • First 4 digits revealed',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Unlock Button
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              onPressed: _showUnlockSheet,
              icon: const Icon(Icons.lock_open_rounded, size: 20),
              label: const Text(
                'Unlock Contact Details',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, letterSpacing: 0.5),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Trust Badges Row
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.shield_outlined, size: 13, color: Color(0xFF16A34A)),
                  SizedBox(width: 4),
                  Text('100% Genuine', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF334155))),
                ],
              ),
              SizedBox(width: 12),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.bolt_rounded, size: 13, color: Color(0xFF16A34A)),
                  SizedBox(width: 4),
                  Text('Direct Contact', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF334155))),
                ],
              ),
              SizedBox(width: 12),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.lock_clock_rounded, size: 13, color: Color(0xFF16A34A)),
                  SizedBox(width: 4),
                  Text('Instant Unlock', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF334155))),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumPlans() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Center(
            child: Text('PREMIUM ROOM HUNTING', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0F5A3E), letterSpacing: 1.2)),
          ),
          const SizedBox(height: 16),
          _buildPlan1Card(),
          const SizedBox(height: 16),
          _buildPlan2Card(),
        ],
      ),
    );
  }

  Widget _buildPlan1Card() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F5A3E), // Dark green from poster
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFF0A3E2A),
              borderRadius: BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
            ),
            child: const Column(
              children: [
                Text('PLAN 1', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                SizedBox(height: 4),
                Text('GENERAL ROOM HUNT', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                const Text('GET ROOM LOCATION ADDRESS & OWNER CONTACT', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: Colors.black87)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFFFFD700), borderRadius: BorderRadius.circular(4)),
                  child: const Text('WE SHARE, YOU VISIT & CHECK!', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildPriceBox('ROOM RENT UNDER ₹10,000', '₹300', 'VISIT 5 HOUSES', '₹1,200', '₹500', 'VISIT 10 HOUSES')),
                    const SizedBox(width: 8),
                    Expanded(child: _buildPriceBox('ROOM RENT ABOVE ₹10,000', '₹300', 'VISIT 5 HOUSES', '₹2,200', '₹500', 'VISIT 10 HOUSES')),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: const Color(0xFF0F5A3E), borderRadius: BorderRadius.circular(8)),
                  child: const Text('PAY PLATFORM FEE AFTER ROOM CONFIRMED', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10)),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildPriceBox(String header, String p1, String v1, String fee, String p2, String v2) {
    return Container(
      decoration: BoxDecoration(border: Border.all(color: const Color(0xFF0F5A3E), width: 2), borderRadius: BorderRadius.circular(8)),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 4),
            color: const Color(0xFF0F5A3E),
            child: Text(header, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 9)),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Pay\n$p1', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F5A3E))),
                    Text(v1, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 9)),
                  ],
                ),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Pay\n$p2', textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF0F5A3E))),
                    Text(v2, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 9)),
                  ],
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 4),
                  decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(4)),
                  child: Text('Confirmed Fee: $fee', style: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.bold, fontSize: 9)),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildPlan2Card() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0F5A3E), // Dark green
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFF0A3E2A),
              borderRadius: BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
            ),
            child: const Column(
              children: [
                Text('PLAN 2', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                SizedBox(height: 4),
                Text('PERSONAL ROOM HUNT', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                const Text('BASED ON YOUR REQUIREMENT • BUDGET • LOCATION', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Colors.black87)),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFFFFD700), borderRadius: BorderRadius.circular(4)),
                  child: const Text('WE SEARCH. WE VISIT. WE HANDOVER.', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _buildPlan2PriceBox('RENT UNDER ₹10,000', '₹599', '₹1,200')),
                    const SizedBox(width: 8),
                    const Text('OR', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
                    const SizedBox(width: 8),
                    Expanded(child: _buildPlan2PriceBox('RENT ABOVE ₹10,000', '₹799', '₹2,500')),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(color: const Color(0xFF0F5A3E), borderRadius: BorderRadius.circular(8)),
                      child: const Row(
                        children: [
                          Icon(Icons.verified, color: Colors.white, size: 16),
                          SizedBox(width: 6),
                          Text('50% REFUND IF NOT SATISFIED', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                        ],
                      ),
                    ),
                  ],
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildPlan2PriceBox(String header, String dayPrice, String fee) {
    return Container(
      decoration: BoxDecoration(border: Border.all(color: const Color(0xFF0F5A3E), width: 2), borderRadius: BorderRadius.circular(8)),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 4),
            color: const Color(0xFF0F5A3E),
            child: Text(header, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 9)),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                Text(dayPrice, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 24, color: Color(0xFF0F5A3E))),
                const Text('PER DAY (4 HOURS)', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                const Text('₹149 PER HOUR', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.orange)),
                const Divider(),
                const Text('PLATFORM FEE', style: TextStyle(fontSize: 8, color: Colors.grey, fontWeight: FontWeight.bold)),
                Text(fee, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
                const Text('(To be paid after room confirmed)', textAlign: TextAlign.center, style: TextStyle(fontSize: 7, color: Colors.grey)),
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildProgressStep(String number, String label, bool active) {
    return Column(
      children: [
        CircleAvatar(
          radius: 12,
          backgroundColor: active ? Theme.of(context).colorScheme.primary : Colors.grey.shade300,
          child: Text(number, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: active ? Theme.of(context).colorScheme.primary : Colors.grey)),
      ],
    );
  }

  Widget _buildBottomActionButtons() {
    if (_hasUnlocked) {
      final phone = posterProfile?['phone'] ?? '';
      final whatsapp = posterProfile?['whatsapp'] ?? phone;
      return Row(children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: phone.isNotEmpty ? () => launchUrl(Uri.parse('tel:$phone')) : null,
            icon: const Icon(Icons.call, size: 18),
            label: const Text('Call Now', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green[600],
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: whatsapp.isNotEmpty
                ? () => launchUrl(Uri.parse('https://wa.me/${whatsapp.replaceAll(RegExp(r'[^\d]'), '')}'))
                : null,
            icon: const Icon(Icons.message, size: 18),
            label: const Text('WhatsApp', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF25D366),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
          ),
        ),
      ]);
    } else {
      return InkWell(
        onTap: _contactBalance > 0 ? _showUnlockDialog : _showUnlockSheet,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          height: 56,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF7B3AEC), Color(0xFF6D28D9)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF7B3AEC).withOpacity(0.35),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.lock_open_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 10),
              Text(
                'Unlock Owner Details',
                style: GoogleFonts.outfit(
                  fontSize: 16.5,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'DIRECT ACCESS',
                  style: GoogleFonts.outfit(
                    fontSize: 9.5,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFF6D28D9),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (room == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Room not found')));

    final images = ImageUtils.parseImages(room!['images']);
    final metadata = room!['metadata'] ?? {};
    if (images.isEmpty) {
      final imgStr = room!['image'] as String?;
      if (imgStr != null && imgStr.isNotEmpty) images.add(imgStr);
      else images.add('https://images.unsplash.com/photo-1502690266266-ce3f2824cd16?w=800&q=80');
    }

    final rawVideo = (room!['video_url'] ?? metadata['video_url'])?.toString().trim();
    final String? videoUrl = (rawVideo != null && rawVideo.isNotEmpty) ? rawVideo : null;

    final List<Map<String, String>> mediaItems = [];
    if (images.isNotEmpty) {
      mediaItems.add({'type': 'image', 'url': images[0]});
    }
    if (videoUrl != null) {
      mediaItems.add({'type': 'video', 'url': videoUrl});
    }
    if (images.length > 1) {
      for (int i = 1; i < images.length; i++) {
        mediaItems.add({'type': 'image', 'url': images[i]});
      }
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                children: [
                  PageView.builder(
                    controller: _pageController,
                    onPageChanged: (i) => setState(() => _currentImageIndex = i),
                    itemCount: mediaItems.length,
                    itemBuilder: (context, index) {
                      final item = mediaItems[index];
                      if (item['type'] == 'video') {
                        return Container(
                          color: Colors.black,
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              FeedVideoPlayer(videoUrl: item['url']!),
                              Positioned(
                                top: 45,
                                left: 16,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.65),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(color: Colors.white24),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.videocam_rounded, color: Color(0xFFA78BFA), size: 14),
                                      SizedBox(width: 5),
                                      Text('PROPERTY VIDEO', style: TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.5)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }
                      return InkWell(
                        onTap: () {
                          final imgIndex = images.indexOf(item['url']!);
                          Navigator.push(context, MaterialPageRoute(builder: (_) => FullScreenImageViewer(
                            imageUrls: images,
                            initialIndex: imgIndex >= 0 ? imgIndex : 0,
                          )));
                        },
                        child: CachedNetworkImage(imageUrl: item['url']!, fit: BoxFit.cover,
                          placeholder: (_, __) => Container(color: Colors.grey[200])),
                      );
                    },
                  ),
                  if (mediaItems.length > 1) ...[
                    Positioned(left: 10, top: 0, bottom: 0, child: Center(child: IconButton(
                      icon: const Icon(Icons.arrow_back_ios, color: Colors.white, size: 28),
                      onPressed: () => _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut),
                    ))),
                    Positioned(right: 10, top: 0, bottom: 0, child: Center(child: IconButton(
                      icon: const Icon(Icons.arrow_forward_ios, color: Colors.white, size: 28),
                      onPressed: () => _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut),
                    ))),
                    Positioned(
                      bottom: 20, left: 0, right: 0,
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(mediaItems.length, (i) {
                        final isSelected = _currentImageIndex == i;
                        final isVideo = mediaItems[i]['type'] == 'video';
                        if (isVideo) {
                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(10),
                              color: isSelected ? const Color(0xFF7B3AEC) : Colors.black.withValues(alpha: 0.55),
                              border: Border.all(color: isSelected ? Colors.white : Colors.white24),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.play_arrow_rounded, size: 12, color: isSelected ? Colors.white : Colors.white70),
                                const SizedBox(width: 2),
                                Text('Video', style: TextStyle(color: isSelected ? Colors.white : Colors.white70, fontSize: 10, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          );
                        }
                        return Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: isSelected ? 12 : 8, height: isSelected ? 12 : 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isSelected ? Theme.of(context).colorScheme.primary : Colors.white.withValues(alpha: 0.5),
                          ),
                        );
                      })),
                    ),
                  ],
                  Positioned(
                    top: 40, right: 10,
                    child: IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(color: Colors.black45, shape: BoxShape.circle),
                        child: const Icon(Icons.share, color: Colors.white, size: 20),
                      ),
                      onPressed: () {
                        ShareUtils.generateRoomShare(context, room!);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category Badge + Available Badge
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF5F3FF),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFDDD6FE)),
                            ),
                            child: const Text(
                              'DAY-WISE STAY',
                              style: TextStyle(
                                color: Color(0xFF92400E),
                                fontWeight: FontWeight.w900,
                                fontSize: 11,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFF86EFAC)),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.check_circle_rounded, size: 12, color: Color(0xFF16A34A)),
                                SizedBox(width: 4),
                                Text(
                                  'Available Now',
                                  style: TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.w800, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      // Listing Title
                      Text(
                        room!['title'] ?? 'Premium Day-Wise Stay',
                        style: GoogleFonts.outfit(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFF0F172A),
                          letterSpacing: -0.5,
                          height: 1.25,
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Location Badge (NO ash color, NO leading comma)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFCBD5E1)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.location_on_rounded, color: Color(0xFFE11D48), size: 18),
                            const SizedBox(width: 6),
                            Flexible(
                              child: Text(
                                [
                                  if ((room!['colony'] ?? '').toString().trim().isNotEmpty) (room!['colony'] ?? '').toString().trim(),
                                  if ((room!['location'] ?? '').toString().trim().isNotEmpty) (room!['location'] ?? '').toString().trim(),
                                  if ((room!['city'] ?? '').toString().trim().isNotEmpty && (room!['city'] ?? '').toString().trim().toLowerCase() != (room!['location'] ?? '').toString().trim().toLowerCase()) (room!['city'] ?? '').toString().trim(),
                                ].where((e) => e.isNotEmpty).join(', ').isNotEmpty
                                    ? [
                                        if ((room!['colony'] ?? '').toString().trim().isNotEmpty) (room!['colony'] ?? '').toString().trim(),
                                        if ((room!['location'] ?? '').toString().trim().isNotEmpty) (room!['location'] ?? '').toString().trim(),
                                        if ((room!['city'] ?? '').toString().trim().isNotEmpty && (room!['city'] ?? '').toString().trim().toLowerCase() != (room!['location'] ?? '').toString().trim().toLowerCase()) (room!['city'] ?? '').toString().trim(),
                                      ].where((e) => e.isNotEmpty).join(', ')
                                    : 'Location verified with host',
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                                softWrap: true,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Rich Pricing Card with dynamic duration
                      // Modern Ultra-Clean Pricing Card
                      Builder(
                        builder: (context) {
                          final isDark = Theme.of(context).brightness == Brightness.dark;
                          return Container(
                            margin: const EdgeInsets.only(top: 16),
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: isDark
                                    ? [const Color(0xFF1E1B4B), const Color(0xFF0F172A)]
                                    : [const Color(0xFFFAF5FF), const Color(0xFFF3E8FF)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isDark ? const Color(0xFF4338CA) : const Color(0xFFDDD6FE),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(0xFF7B3AEC).withOpacity(isDark ? 0.25 : 0.12),
                                  blurRadius: 16,
                                  offset: const Offset(0, 5),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF7B3AEC).withOpacity(0.15),
                                            shape: BoxShape.circle,
                                          ),
                                          child: const Icon(Icons.currency_rupee_rounded, size: 12, color: Color(0xFF7B3AEC)),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          'STAY TARIFF',
                                          style: GoogleFonts.outfit(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                            color: const Color(0xFF7B3AEC),
                                            letterSpacing: 1.2,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Row(
                                      crossAxisAlignment: CrossAxisAlignment.baseline,
                                      textBaseline: TextBaseline.alphabetic,
                                      children: [
                                        Text(
                                          '₹${_formatNumber(room!['rent'])}',
                                          style: GoogleFonts.outfit(
                                            fontSize: 30,
                                            fontWeight: FontWeight.w900,
                                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                                            letterSpacing: -0.5,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          metadata['duration'] != null && metadata['duration'].toString().trim().isNotEmpty
                                              ? '/ ${metadata['duration'].toString().trim()}'
                                              : (metadata['duration_hours'] != null
                                                  ? '/ ${metadata['duration_hours']} hrs'
                                                  : '/ day'),
                                          style: GoogleFonts.outfit(
                                            fontSize: 14,
                                            fontWeight: FontWeight.w700,
                                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFF059669), Color(0xFF047857)],
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: [
                                      BoxShadow(
                                        color: const Color(0xFF059669).withOpacity(0.3),
                                        blurRadius: 8,
                                        offset: const Offset(0, 3),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.shield_rounded, color: Colors.white, size: 14),
                                      const SizedBox(width: 5),
                                      Text(
                                        '0 Brokerage',
                                        style: GoogleFonts.outfit(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w800,
                                          fontSize: 11.5,
                                          letterSpacing: 0.3,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),

                      // Box-Oriented Overview Card
                      Container(
                        margin: const EdgeInsets.only(top: 20),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF7B3AEC).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.apartment_rounded, color: Color(0xFF6D28D9), size: 18),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                'Overview & Highlights',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                              ),
                            ]),
                            const SizedBox(height: 14),
                            Wrap(
                              spacing: 10,
                              runSpacing: 10,
                              children: [
                                _buildOverviewBox(Icons.wc_rounded, 'Preference', metadata['gender_preference']?.toString() ?? room!['gender_preference']?.toString() ?? 'Any'),
                                _buildOverviewBox(Icons.chair_rounded, 'Furnishing', metadata['furnishing']?.toString() ?? room!['furnishing']?.toString() ?? 'Furnished'),
                                _buildOverviewBox(Icons.group_rounded, 'Capacity', '${metadata['members_allowed']?.toString() ?? room!['members_allowed']?.toString() ?? 1} Max'),
                                if ((metadata['parking'] ?? room!['parking']) != null && (metadata['parking'] ?? room!['parking']) != 'None')
                                  _buildOverviewBox(Icons.local_parking_rounded, 'Parking', (metadata['parking'] ?? room!['parking']).toString()),
                                if (metadata['duration'] != null)
                                  _buildOverviewBox(Icons.schedule_rounded, 'Duration', metadata['duration'].toString()),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Box-Oriented Description Card (Bold, High Contrast)
                      Container(
                        margin: const EdgeInsets.only(top: 16),
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF7B3AEC).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(Icons.notes_rounded, color: Color(0xFF6D28D9), size: 18),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                'Property Description',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                              ),
                            ]),
                            const SizedBox(height: 12),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: const Color(0xFFE2E8F0)),
                              ),
                              child: Text(
                                (room!['description'] != null && room!['description'].toString().trim().isNotEmpty)
                                    ? room!['description'].toString().trim()
                                    : 'All genuine amenities and standard facilities are provided with this listing. Contact the owner directly to schedule a physical walkthrough or for further inquiries.',
                                style: const TextStyle(
                                  color: Color(0xFF0F172A),
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  height: 1.6,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                    ],
                  ),
                ),

                // CONTACT UNLOCKED CARD
                if (_hasUnlocked) _buildContactUnlockedCard()
                else ...[
                  _buildPosterInfoCard(),
                  const SizedBox(height: 16),
                ],

                const SizedBox(height: 24),
              ],
            ),
          )
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24), // padding for bottom safe area
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: _buildBottomActionButtons(),
        ),
      ),
      bottomSheet: const SizedBox.shrink(),
    );
  }

  String _formatNumber(dynamic n) {
    if (n == null) return '0';
    final str = n.toString().replaceAll(',', '');
    final numVal = int.tryParse(str);
    if (numVal == null) return str;
    final s = numVal.toString();
    if (s.length <= 3) return s;
    final lastThree = s.substring(s.length - 3);
    final otherNumbers = s.substring(0, s.length - 3);
    final formatted = otherNumbers.replaceAllMapped(
      RegExp(r'(\d)(?=(\d{2})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
    return '$formatted,$lastThree';
  }

  Widget _buildOverviewBox(IconData icon, String title, String value) {
    return Container(
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width / 2 - 28),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: const Color(0xFF7B3AEC).withOpacity(0.15),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: const Color(0xFF6D28D9)),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF64748B),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                  softWrap: true,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
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


