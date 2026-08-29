import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:flutter/material.dart';

class PaymentService {
  late Razorpay _razorpay;
  final Function(PaymentSuccessResponse) onSuccess;
  final Function(PaymentFailureResponse) onFailure;
  final Function(ExternalWalletResponse) onExternalWallet;

  // IMPORTANT: For production, do NOT hardcode the key secret.
  // The Key ID can be hardcoded or fetched from an environment variable.
  static const String keyId = 'rzp_live_SqU0ZW4NCgp5jo'; // LIVE Razorpay Key ID

  PaymentService({
    required this.onSuccess,
    required this.onFailure,
    required this.onExternalWallet,
  }) {
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, onSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, onFailure);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, onExternalWallet);
  }

  static Future<void> startRazorpayCheckout({
    required double amount,
    required String phoneNumber,
    required String email,
    required Function(PaymentSuccessResponse) onSuccess,
    required Function(String) onError,
  }) async {
    final razorpay = Razorpay();
    
    razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse response) {
      razorpay.clear();
      onSuccess(response);
    });
    
    razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse response) {
      razorpay.clear();
      onError(response.message ?? 'Payment failed or cancelled.');
    });
    
    razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (ExternalWalletResponse response) {
      razorpay.clear();
      onError('External Wallet Selected: ${response.walletName}');
    });

    var options = {
      'key': keyId,
      'amount': (amount * 100).toInt(),
      'name': 'Takevolet App',
      'description': 'Payment',
      'prefill': {
        'contact': phoneNumber,
        'email': email,
      },
      'theme': {
        'color': '#D4AF37'
      }
    };

    try {
      razorpay.open(options);
    } catch (e) {
      razorpay.clear();
      onError('Error opening Razorpay: $e');
    }
  }

  void openCheckout({
    required double amountInRupees, 
    required String name, 
    required String description, 
    required String contact, 
    required String email,
  }) {
    var options = {
      'key': keyId,
      'amount': (amountInRupees * 100).toInt(), // Razorpay expects amount in paise
      'name': 'Takevolet Top Projects',
      'description': description,
      'prefill': {
        'contact': contact,
        'email': email,
      },
      'theme': {
        'color': '#D4AF37' // Gold color to match the app
      }
    };

    try {
      _razorpay.open(options);
    } catch (e) {
      debugPrint('Error opening razorpay: $e');
    }
  }

  void dispose() {
    _razorpay.clear();
  }
}
