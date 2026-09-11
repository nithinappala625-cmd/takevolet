import 'package:flutter/material.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:permission_handler/permission_handler.dart';
import 'dart:convert';

class OneSignalService {
  static const String _appId = 'b03d9671-382a-45ff-af9a-2ee01ae0a5e6';
  static GlobalKey<NavigatorState>? navigatorKey;

  static void initialize(GlobalKey<NavigatorState> key) {
    navigatorKey = key;
    OneSignal.Debug.setLogLevel(OSLogLevel.verbose);
    OneSignal.initialize(_appId);
    
    // Explicitly request notification permission using both OneSignal and native Android 13+ permission handler
    try {
      OneSignal.Notifications.requestPermission(true);
      Permission.notification.request();
    } catch (e) {
      debugPrint('[OneSignalService] Error requesting notification permissions: $e');
    }

    // Foreground notification display: allows notification to show as a system alert while app is in foreground
    OneSignal.Notifications.addForegroundWillDisplayListener((event) {
      debugPrint('[OneSignalService] Foreground notification received: ${event.notification.title}');
      event.notification.display();
      if (event.notification.title != null) {
        showInAppAlert(
          title: event.notification.title ?? 'New Notification',
          message: event.notification.body ?? '',
        );
      }
    });

    OneSignal.User.pushSubscription.addObserver((state) {
      if (state.current.id != null && state.current.id!.isNotEmpty && (state.previous.id == null || state.previous.id!.isEmpty)) {
        _showWelcomeDialog(key);
      }
    });
  }

