import 'package:flutter/material.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class OneSignalService {
  static const String _appId = 'b03d9671-382a-45ff-af9a-2ee01ae0a5e6';

  static void initialize(GlobalKey<NavigatorState> navigatorKey) {
    OneSignal.Debug.setLogLevel(OSLogLevel.verbose);
    OneSignal.initialize(_appId);
    
    // Request push permission
    OneSignal.Notifications.requestPermission(true);

    OneSignal.User.pushSubscription.addObserver((state) {
      if (state.current.id != null && state.current.id!.isNotEmpty && (state.previous.id == null || state.previous.id!.isEmpty)) {
        _showWelcomeDialog(navigatorKey);
      }
    });
  }

  static void _showWelcomeDialog(GlobalKey<NavigatorState> navigatorKey) {
    final context = navigatorKey.currentContext;
    if (context == null) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Your OneSignal integration is complete!'),
        content: const Text('Click the button below to trigger your first journey via an in-app message.'),
        actions: [
          ElevatedButton(
            onPressed: () {
              OneSignal.InAppMessages.addTrigger("ai_implementation_campaign_email_journey", "true");
              Navigator.pop(context);
            },
            child: const Text('Trigger your first journey'),
          )
        ],
      ),
    );
  }

  // Example of centralized methods for user identity, tags, etc.
  static void login(String externalId) {
    OneSignal.login(externalId);
  }

  static void logout() {
    OneSignal.logout();
  }

  /// Sends a push notification to all users using the OneSignal REST API.
  static Future<void> sendPushNotification({required String title, required String message}) async {
    const String restApiKey = String.fromEnvironment('ONESIGNAL_REST_API_KEY', defaultValue: ''); 
    if (restApiKey.isEmpty) {
      debugPrint('[OneSignalService] Push REST key not configured in environment, skipping direct REST call');
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('https://onesignal.com/api/v1/notifications'),
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': 'Basic $restApiKey',
        },
        body: jsonEncode({
          'app_id': _appId,
          'included_segments': ['Subscribed Users', 'Active Users', 'Total Subscriptions'],
          'target_channel': 'push',
          'headings': {'en': title},
          'contents': {'en': message},
          'large_icon': 'https://pub-6e2dfd0939c946adb7029c6cdae04896.r2.dev/tvl_logo.png',
          'small_icon': 'ic_stat_onesignal_default',
        }),
      );

      if (response.statusCode == 200) {
        debugPrint('Push notification sent successfully');
      } else {
        debugPrint('Failed to send push notification: ${response.body}');
      }
    } catch (e) {
      debugPrint('Error sending push notification: $e');
    }
  }

  static Future<void> broadcastInAppNotification({required String title, required String body, required String type}) async {
    try {
      final supabase = Supabase.instance.client;
      // Fetch all profiles to broadcast
      final response = await supabase.from('profiles').select('id').limit(1000);
      final List<dynamic> profiles = response;
      
      if (profiles.isNotEmpty) {
        final notifications = profiles.map((p) => {
          'profile_id': p['id'],
          'title': title,
          'body': body,
          'type': type,
        }).toList();
        
        await supabase.from('notifications').insert(notifications);
      }
    } catch (e) {
      debugPrint('Error broadcasting in-app notification: $e');
    }
  }
}
