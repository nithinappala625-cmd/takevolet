import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:share_plus/share_plus.dart';
import '../../main.dart';
import '../../utils/image_utils.dart';
import '../../widgets/full_screen_image_viewer.dart';

class RoomDetailScreen extends StatefulWidget {
  final String id;
  const RoomDetailScreen({super.key, required this.id});

  @override
  State<RoomDetailScreen> createState() => _RoomDetailScreenState();
}

class _RoomDetailScreenState extends State<RoomDetailScreen> {
  Map<String, dynamic>? room;
  Map<String, dynamic>? posterProfile;
  bool isLoading = true;
  bool _hasUnlocked = false;
  String? _selectedPlanId;
  int _contactBalance = 0;
  int _pendingAmount = 0;

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
    // Check pending amount and apply balance directly
    final userId = supabase.auth.currentUser?.id;
    if (userId != null) {
      try {
        if (_pendingAmount == 35 || _pendingAmount == 55) {
          // Starter Pack: add 5 contacts (or 10 based on old pricing, we will adjust pricing in _showUnlockDialog)
          // 35rs = 5 contacts
          await supabase.from('profiles').update({'contact_balance': _contactBalance + 5}).eq('id', userId);
          if (mounted) setState(() => _contactBalance += 5);
        } else if (_pendingAmount == 15 || _pendingAmount == 30) {
          // Single contact unlock
          await supabase.from('contact_unlocks').insert({'room_id': widget.id, 'user_id': userId});
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
      final res = await supabase.from('rooms').select().eq('id', widget.id).single();
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
      setState(() => posterProfile = profile);
    } catch (_) {}
  }

  Future<void> _purchasePlan(int amount, String desc) async {
    _pendingAmount = amount;
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    try {
      String? planId;
      if (desc != 'Visitor Pass' && desc != 'Premium Visitor Pass') {
        if (amount == 35 || amount == 55 || amount == 65 || amount == 110) planId = 'starter';
        else if (amount == 105 || amount == 210) planId = 'growth';
        else if (amount >= 200) planId = 'unlimited';
        else planId = 'single';
      }

      final Map<String, dynamic> bodyPayload = {
        'amount': amount * 100,
        'roomId': widget.id,
      };
      if (planId != null) {
        bodyPayload['planId'] = planId;
      }

      final response = await supabase.functions.invoke('create-razorpay-order', body: bodyPayload);
      if (context.mounted) Navigator.pop(context);

      final data = response.data;
      if (data == null || data['id'] == null) {
        final errorDetail = data?['error'] ?? 'No order ID returned';
        throw Exception('Failed to create order: $errorDetail');
      }

      var options = {
        'key': data['keyId'] ?? 'rzp_test_Sq0dFrEKuO85Mh',
        'amount': amount * 100,
        'name': 'Takevolet',
        'description': desc,
        'order_id': data['id'],
        'prefill': {
          'contact': supabase.auth.currentUser?.phone ?? '',
          'email': supabase.auth.currentUser?.email ?? 'user@takevolet.com'
        }
      };
      _razorpay.open(options);
    } catch (e) {
      if (context.mounted) {
        try { Navigator.pop(context); } catch (_) {}
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Payment Error 🚨', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            content: Text('Could not start payment:\n\n$e\n\nMake sure Edge Functions are deployed with Razorpay keys.'),
            actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
          ),
        );
      }
    }
  }

  void _showUnlockDialog() {
    if (_contactBalance > 0) {
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
      return;
    }

    final String location = (room!['location'] ?? '').toLowerCase();
    final String city = (room!['city'] ?? '').toLowerCase();
    final bool isBangalore = location.contains('bangalore') || location.contains('bengaluru') || city.contains('bangalore') || city.contains('bengaluru');
    
    // Contact plans only
    final List<Map<String, dynamic>> plans = isBangalore ? [
      {'title': 'Single Contact', 'subtitle': '1 Contact', 'price': 30, 'color': Colors.blue},
      {'title': 'Starter Pack', 'subtitle': '5 Contacts', 'price': 65, 'color': Colors.orange},
      {'title': 'Growth Pack', 'subtitle': '50 Contacts', 'price': 210, 'color': Colors.purple, 'isBestValue': true},
      {'title': 'Unlimited', 'subtitle': 'Unlimited Contacts', 'price': 400, 'color': Colors.red},
    ] : [
      {'title': 'Single Contact', 'subtitle': '1 Contact', 'price': 15, 'color': Colors.blue},
      {'title': 'Starter Pack', 'subtitle': '5 Contacts', 'price': 35, 'color': Colors.orange},
      {'title': 'Growth Pack', 'subtitle': '50 Contacts', 'price': 105, 'color': Colors.purple, 'isBestValue': true},
      {'title': 'Unlimited', 'subtitle': 'Unlimited Contacts', 'price': 200, 'color': Colors.red},
    ];

    Map<String, dynamic>? selectedPlan = plans[2]; // Default to Growth Pack

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
                              color: isVisitor ? (isSelected ? Colors.amber.shade50 : Colors.white) : (isSelected ? plan['color'].withOpacity(0.05) : Colors.white),
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
                        _purchasePlan(selectedPlan!['price'], selectedPlan!['title']);
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
                    backgroundColor: const Color(0xFFD4AF37).withOpacity(0.2),
                    backgroundImage: avatar != null ? NetworkImage(avatar) : null,
                    child: avatar == null ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'O', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 22, color: Color(0xFFD4AF37))) : null,
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
    final bool isBangalore = location.contains('bangalore') || location.contains('bengaluru') || city.contains('bangalore') || city.contains('bengaluru');
    
    // Show only visiting charges on button (not total)
    int visitingCharges = 0;
    int platformFee = 0;
    if (isBangalore) {
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
                backgroundColor: const Color(0xFFD4AF37).withOpacity(0.2),
                backgroundImage: avatar != null ? CachedNetworkImageProvider(avatar) : null,
                child: avatar == null ? Text(displayName.isNotEmpty ? displayName[0].toUpperCase() : 'T', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Color(0xFFD4AF37))) : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(displayName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    Text(profession, style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    const Row(
                      children: [
                        Icon(Icons.star, color: Color(0xFFD4AF37), size: 16),
                        Icon(Icons.star, color: Color(0xFFD4AF37), size: 16),
                        Icon(Icons.star, color: Color(0xFFD4AF37), size: 16),
                        Icon(Icons.star, color: Color(0xFFD4AF37), size: 16),
                        Icon(Icons.star, color: Color(0xFFD4AF37), size: 16),
                        SizedBox(width: 4),
                        Text('Verified', style: TextStyle(fontSize: 12, color: Color(0xFFD4AF37), fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildProgressStep('1', 'INTERESTED', true),
              Expanded(child: Divider(color: Theme.of(context).colorScheme.primary, thickness: 2)),
              _buildProgressStep('2', 'VISIT ROOM', false),
              Expanded(child: Divider(color: Colors.grey.shade300, thickness: 2)),
              _buildProgressStep('3', 'CONFIRMED', false),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(color: Colors.grey[50], borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
            child: Row(
              children: [
                const Icon(Icons.lock, color: Colors.grey, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    '+91 ••••• •••••',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey.shade600, letterSpacing: 2),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Icon(Icons.info_outline, size: 14, color: Colors.grey.shade500),
              const SizedBox(width: 6),
              Expanded(child: Text('Visiting charges: ₹$visitingCharges, Platform fee: ₹$platformFee', style: TextStyle(fontSize: 11, color: Colors.grey.shade500, fontStyle: FontStyle.italic))),
            ],
          ),
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
      final String location = (room?['location'] ?? '').toLowerCase();
      final String city = (room?['city'] ?? '').toLowerCase();
      final bool isBangalore = location.contains('bangalore') || location.contains('bengaluru') || city.contains('bangalore') || city.contains('bengaluru');
      final int rent = room?['rent'] ?? 0;
      // Show only visiting charges on button
      int visitingCharges = 0;
      if (isBangalore) {
        visitingCharges = rent <= 20000 ? 600 : 1000;
      } else {
        visitingCharges = rent <= 20000 ? 300 : 500;
      }
      return Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => _purchasePlan(visitingCharges, 'Visitor Pass'),
              icon: const Icon(Icons.star, size: 18),
              label: Text('Visitor Pass\n(₹$visitingCharges)', textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber.shade700,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _showUnlockDialog,
              icon: const Icon(Icons.lock_open, size: 18),
              label: const Text('Contact\nUnlock', textAlign: TextAlign.center, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (room == null) return Scaffold(appBar: AppBar(), body: const Center(child: Text('Room not found')));

    final images = ImageUtils.parseImages(room!['images']);
    if (images.isEmpty) {
      final imgStr = room!['image'] as String?;
      if (imgStr != null && imgStr.isNotEmpty) images.add(imgStr);
      else images.add('https://images.unsplash.com/photo-1502690266266-ce3f2824cd16?w=800&q=80');
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
                    itemCount: images.length,
                    itemBuilder: (context, index) {
                      return InkWell(
                        onTap: () {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => FullScreenImageViewer(
                            imageUrls: images,
                            initialIndex: index,
                          )));
                        },
                        child: CachedNetworkImage(imageUrl: images[index], fit: BoxFit.cover,
                          placeholder: (_, __) => Container(color: Colors.grey[200])),
                      );
                    },
                  ),
                  if (images.length > 1) ...[
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
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(images.length, (i) {
                        return Container(
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          width: _currentImageIndex == i ? 12 : 8, height: _currentImageIndex == i ? 12 : 8,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: _currentImageIndex == i ? Theme.of(context).colorScheme.primary : Colors.white.withOpacity(0.5),
                          ),
                        );
                      })),
                    ),
                  ],
                  Positioned(
                    top: 40, right: 10,
                    child: IconButton(
                      icon: const Icon(Icons.share, color: Colors.white),
                      onPressed: () {
                        Share.share('Check out this amazing room on Takevolet! ${room!['title']} for ₹${room!['rent']}/month at ${room!['location']}.');
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
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(child: Text(room!['title'] ?? 'Premium Room', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold))),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Theme.of(context).colorScheme.primary.withOpacity(0.5)),
                            ),
                            child: Column(children: [
                              Text('₹${room!['rent']}', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w900, fontSize: 28)),
                              const Text('/month', style: TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold)),
                            ]),
                          )
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(children: [
                        const Icon(Icons.location_on, color: Colors.grey, size: 16),
                        const SizedBox(width: 4),
                        Text('${room!['colony'] ?? ''}, ${room!['location'] ?? ''}', style: const TextStyle(color: Colors.grey, fontSize: 16)),
                      ]),
                      const Divider(height: 32),
                      const Text('Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 12, runSpacing: 12,
                        children: [
                          _buildOverviewChip(Icons.wc, room!['gender_preference'] ?? 'Any'),
                          _buildOverviewChip(Icons.chair, room!['furnishing'] ?? 'Furnished'),
                          _buildOverviewChip(Icons.people, '${room!['members_allowed'] ?? 1} Max'),
                          if (room!['parking'] != null && room!['parking'] != 'None')
                            _buildOverviewChip(Icons.local_parking, room!['parking']),
                        ],
                      ),
                      const SizedBox(height: 24),
                      const Text('Description', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Text(room!['description'] ?? 'No description provided.', style: const TextStyle(color: Colors.grey, height: 1.5)),
                    ],
                  ),
                ),

                // CONTACT UNLOCKED CARD
                if (_hasUnlocked) _buildContactUnlockedCard()
                else _buildPosterInfoCard(),

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