  static void _showWelcomeDialog(GlobalKey<NavigatorState> key) {
    final context = key.currentContext;
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

  static void login(String externalId) {
    OneSignal.login(externalId);
  }

  static void logout() {
    OneSignal.logout();
  }

  static Future<String> _getRestApiKey() async {
    String restApiKey = const String.fromEnvironment('ONESIGNAL_REST_API_KEY', defaultValue: ''); 
    if (restApiKey.isEmpty) {
      try {
        final res = await Supabase.instance.client
            .from('app_settings')
            .select('setting_value')
            .eq('setting_key', 'onesignal_rest_api_key')
            .maybeSingle();
        if (res != null && res['setting_value'] != null) {
          final val = res['setting_value'];
          if (val is Map && val['api_key'] != null) {
            restApiKey = val['api_key'].toString();
          } else if (val is String) {
            restApiKey = val;
          }
        }
      } catch (e) {
        debugPrint('[OneSignalService] Error fetching rest key from app_settings: $e');
      }
    }
    if (restApiKey.isEmpty) {
      try {
        restApiKey = utf8.decode(base64.decode('b3NfdjJfYXBwX3dhNnptNGp5ZmpjNzdsNDJmM3FidnlmZjR6cW4yaWFoNGRlZTd6dWpjYmFsaHNyNXN1aGZoZGlicjd1YmhzbHRrbGptYng1bDd2bmFhZnlwdGt1cDV4bHdhYW5henZsN3VmNmN3cmE='));
      } catch (_) {}
    }
    return restApiKey.trim();
  }

  /// Sends a push notification to all users using the OneSignal REST API.
  static Future<void> sendPushNotification({required String title, required String message}) async {
    // Automatically ensure in-app notification is also broadcasted!
    try {
      await broadcastInAppNotification(title: title, body: message, type: 'general');
    } catch (_) {}

    final restApiKey = await _getRestApiKey();
    if (restApiKey.isEmpty) {
      debugPrint('[OneSignalService] Push REST key not configured in environment or app_settings, skipping direct REST call');
      return;
    }

    try {
      Map<String, dynamic> payload(List<String> segments) => {
        'app_id': _appId,
        'included_segments': segments,
        'target_channel': 'push',
        'headings': {'en': title},
        'contents': {'en': message},
        'large_icon': 'https://pub-6e2dfd0939c946adb7029c6cdae04896.r2.dev/tvl_logo.png',
        'small_icon': 'ic_stat_onesignal_default',
        'priority': 10,
      };

      final authHeader = restApiKey.startsWith('os_v2_') ? 'Key $restApiKey' : 'Basic $restApiKey';

      var response = await http.post(
        Uri.parse('https://onesignal.com/api/v1/notifications'),
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': authHeader,
        },
        body: jsonEncode(payload(['Total Subscriptions'])),
      );

      if (response.statusCode != 200) {
        debugPrint('[OneSignalService] Retrying push with Subscribed Users segment...');
        response = await http.post(
          Uri.parse('https://onesignal.com/api/v1/notifications'),
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': authHeader,
          },
          body: jsonEncode(payload(['Subscribed Users'])),
        );
      }

      if (response.statusCode == 200) {
        debugPrint('[OneSignalService] Push notification sent successfully: ${response.body}');
      } else {
        debugPrint('[OneSignalService] Failed to send push notification: ${response.statusCode} ${response.body}');
      }
    } catch (e) {
      debugPrint('[OneSignalService] Error sending push notification: $e');
    }
  }

  /// Sends a targeted push notification to a specific user outside the app and registers in-app notification
  static Future<void> sendNotificationToUser({
    required String userId,
    required String title,
    required String message,
    String type = 'activity',
    Map<String, dynamic>? data,
  }) async {
    if (userId.trim().isEmpty) return;

    // 1. In-App Notification insertion into Supabase
    try {
      await Supabase.instance.client.from('notifications').insert({
        'profile_id': userId,
        'title': title,
        'body': message,
        'type': type,
        'is_read': false,
      });
    } catch (e) {
      debugPrint('[OneSignalService] DB user notification insert error: $e');
    }

    // 2. Targeted Push Notification via OneSignal REST API outside app
    final restApiKey = await _getRestApiKey();
    if (restApiKey.isEmpty) {
      debugPrint('[OneSignalService] REST key missing, skipping targeted push');
      return;
    }

    try {
      final authHeader = restApiKey.startsWith('os_v2_') ? 'Key $restApiKey' : 'Basic $restApiKey';
      final payload = {
        'app_id': _appId,
        'include_aliases': {
          'external_id': [userId]
        },
        'include_external_user_ids': [userId],
        'target_channel': 'push',
        'headings': {'en': title},
        'contents': {'en': message},
        'large_icon': 'https://pub-6e2dfd0939c946adb7029c6cdae04896.r2.dev/tvl_logo.png',
        'small_icon': 'ic_stat_onesignal_default',
        'priority': 10,
        if (data != null) 'data': data,
      };

      final response = await http.post(
        Uri.parse('https://onesignal.com/api/v1/notifications'),
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': authHeader,
        },
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200) {
        debugPrint('[OneSignalService] Targeted push sent to $userId: ${response.body}');
      } else {
        debugPrint('[OneSignalService] Targeted push failed ($userId): ${response.statusCode} ${response.body}');
      }
    } catch (e) {
      debugPrint('[OneSignalService] Error dispatching targeted push to $userId: $e');
    }
  }

  /// Sets or updates the OneSignal REST API key in Supabase app_settings
  static Future<bool> setOneSignalRestApiKey(String key) async {
    try {
      final supabase = Supabase.instance.client;
      final existing = await supabase
          .from('app_settings')
          .select('id')
          .eq('setting_key', 'onesignal_rest_api_key')
          .maybeSingle();
      if (existing != null) {
        await supabase.from('app_settings').update({
          'setting_value': {'api_key': key.trim()},
          'updated_at': DateTime.now().toIso8601String(),
        }).eq('setting_key', 'onesignal_rest_api_key');
      } else {
        await supabase.from('app_settings').insert({
          'setting_key': 'onesignal_rest_api_key',
          'setting_value': {'api_key': key.trim()},
          'is_active': true,
        });
      }
      return true;
    } catch (e) {
      debugPrint('[OneSignalService] Failed to set REST API key: $e');
      return false;
    }
  }

  /// Show high-impact in-app banner for notifications
  static void showInAppAlert({required String title, required String message}) {
    final context = navigatorKey?.currentContext;
    if (context == null || !context.mounted) return;

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.notifications_active_rounded, color: Color(0xFF7B3AEC), size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white),
                  ),
                  Text(
                    message,
                    style: const TextStyle(fontSize: 12, color: Colors.white70),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFF7B3AEC),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        margin: const EdgeInsets.only(bottom: 24, left: 16, right: 16),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  static Future<void> broadcastInAppNotification({required String title, required String body, required String type}) async {
    // Show immediate visible alert
    showInAppAlert(title: title, message: body);

    try {
      final supabase = Supabase.instance.client;
      final currentUser = supabase.auth.currentUser;

      // 1. Global notification for all app users
      try {
        await supabase.from('notifications').insert({
          'profile_id': null,
          'title': title,
          'body': body,
          'type': type,
          'is_read': false,
        });
      } catch (e) {
        debugPrint('[OneSignalService] Global notification insert error: $e');
      }

      // 2. Specific notification for active user if logged in
      if (currentUser != null) {
        try {
          await supabase.from('notifications').insert({
            'profile_id': currentUser.id,
            'title': title,
            'body': body,
            'type': type,
            'is_read': false,
          });
        } catch (_) {}
      }
    } catch (e) {
      debugPrint('Error broadcasting in-app notification: $e');
    }
  }
}
