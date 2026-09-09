import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:ui';
import '../../main.dart';

class PricingScreen extends StatefulWidget {
  const PricingScreen({super.key});

  @override
  State<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends State<PricingScreen> {
  late Razorpay _razorpay;
  int? selectedPriceValue;
  String? selectedPlanName;
  int _pendingUnlocks = 1;

  final List<Map<String, dynamic>> plans = [
    {'title': 'Single Contact', 'subtitle': '1 Room', 'price': 50, 'color': const Color(0xFF3B82F6), 'unlocks': 1, 'icon': Icons.person},
    {'title': 'Quick Connect', 'subtitle': '5 Rooms', 'price': 100, 'color': const Color(0xFFF59E0B), 'unlocks': 5, 'icon': Icons.flash_on},
    {'title': 'Smart Connect', 'subtitle': '15 Rooms', 'price': 200, 'color': const Color(0xFF8B5CF6), 'isBestValue': true, 'unlocks': 15, 'icon': Icons.lightbulb},
    {'title': 'Mega Connect', 'subtitle': '50 Rooms', 'price': 500, 'color': const Color(0xFF10B981), 'unlocks': 50, 'icon': Icons.all_inclusive},
  ];

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  Future<void> _handlePaymentSuccess(PaymentSuccessResponse response) async {
    int unlocksToAdd = _pendingUnlocks;

    if (unlocksToAdd > 0) {
      try {
        final userId = supabase.auth.currentUser!.id;
        final res = await supabase.from('profiles').select('contact_balance').eq('id', userId).single();
        final currentBalance = res['contact_balance'] ?? 0;
        await supabase.from('profiles').update({'contact_balance': currentBalance + unlocksToAdd}).eq('id', userId);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Successful! $unlocksToAdd Contacts Unlocked.', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)), backgroundColor: Colors.green));
          setState(() {
            selectedPriceValue = null;
            selectedPlanName = null;
          });
        }
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment succeeded, but failed to update balance: $e'), backgroundColor: Colors.red));
      }
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Failed: ${response.message}'), backgroundColor: Colors.red));
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('External Wallet: ${response.walletName}')));
  }

  Future<void> _purchasePlan(int priceInRupees, String planName, int unlocks) async {
    setState(() => _pendingUnlocks = unlocks);
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator(color: Colors.white)));
    try {
      String keyId = 'rzp_live_SqU0ZW4NCgp5jo';
      String? orderId;

      try {
        final response = await supabase.functions.invoke(
          'create-razorpay-order',
          body: {'amount': priceInRupees * 100, 'receipt': 'receipt_plan_$priceInRupees'},
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
        'amount': priceInRupees * 100,
        'name': 'Takevolet Premium',
        'description': planName,
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
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error starting payment: $e'), backgroundColor: Colors.red));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: Text('Premium Plans', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // Background accents
          Positioned(
            top: -100, left: -100,
            child: Container(
              width: 300, height: 300,
              decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFFD4AF37).withOpacity(0.15)),
            ),
          ),
          Positioned(
            bottom: -50, right: -50,
            child: Container(
              width: 250, height: 250,
              decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFF3B82F6).withOpacity(0.15)),
            ),
          ),
          SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 10),
                Text('Unlock Direct Contacts', style: GoogleFonts.inter(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900)),
                const SizedBox(height: 8),
                Text('Note: No brokers involved', style: GoogleFonts.inter(color: const Color(0xFFFF5252), fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 1.1)),
                const SizedBox(height: 20),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    itemCount: plans.length,
                    itemBuilder: (context, index) {
                      final plan = plans[index];
                      final isBestValue = plan['isBestValue'] ?? false;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 20),
                        child: Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B).withOpacity(0.8),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: isBestValue ? const Color(0xFFD4AF37) : const Color(0xFF334155), width: isBestValue ? 2 : 1),
                                boxShadow: [
                                  if (isBestValue) BoxShadow(color: const Color(0xFFD4AF37).withOpacity(0.2), blurRadius: 15, spreadRadius: 2)
                                ],
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(20),
                                child: BackdropFilter(
                                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                                  child: Padding(
                                    padding: const EdgeInsets.all(20),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(14),
                                          decoration: BoxDecoration(color: plan['color'].withOpacity(0.2), shape: BoxShape.circle),
                                          child: Icon(plan['icon'], color: plan['color'], size: 28),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(plan['title'], style: GoogleFonts.inter(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                                              const SizedBox(height: 4),
                                              Text(plan['subtitle'], style: GoogleFonts.inter(color: Colors.grey.shade400, fontSize: 14)),
                                            ],
                                          ),
                                        ),
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.end,
                                          children: [
                                            Text('₹${plan['price']}', style: GoogleFonts.inter(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
                                            const SizedBox(height: 8),
                                            ElevatedButton(
                                              onPressed: () => _purchasePlan(plan['price'], plan['title'], plan['unlocks']),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: isBestValue ? const Color(0xFFD4AF37) : const Color(0xFF334155),
                                                foregroundColor: isBestValue ? Colors.black : Colors.white,
                                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                                elevation: isBestValue ? 4 : 0,
                                              ),
                                              child: const Text('Get Plan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            if (isBestValue)
                              Positioned(
                                top: -12,
                                right: 24,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(colors: [Color(0xFFD4AF37), Color(0xFFFBBF24)]),
                                    borderRadius: BorderRadius.circular(20),
                                    boxShadow: [BoxShadow(color: const Color(0xFFD4AF37).withOpacity(0.4), blurRadius: 8)],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.star, color: Colors.black87, size: 14),
                                      const SizedBox(width: 4),
                                      Text('MOST POPULAR', style: GoogleFonts.inter(color: Colors.black87, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
