import re

with open("takevolet app/lib/screens/rooms/room_detail_screen.dart", "r", encoding="utf-8") as f:
    c = f.read()

# 1. Update plans and pricing array
old_plans = """    // Contact plans only
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
      ];"""

new_plans = """    final List<Map<String, dynamic>> plans = [
        {'title': 'Single Contact', 'subtitle': '1 Room', 'price': 200, 'color': Colors.blue, 'unlocks': 1},
        {'title': 'Starter Pack', 'subtitle': '3 Rooms', 'price': 500, 'color': Colors.orange, 'unlocks': 3},
        {'title': 'Growth Pack', 'subtitle': '5 Rooms', 'price': 800, 'color': Colors.purple, 'isBestValue': true, 'unlocks': 5},
        {'title': 'Pro Pack', 'subtitle': '10 Rooms', 'price': 1200, 'color': Colors.green, 'unlocks': 10},
        {'title': 'Premium Pack', 'subtitle': '15 Rooms', 'price': 2000, 'color': Colors.red, 'unlocks': 15},
      ];"""

c = c.replace(old_plans, new_plans)

# 2. Add `_pendingUnlocks` and fix `_handlePaymentSuccess`
c = c.replace("int _pendingAmount = 0;", "int _pendingAmount = 0;\n  int _pendingUnlocks = 1;")

old_handle = """  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
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
    }"""

new_handle = """  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    final userId = supabase.auth.currentUser?.id;
    if (userId != null) {
      try {
        // ALWAYS unlock the current room immediately
        await supabase.from('contact_unlocks').insert({'room_id': widget.id, 'user_id': userId});
        
        // If they bought more than 1 contact, add the remainder to their balance
        if (_pendingUnlocks > 1) {
          final remainder = _pendingUnlocks - 1;
          await supabase.from('profiles').update({'contact_balance': _contactBalance + remainder}).eq('id', userId);
          if (mounted) setState(() => _contactBalance += remainder);
        }

        // Notify the owner that their room contact was unlocked
        if (room != null && room!['user_id'] != null) {
          try {
             await OneSignalService.sendPushNotification(
               title: 'Contact Unlocked!',
               message: 'Someone just unlocked your contact details for: ${room!['title']}',
             );
          } catch (_) {}
        }
      } catch (e) {}
    }"""

c = c.replace(old_handle, new_handle)

# 3. Add transparency note
old_unlock_bottom = """                child: Column(
                  children: [
                    Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
                    const SizedBox(height: 20),
                    const Text('Unlock Contact', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    const Text('Choose a plan to contact the owner directly', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 20),"""

new_unlock_bottom = """                child: Column(
                  children: [
                    Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
                    const SizedBox(height: 20),
                    const Text('Unlock Contact', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    const Text('Choose a plan to contact the owner directly', style: TextStyle(color: Colors.grey)),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8)),
                      child: const Row(
                        children: [
                          Icon(Icons.info_outline, color: Colors.blue, size: 20),
                          SizedBox(width: 8),
                          Expanded(child: Text('Note: You will get direct owner contact and location. No brokers involved.', style: TextStyle(fontSize: 12, color: Colors.blue))),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),"""
c = c.replace(old_unlock_bottom, new_unlock_bottom)

# 4. Update _purchasePlan to accept unlocks
c = c.replace("Future<void> _purchasePlan(int amount, String desc) async {", "Future<void> _purchasePlan(int amount, String desc, {int unlocks = 1}) async {")
c = c.replace("_pendingAmount = amount;", "_pendingAmount = amount;\n    _pendingUnlocks = unlocks;")
c = c.replace("_purchasePlan(selectedPlan!['price'],", "_purchasePlan(selectedPlan!['price'], selectedPlan!['title'], unlocks: selectedPlan!['unlocks'] ?? 1); //")
c = c.replace("_purchasePlan(plans[0]['price'],", "_purchasePlan(plans[0]['price'], plans[0]['title'], unlocks: plans[0]['unlocks'] ?? 1); //")
c = c.replace("_purchasePlan(plans[1]['price'],", "_purchasePlan(plans[1]['price'], plans[1]['title'], unlocks: plans[1]['unlocks'] ?? 1); //")

# 5. Make sure _showUnlockDialog behaves correctly if they have balance, and we don't open bottom sheet
old_button = """            Expanded(
              child: ElevatedButton.icon(
                onPressed: _showUnlockDialog,
                icon: const Icon(Icons.lock_open, size: 18),"""
new_button = """            Expanded(
              child: ElevatedButton.icon(
                onPressed: _contactBalance > 0 ? _showUnlockDialog : _showUnlockSheet,
                icon: const Icon(Icons.lock_open, size: 18),"""
c = c.replace(old_button, new_button)
c = c.replace("void _showUnlockDialog() {", "void _showUnlockDialog() {\n    if (_contactBalance <= 0) {\n      _showUnlockSheet();\n      return;\n    }")

# 6. Import OneSignalService
if "import '../../services/onesignal_service.dart';" not in c:
    c = c.replace("import 'package:razorpay_flutter/razorpay_flutter.dart';", "import 'package:razorpay_flutter/razorpay_flutter.dart';\nimport '../../services/onesignal_service.dart';")

with open("takevolet app/lib/screens/rooms/room_detail_screen.dart", "w", encoding="utf-8") as f:
    f.write(c)

print("Updated room_detail_screen.dart")
