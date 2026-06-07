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
      if (data == null || data['id'] == null) throw Exception('Failed to create order');

      var options = {
        'key': data['keyId'] ?? 'rzp_test_placeholder',
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
      if (context.mounted) Navigator.pop(context);
      debugPrint('Razorpay Error: $e');
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
          const SizedBox(height: 32),
          _buildPricingCard(
            context,
            title: 'Single Contact',
            price: '₹15',
            description: 'Get 1 Contact Unlock',
            isPopular: false,
            priceValue: 15,
          ),
          const SizedBox(height: 16),
          _buildPricingCard(
            context,
            title: 'Starter Pack',
            price: '₹55',
            description: 'Get 10 Contact Unlocks (₹5.50 each)',
            isPopular: false,
            priceValue: 55,
          ),
          const SizedBox(height: 16),
          _buildPricingCard(
            context,
            title: 'Growth Pack',
            price: '₹105',
            description: 'Get 50 Contact Unlocks (₹2.10 each)',
            isPopular: true,
            priceValue: 105,
          ),
          const SizedBox(height: 16),
          _buildPricingCard(
            context,
            title: 'Unlimited',
            price: '₹200',
            description: 'Unlimited Unlocks',
            isPopular: false,
            priceValue: 200,
          ),
        ],
      ),
    );
  }

  Widget _buildPricingCard(BuildContext context, {required String title, required String price, required String description, required bool isPopular, required int priceValue}) {
    return Card(
      elevation: isPopular ? 8 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: isPopular ? BorderSide(color: Theme.of(context).colorScheme.primary, width: 2) : BorderSide.none,
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
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _purchasePlan(priceValue, title),
                style: ElevatedButton.styleFrom(
                  backgroundColor: isPopular ? Theme.of(context).colorScheme.primary : Colors.grey[200],
                  foregroundColor: isPopular ? Colors.white : Colors.black,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Purchase Plan'),
              ),
            )
          ],
        ),
      ),
    );
  }
}
