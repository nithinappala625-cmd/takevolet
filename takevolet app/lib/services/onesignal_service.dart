import 'package:flutter/material.dart';
import 'package:onesignal_flutter/onesignal_flutter.dart';

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
}
