import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../main.dart';
import '../../utils/image_utils.dart';
import '../../utils/share_utils.dart';
import '../../widgets/full_screen_image_viewer.dart';

class FlatmateDetailScreen extends StatefulWidget {
  final String id;
  const FlatmateDetailScreen({super.key, required this.id});

  @override
  State<FlatmateDetailScreen> createState() => _FlatmateDetailScreenState();
}

class _FlatmateDetailScreenState extends State<FlatmateDetailScreen> {
  Map<String, dynamic>? flatmate;
  Map<String, dynamic>? posterProfile;
  bool isLoading = true;
  bool _hasUnlocked = false;
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
    _fetchFlatmate();
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
        await supabase.from('flatmate_contact_unlocks').insert({
          'flatmate_id': widget.id,
          'user_id': userId,
        });

        if (_pendingUnlocks > 1) {
          final remainder = _pendingUnlocks - 1;
          await supabase
              .from('profiles')
              .update({'contact_balance': _contactBalance + remainder})
              .eq('id', userId);
          if (mounted) setState(() => _contactBalance += remainder);
        }
      } catch (e) {}
    }

    try {
      await supabase.functions.invoke(
        'verify-razorpay-payment',
        body: {
          'order_id': response.orderId,
          'payment_id': response.paymentId,
          'signature': response.signature,
          'flatmate_id': widget.id,
          'user_id': userId,
        },
      );
    } catch (_) {}

    if (context.mounted) {
      try {
        Navigator.pop(context);
      } catch (_) {}
    }

    await _fetchPosterProfile();
    setState(() => _hasUnlocked = true);

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Contact Unlocked Successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Payment Failed: ${response.message}'),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('External Wallet: ${response.walletName}')),
    );
  }

  Future<void> _fetchFlatmate() async {
    try {
      final res = await supabase
          .from('flatmates')
          .select()
          .eq('id', widget.id)
          .single();
      setState(() => flatmate = res);

      final userId = supabase.auth.currentUser?.id;
      if (userId != null) {
        final unlocks = await supabase
            .from('flatmate_contact_unlocks')
            .select()
            .eq('flatmate_id', widget.id)
            .eq('user_id', userId);
        if (unlocks != null && (unlocks as List).isNotEmpty) {
          setState(() => _hasUnlocked = true);
        }
      }

      await _fetchPosterProfile();
      setState(() => isLoading = false);
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  Future<void> _fetchPosterProfile() async {
    if (flatmate == null) return;
    try {
      final profile = await supabase
          .from('profiles')
          .select('full_name, phone, whatsapp, avatar_url, profession, email')
          .eq('id', flatmate!['user_id'])
          .single();
      setState(() => posterProfile = profile);
    } catch (_) {}
  }
  Future<void> _purchasePlan(int amount, String desc, {int unlocks = 1}) async {
    _pendingAmount = amount;
    _pendingUnlocks = unlocks;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    try {
      String? planId;
      if (desc != 'Visitor Pass' && desc != 'Premium Visitor Pass') {
        if (amount == 50)
          planId = 'single';
        else if (amount == 100)
          planId = 'starter';
        else if (amount == 200)
          planId = 'growth';
        else if (amount >= 500)
          planId = 'unlimited';
        else
          planId = 'single';
      }

      final Map<String, dynamic> bodyPayload = {
        'amount': amount * 100,
        'flatmateId': widget.id,
      };
      if (planId != null) {
        bodyPayload['planId'] = planId;
      }

      String keyId = 'rzp_live_SqU0ZW4NCgp5jo';
      String? orderId;

      try {
        final response = await supabase.functions.invoke(
          'create-razorpay-order',
          body: bodyPayload,
        );
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
          'email': supabase.auth.currentUser?.email ?? 'user@takevolet.com',
        },
      };

      if (orderId != null) {
        options['order_id'] = orderId;
      }

      _razorpay.open(options);
    } catch (e) {
      if (context.mounted) {
        try {
          Navigator.pop(context);
        } catch (_) {}
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text(
              'Payment Error 🚨',
              style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
            ),
            content: Text(
              'Could not start payment:\n\n$e',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              )
            ],
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
          content: Text(
            'You have $_contactBalance contacts remaining.\nUse 1 to unlock this contact?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                try {
                  await supabase.from('flatmate_contact_unlocks').insert({
                    'flatmate_id': widget.id,
                    'user_id': supabase.auth.currentUser!.id,
                  });
                  await supabase
                      .from('profiles')
                      .update({'contact_balance': _contactBalance - 1})
                      .eq('id', supabase.auth.currentUser!.id);
                  setState(() {
                    _contactBalance--;
                    _hasUnlocked = true;
                  });
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('✅ Contact Unlocked!'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Failed: $e'),
                        backgroundColor: Colors.red,
                      ),
                    );
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

    final String location = (flatmate?['location'] ?? '').toLowerCase();
    final String city = (flatmate?['city'] ?? '').toLowerCase();
    // Contact plans only
    final List<Map<String, dynamic>> plans = [
      {
        'title': 'Single Contact',
        'subtitle': '1 Contact',
        'price': 50,
        'color': Colors.blue,
        'unlocks': 1,
      },
      {
        'title': 'Quick Connect',
        'subtitle': '5 Contacts',
        'price': 100,
        'color': Colors.orange,
        'unlocks': 5,
      },
      {
        'title': 'Smart Connect',
        'subtitle': '15 Contacts',
        'price': 200,
        'color': Colors.purple,
        'isBestValue': true,
        'unlocks': 15,
      },
      {
        'title': 'Mega Connect',
        'subtitle': '50 Contacts',
        'price': 500,
        'color': Colors.green,
        'unlocks': 50,
      },
    ];

    Map<String, dynamic>? selectedPlan = plans[2]; // Default to Smart Connect (15 Contacts - ₹200)

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
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Unlock Contact',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const Text(
                    'Choose a plan to contact the flatmate',
                    style: TextStyle(color: Colors.grey),
                  ),
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
                                color: isSelected
                                    ? plan['color']
                                    : (plan['isBestValue'] == true
                                          ? plan['color'].withOpacity(0.5)
                                          : Colors.grey[200]!),
                                width: isSelected ? 2 : 1,
                              ),
                              boxShadow: [
                                if (isSelected)
                                  BoxShadow(
                                    color: plan['color'].withOpacity(0.2),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                              ],
                            ),
                            child: Stack(
                              children: [
                                if (plan['isBestValue'] == true)
                                  Positioned(
                                    top: 0,
                                    right: 12,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 3,
                                      ),
                                      decoration: BoxDecoration(
                                        color: plan['color'],
                                        borderRadius:
                                            const BorderRadius.vertical(
                                              bottom: Radius.circular(6),
                                            ),
                                      ),
                                      child: const Text(
                                        'BEST VALUE',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 9,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ),
                                if (isSelected)
                                  Positioned(
                                    top: 16,
                                    right: 16,
                                    child: Icon(
                                      Icons.check_circle,
                                      color: plan['color'],
                                      size: 24,
                                    ),
                                  ),
                                ListTile(
                                  contentPadding: const EdgeInsets.all(16),
                                  leading: CircleAvatar(
                                    backgroundColor: plan['color'].withOpacity(
                                      0.1,
                                    ),
                                    child: Icon(
                                      Icons.bolt,
                                      color: plan['color'],
                                    ),
                                  ),
                                  title: Text(
                                    plan['title'],
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  subtitle: Text(
                                    plan['subtitle'],
                                    style: const TextStyle(color: Colors.grey),
                                  ),
                                  trailing: isSelected
                                      ? null
                                      : Text(
                                          '₹${plan['price']}',
                                          style: TextStyle(
                                            fontWeight: FontWeight.bold,
                                            fontSize: 16,
                                            color: plan['color'],
                                          ),
                                        ),
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
                      onPressed: selectedPlan != null
                          ? () {
                              Navigator.pop(context); // close modal first
                              _purchasePlan(
                                selectedPlan!['price'],
                                selectedPlan!['title'],
                                unlocks: selectedPlan!['unlocks'] ?? 1,
                              );
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: selectedPlan != null
                            ? Theme.of(context).colorScheme.primary
                            : Colors.grey,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
                      child: Text(
                        selectedPlan != null
                            ? 'Proceed to Pay ₹${selectedPlan!['price']}'
                            : 'Select a Plan',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
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
    final name = posterProfile?['full_name'] ?? 'Flatmate';

    // Check if there is an admin custom contact override
    final String? customContact = flatmate?['custom_contact']?.toString();
    final bool hasCustomContact =
        customContact != null && customContact.trim().isNotEmpty;

    final phone = hasCustomContact
        ? customContact
        : (posterProfile?['phone'] ?? '');
    final whatsapp = hasCustomContact
        ? customContact
        : (posterProfile?['whatsapp'] ?? phone);

    final profession = posterProfile?['profession'] ?? '';
    final avatar = posterProfile?['avatar_url'];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.green.shade50,
            Colors.green.shade100.withOpacity(0.5),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.green.shade300),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withOpacity(0.15),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.green.shade400,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.check_circle,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Contact Unlocked ✅',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: Colors.green,
                      ),
                    ),
                    Text(
                      'You can now contact them',
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: const Color(0xFF7B3AEC).withOpacity(0.2),
                      backgroundImage: avatar != null
                          ? NetworkImage(avatar)
                          : null,
                      child: avatar == null
                          ? Text(
                              name.isNotEmpty ? name[0].toUpperCase() : 'F',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 22,
                                color: Color(0xFF7B3AEC),
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            name,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 17,
                            ),
                          ),
                          if (profession.isNotEmpty)
                            Text(
                              profession,
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 13,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
                if (phone.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.phone, color: Colors.green[600], size: 18),
                        const SizedBox(width: 10),
                        Text(
                          phone,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 16,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: phone.isNotEmpty
                      ? () => launchUrl(Uri.parse('tel:$phone'))
                      : null,
                  icon: const Icon(Icons.call, size: 18),
                  label: const Text(
                    'Call Now',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green[600],
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: whatsapp.isNotEmpty
                      ? () => launchUrl(
                          Uri.parse(
                            'https://wa.me/${whatsapp.replaceAll(RegExp(r'[^\d]'), '')}',
                          ),
                        )
                      : null,
                  icon: const Icon(Icons.message, size: 18),
                  label: const Text(
                    'WhatsApp',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPosterInfoCard() {
    final name = (posterProfile?['full_name'] ?? '').toString().trim();
    final displayName = name.isNotEmpty ? name : 'Takevolet Partner';
    final profession = 'Takevolet Partner';
    final avatar = posterProfile?['avatar_url'];
    final int rentShare = flatmate!['rent_share'] ?? 0;
    final String location = (flatmate!['location'] ?? '').toLowerCase();
    final String city = (flatmate!['city'] ?? '').toLowerCase();
    final bool isTier1City = city.contains('bangalore') || city.contains('bengaluru') ||
                             city.contains('pune') || city.contains('mumbai') ||
                             city.contains('delhi') || city.contains('chennai');

    // Show only visiting charges on button (not total)
    int visitingCharges = 0;
    int platformFee = 0;
    if (isTier1City) {
      if (rentShare <= 20000) {
        visitingCharges = 600;
        platformFee = 2400;
      } else {
        visitingCharges = 1000;
        platformFee = 4000;
      }
    } else {
      if (rentShare <= 20000) {
        visitingCharges = 300;
        platformFee = 1200;
      } else {
        visitingCharges = 500;
        platformFee = 2000;
      }
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'POSTED BY',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: const Color(0xFF7B3AEC).withOpacity(0.2),
                backgroundImage: avatar != null
                    ? CachedNetworkImageProvider(avatar)
                    : null,
                child: avatar == null
                    ? Text(
                        displayName.isNotEmpty
                            ? displayName[0].toUpperCase()
                            : 'T',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 24,
                          color: Color(0xFF7B3AEC),
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      displayName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                    Text(
                      profession,
                      style: const TextStyle(
                        color: Color(0xFF7B3AEC),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Row(
                      children: [
                        Icon(Icons.star, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star, color: Color(0xFF7B3AEC), size: 16),
                        Icon(Icons.star, color: Color(0xFF7B3AEC), size: 16),
                        SizedBox(width: 4),
                        Text(
                          'Verified',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF7B3AEC),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
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
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'PHONE NUMBER',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF94A3B8),
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _formatPartiallyRevealedPhone(
                          flatmate?['custom_contact']?.toString() ??
                          posterProfile?['phone']?.toString() ??
                          flatmate?['contact_phone']?.toString() ??
                          flatmate?['phone']?.toString()
                        ),
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF7B3AEC),
                          letterSpacing: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Trust Badges Row
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildTrustMiniBadge(Icons.shield_outlined, '100% Genuine'),
              const SizedBox(width: 12),
              _buildTrustMiniBadge(Icons.bolt_rounded, 'Direct Contact'),
              const SizedBox(width: 12),
              _buildTrustMiniBadge(Icons.lock_clock_rounded, 'Instant Unlock'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTrustMiniBadge(IconData icon, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: const Color(0xFF16A34A)),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Color(0xFF334155),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading)
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (flatmate == null)
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Flatmate not found')),
      );

    final images = ImageUtils.parseImages(flatmate!['images']);
    final metadata = flatmate!['metadata'] ?? {};
    if (images.isEmpty) {
      final imgStr = flatmate!['image'] as String?;
      if (imgStr != null && imgStr.isNotEmpty)
        images.add(imgStr);
      else
        images.add(
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
        );
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
                    onPageChanged: (i) =>
                        setState(() => _currentImageIndex = i),
                    itemCount: images.length,
                    itemBuilder: (context, index) {
                      return InkWell(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => FullScreenImageViewer(
                                imageUrls: images,
                                initialIndex: index,
                              ),
                            ),
                          );
                        },
                        child: CachedNetworkImage(
                          imageUrl: images[index],
                          fit: BoxFit.cover,
                          placeholder: (_, __) =>
                              Container(color: Colors.grey[200]),
                        ),
                      );
                    },
                  ),
                  if (images.length > 1) ...[
                    Positioned(
                      left: 10,
                      top: 0,
                      bottom: 0,
                      child: Center(
                        child: IconButton(
                          icon: const Icon(
                            Icons.arrow_back_ios,
                            color: Colors.white,
                            size: 28,
                          ),
                          onPressed: () => _pageController.previousPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      right: 10,
                      top: 0,
                      bottom: 0,
                      child: Center(
                        child: IconButton(
                          icon: const Icon(
                            Icons.arrow_forward_ios,
                            color: Colors.white,
                            size: 28,
                          ),
                          onPressed: () => _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 20,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          images.length,
                          (i) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: _currentImageIndex == i ? 12 : 8,
                            height: _currentImageIndex == i ? 12 : 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _currentImageIndex == i
                                  ? Theme.of(context).colorScheme.primary
                                  : Colors.white.withOpacity(0.5),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                  Positioned(
                    top: 40,
                    right: 10,
                    child: IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: const BoxDecoration(
                          color: Colors.black45,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.share,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      onPressed: () {
                        ShareUtils.generateFlatmateShare(context, flatmate!);
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
                              'FLATMATE WANTED',
                              style: TextStyle(
                                color: Color(0xFF7B3AEC),
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
                        flatmate!['title'] ?? 'Flatmate Required',
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
                                '${flatmate!['colony'] ?? flatmate!['location'] ?? ''}'.replaceAll(RegExp(r'^,\s*'), '').isNotEmpty
                                    ? '${flatmate!['colony'] ?? flatmate!['location'] ?? ''}'.replaceAll(RegExp(r'^,\s*'), '')
                                    : 'Location verified with flatmate',
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
                                          'MONTHLY SHARE',
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
                                          '₹${_formatNumber(flatmate!['rent_share'])}',
                                          style: GoogleFonts.outfit(
                                            fontSize: 30,
                                            fontWeight: FontWeight.w900,
                                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                                            letterSpacing: -0.5,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          '/ share',
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

                      // Box-Oriented Overview & Highlights Card
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
                                child: const Icon(Icons.group_rounded, color: Color(0xFF6D28D9), size: 18),
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
                                _buildOverviewBox(
                                  Icons.wc_rounded,
                                  'Preference',
                                  metadata['gender_pref']?.toString() ??
                                      flatmate!['gender_pref']?.toString() ??
                                      'Any',
                                ),
                                _buildOverviewBox(
                                  Icons.group_rounded,
                                  'Vacancy',
                                  '${metadata['vacancy_count']?.toString() ?? flatmate!['vacancy_count']?.toString() ?? 1} Vacancy',
                                ),
                                _buildOverviewBox(Icons.home_work_rounded, 'Space Type', 'Shared Flat'),
                                if (metadata['occupancy_type'] != null)
                                  _buildOverviewBox(Icons.person_outline_rounded, 'Occupancy', metadata['occupancy_type'].toString()),
                                if (metadata['furnishing'] != null)
                                  _buildOverviewBox(Icons.chair_rounded, 'Furnishing', metadata['furnishing'].toString()),
                              ],
                            ),
                          ],
                        ),
                      ),

                      // Box-Oriented Additional Details Card
                      if (metadata.keys.any((k) => !['gender_pref', 'vacancy_count', 'lifestyle_habits', 'occupancy_type', 'furnishing'].contains(k))) ...[
                        Container(
                          margin: const EdgeInsets.only(top: 16),
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
                                  child: const Icon(Icons.tune_rounded, color: Color(0xFF6D28D9), size: 18),
                                ),
                                const SizedBox(width: 10),
                                const Text(
                                  'Additional Details',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                                ),
                              ]),
                              const SizedBox(height: 14),
                              Wrap(
                                spacing: 10,
                                runSpacing: 10,
                                children: metadata.entries
                                    .where((e) => !['gender_pref', 'vacancy_count', 'lifestyle_habits', 'occupancy_type', 'furnishing'].contains(e.key))
                                    .where((e) => e.value != null && e.value.toString().trim().isNotEmpty)
                                    .map((e) {
                                      final keyName = e.key.replaceAll('_', ' ').split(' ').map((s) => s.isNotEmpty ? '${s[0].toUpperCase()}${s.substring(1)}' : '').join(' ');
                                      return _buildOverviewBox(Icons.info_outline_rounded, keyName, e.value.toString());
                                    })
                                    .toList(),
                              ),
                            ],
                          ),
                        ),
                      ],

                      // Box-Oriented Property Description Card (Bold, High Contrast, Rich UI)
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
                                'Flatmate & Room Description',
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
                                (flatmate!['description'] != null && flatmate!['description'].toString().trim().isNotEmpty)
                                    ? flatmate!['description'].toString().trim()
                                    : 'Looking for a compatible flatmate to share the space. All amenities are readily available and verified.',
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
                      if ((metadata['lifestyle_habits'] ??
                                  flatmate!['lifestyle_habits']) !=
                              null &&
                          ((metadata['lifestyle_habits'] ??
                                      flatmate!['lifestyle_habits'])
                                  as List)
                              .isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Text(
                          'Lifestyle',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children:
                              ((metadata['lifestyle_habits'] ??
                                          flatmate!['lifestyle_habits'])
                                      as List)
                                  .map(
                                    (h) => Chip(
                                      label: Text(
                                        h.toString(),
                                        style: const TextStyle(fontSize: 12),
                                      ),
                                      backgroundColor: Colors.grey[100],
                                    ),
                                  )
                                  .toList(),
                        ),
                      ],
                    ],
                  ),
                ),
                if (_hasUnlocked)
                  _buildContactUnlockedCard()
                else
                  _buildPosterInfoCard(),
                const SizedBox(height: 120),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF0F172A).withOpacity(0.08),
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

  Widget _buildBottomActionButtons() {
    if (_hasUnlocked) {
      final phone = posterProfile?['phone'] ?? flatmate?['phone'] ?? '';
      final whatsapp = posterProfile?['whatsapp'] ?? flatmate?['whatsapp'] ?? phone;
      return Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: phone.toString().isNotEmpty ? () => launchUrl(Uri.parse('tel:$phone')) : null,
              icon: const Icon(Icons.call_rounded, size: 18),
              label: const Text('Call Flatmate', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton.icon(
              onPressed: whatsapp.toString().isNotEmpty
                  ? () => launchUrl(Uri.parse('https://wa.me/${whatsapp.toString().replaceAll(RegExp(r'[^\d]'), '')}'))
                  : null,
              icon: const Icon(Icons.chat_bubble_rounded, size: 18),
              label: const Text('WhatsApp', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF25D366),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
            ),
          ),
        ],
      );
    } else {
      return Container(
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
        child: ElevatedButton(
          onPressed: _showUnlockDialog,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            padding: const EdgeInsets.symmetric(horizontal: 20),
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
                child: const Icon(Icons.lock_open_rounded, color: Colors.white, size: 18),
              ),
              const SizedBox(width: 10),
              Text(
                'Unlock Flatmate Details',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  'DIRECT ACCESS',
                  style: GoogleFonts.outfit(
                    fontSize: 9,
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

  String _formatPartiallyRevealedPhone(String? rawPhone) {
    if (rawPhone == null || rawPhone.trim().isEmpty) return '+91 98•• ••••••';
    final digits = rawPhone.replaceAll(RegExp(r'\D'), '');
    if (digits.length >= 10) {
      final p = digits.length == 12 && digits.startsWith('91') ? digits.substring(2) : digits;
      if (p.length >= 4) return '+91 ${p.substring(0, 4)} •• ••••';
    } else if (digits.length >= 4) {
      return '+91 ${digits.substring(0, 4)} •• ••••';
    }
    return '+91 98•• ••••••';
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
          Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
