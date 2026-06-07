import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class PaymentService {
  static final _supabase = Supabase.instance.client;

  static Future<bool> initiateUnlockPayment({
    required BuildContext context,
    required String roomId,
    required String posterId,
    required String roomTitle,
  }) async {
    bool isSuccess = false;
    final razorpay = Razorpay();

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      // 1. Call Edge Function to create order
      final user = _supabase.auth.currentUser;
      final response = await _supabase.functions.invoke(
        'create-razorpay-order',
        body: {'amount': 50000, 'receipt': 'receipt_$roomId'}, // 50000 paise = 500 INR
      );

      final data = response.data;
      if (data == null || data['id'] == null) {
        throw Exception('Failed to create order');
      }

      final orderId = data['id'];

      // Hide loading dialog
      if (context.mounted) Navigator.of(context).pop();

      // 2. Setup Razorpay handlers
      razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (PaymentSuccessResponse paymentResponse) async {
        // 3. Verify Payment with Edge Function
        try {
          await _supabase.functions.invoke(
            'verify-razorpay-payment',
            body: {
              'order_id': paymentResponse.orderId,
              'payment_id': paymentResponse.paymentId,
              'signature': paymentResponse.signature,
              'room_id': roomId,
              'seeker_id': user?.id,
              'poster_id': posterId,
              'room_title': roomTitle,
            },
          );
          isSuccess = true;
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Successful! Address unlocked.')));
          }
        } catch (e) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Verification Failed: $e')));
          }
        }
      });

      razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (PaymentFailureResponse response) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Failed: ${response.message}')));
        }
      });

      // 4. Launch Razorpay UI
      var options = {
        'key': data['keyId'] ?? 'rzp_test_placeholder',
        'amount': 50000,
        'name': 'Takevolet',
        'description': 'Unlock Room Contact',
        'order_id': orderId,
        'prefill': {
          'contact': user?.phone ?? '',
          'email': user?.email ?? '',
        }
      };
      razorpay.open(options);

      // Wait a reasonable amount of time for the user to complete payment
      // In a real app, you would handle state changes rather than awaiting a Future here.
      await Future.delayed(const Duration(minutes: 5)); 

    } catch (e) {
      if (context.mounted) {
        Navigator.of(context).pop(); // remove dialog
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      razorpay.clear(); // Removes all listeners
    }

    return isSuccess;
  }
}
