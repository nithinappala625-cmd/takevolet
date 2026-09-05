import re

with open("takevolet app/lib/screens/profile/pricing_screen.dart", "r", encoding="utf-8") as f:
    c = f.read()

# 1. Update plans and logic in pricing_screen.dart
old_plans_str = """      final plans = isBangalore ? [
        {'title': 'Single Contact', 'subtitle': '1 Contact', 'price': 30, 'color': Colors.blue, 'icon': Icons.person},
        {'title': 'Starter Pack', 'subtitle': '5 Contacts', 'price': 65, 'color': Colors.orange, 'icon': Icons.group},
        {'title': 'Growth Pack', 'subtitle': '50 Contacts', 'price': 210, 'color': Colors.purple, 'icon': Icons.trending_up, 'isBestValue': true},
        {'title': 'Unlimited', 'subtitle': 'Unlimited Contacts', 'price': 400, 'color': Colors.red, 'icon': Icons.all_inclusive},
      ] : [
        {'title': 'Single Contact', 'subtitle': '1 Contact', 'price': 15, 'color': Colors.blue, 'icon': Icons.person},
        {'title': 'Starter Pack', 'subtitle': '5 Contacts', 'price': 35, 'color': Colors.orange, 'icon': Icons.group},
        {'title': 'Growth Pack', 'subtitle': '50 Contacts', 'price': 105, 'color': Colors.purple, 'icon': Icons.trending_up, 'isBestValue': true},
        {'title': 'Unlimited', 'subtitle': 'Unlimited Contacts', 'price': 200, 'color': Colors.red, 'icon': Icons.all_inclusive},
      ];"""

new_plans_str = """      final plans = [
        {'title': 'Single Contact', 'subtitle': '1 Room', 'price': 200, 'color': Colors.blue, 'icon': Icons.person, 'unlocks': 1},
        {'title': 'Starter Pack', 'subtitle': '3 Rooms', 'price': 500, 'color': Colors.orange, 'icon': Icons.group, 'unlocks': 3},
        {'title': 'Growth Pack', 'subtitle': '5 Rooms', 'price': 800, 'color': Colors.purple, 'icon': Icons.trending_up, 'isBestValue': true, 'unlocks': 5},
        {'title': 'Pro Pack', 'subtitle': '10 Rooms', 'price': 1200, 'color': Colors.green, 'icon': Icons.star, 'unlocks': 10},
        {'title': 'Premium Pack', 'subtitle': '15 Rooms', 'price': 2000, 'color': Colors.red, 'icon': Icons.diamond, 'unlocks': 15},
      ];"""
c = c.replace(old_plans_str, new_plans_str)

old_handle = """  Future<void> _handlePaymentSuccess(PaymentSuccessResponse response) async {
    int unlocksToAdd = 0;
    if (selectedPlanName == 'Single Contact') unlocksToAdd = 1;
    else if (selectedPlanName == 'Starter Pack') unlocksToAdd = 10;
    else if (selectedPlanName == 'Growth Pack') unlocksToAdd = 50;
    else if (selectedPlanName == 'Unlimited') unlocksToAdd = 9999;"""

new_handle = """  int _pendingUnlocks = 1;

  Future<void> _handlePaymentSuccess(PaymentSuccessResponse response) async {
    int unlocksToAdd = _pendingUnlocks;"""
c = c.replace(old_handle, new_handle)

old_purchase = """  Future<void> _purchasePlan(int amount, String planName) async {
    setState(() {
      selectedPriceValue = amount;
      selectedPlanName = planName;
    });"""
new_purchase = """  Future<void> _purchasePlan(int amount, String planName, int unlocks) async {
    setState(() {
      selectedPriceValue = amount;
      selectedPlanName = planName;
      _pendingUnlocks = unlocks;
    });"""
c = c.replace(old_purchase, new_purchase)

c = c.replace("onPressed: () => _purchasePlan(plan['price'], plan['title']),", "onPressed: () => _purchasePlan(plan['price'], plan['title'], plan['unlocks'] ?? 1),")

with open("takevolet app/lib/screens/profile/pricing_screen.dart", "w", encoding="utf-8") as f:
    f.write(c)

print("Updated pricing_screen.dart")
