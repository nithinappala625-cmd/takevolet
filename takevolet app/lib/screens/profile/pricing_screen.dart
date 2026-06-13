import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
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
  bool _isBangalorePricing = false;

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

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Successful! Plan Upgraded.'), backgroundColor: Colors.green));
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Failed: ${response.message}'), backgroundColor: Colors.red));
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('External Wallet: ${response.walletName}')));
  }

  Future<void> _purchasePlan(int priceInRupees, String planName) async {
    showDialog(context: context, barrierDismissible: false, builder: (_) => const Center(child: CircularProgressIndicator()));
    try {
      final response = await supabase.functions.invoke(
        'create-razorpay-order',
        body: {'amount': priceInRupees * 100, 'receipt': 'receipt_plan_$priceInRupees'},
      );
      if (context.mounted) Navigator.pop(context);

      final data = response.data;
      if (data == null || data['id'] == null) {
        final errorDetail = data?['error'] ?? 'No data returned';
        throw Exception('Supabase failed to create order.\n\nError: $errorDetail\n\nDid you add RAZORPAY_KEY_ID to Supabase secrets and deploy the function?');
      }

      var options = {
        'key': data['keyId'] ?? 'rzp_test_Sq0dFrEKuO85Mh',
        'amount': priceInRupees * 100,
        'name': 'Takevolet',
        'description': planName,
        'order_id': data['id'],
        'prefill': {
          'email': supabase.auth.currentUser?.email ?? 'test@test.com'
        }
      };
      _razorpay.open(options);
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context);
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Payment Error 🚨', style: TextStyle(color: Colors.red)),
            content: Text('There was an error:\n\n$e\n\nPlease ensure Edge Functions are deployed.'),
            actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK'))],
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Premium Plans')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text('Choose Your Plan', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
          const SizedBox(height: 8),
          const Text('Unlock contacts seamlessly and save big compared to individual unlocks.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 16),
          Center(
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GestureDetector(
                    onTap: () => setState(() { _isBangalorePricing = false; selectedPriceValue = null; }),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      decoration: BoxDecoration(
                        color: !_isBangalorePricing ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: !_isBangalorePricing ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)] : [],
                      ),
                      child: Text('Hyderabad', style: TextStyle(fontWeight: !_isBangalorePricing ? FontWeight.bold : FontWeight.normal, color: !_isBangalorePricing ? Colors.black : Colors.grey)),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => setState(() { _isBangalorePricing = true; selectedPriceValue = null; }),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      decoration: BoxDecoration(
                        color: _isBangalorePricing ? Colors.white : Colors.transparent,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: _isBangalorePricing ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)] : [],
                      ),
                      child: Text('Bangalore', style: TextStyle(fontWeight: _isBangalorePricing ? FontWeight.bold : FontWeight.normal, color: _isBangalorePricing ? Colors.black : Colors.grey)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          _buildPricingCard(
            context,
            title: 'Single Contact',
            price: _isBangalorePricing ? '₹30' : '₹15',
            description: 'Get 1 Contact Unlock',
            isPopular: false,
            priceValue: _isBangalorePricing ? 30 : 15,
          ),
          const SizedBox(height: 16),
          _buildPricingCard(
            context,
            title: 'Starter Pack',
            price: _isBangalorePricing ? '₹110' : '₹55',
            description: _isBangalorePricing ? 'Get 10 Contact Unlocks (₹11.00 each)' : 'Get 10 Contact Unlocks (₹5.50 each)',
            isPopular: false,
            priceValue: _isBangalorePricing ? 110 : 55,
          ),
          const SizedBox(height: 16),
          _buildPricingCard(
            context,
            title: 'Growth Pack',
            price: _isBangalorePricing ? '₹210' : '₹105',
            description: _isBangalorePricing ? 'Get 50 Contact Unlocks (₹4.20 each)' : 'Get 50 Contact Unlocks (₹2.10 each)',
            isPopular: true,
            priceValue: _isBangalorePricing ? 210 : 105,
          ),
          const SizedBox(height: 16),
          _buildPricingCard(
            context,
            title: 'Unlimited',
            price: _isBangalorePricing ? '₹400' : '₹200',
            description: 'Unlimited Unlocks',
            isPopular: false,
            priceValue: _isBangalorePricing ? 400 : 200,
          ),
          const SizedBox(height: 100),
        ],
      ),
      bottomSheet: selectedPriceValue != null
          ? Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
              ),
              child: SafeArea(
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _purchasePlan(selectedPriceValue!, selectedPlanName!),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text('Pay ₹$selectedPriceValue Now'),
                  ),
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildPricingCard(BuildContext context, {required String title, required String price, required String description, required bool isPopular, required int priceValue}) {
    final isSelected = selectedPriceValue == priceValue;
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedPriceValue = priceValue;
          selectedPlanName = title;
        });
      },
      child: Card(
        elevation: isSelected ? 8 : 2,
        color: isSelected ? Theme.of(context).colorScheme.primary.withOpacity(0.05) : Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: isSelected ? BorderSide(color: Theme.of(context).colorScheme.primary, width: 2) : BorderSide.none,
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              if (isPopular)
                Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(color: Theme.of(context).colorScheme.primary, borderRadius: BorderRadius.circular(20)),
                  child: const Text('MOST POPULAR', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(price, style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary)),
              const SizedBox(height: 16),
              Text(description, style: const TextStyle(color: Colors.grey)),
            ],
          ),
        ),
      ),
    );
  }
}
