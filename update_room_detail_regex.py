import re

with open("takevolet app/lib/screens/rooms/room_detail_screen.dart", "r", encoding="utf-8") as f:
    c = f.read()

# Replace the pricing plans in _showUnlockSheet
new_plans_str = """      final List<Map<String, dynamic>> plans = [
        {'title': 'Single Contact', 'subtitle': '1 Room', 'price': 200, 'color': Colors.blue, 'unlocks': 1},
        {'title': 'Starter Pack', 'subtitle': '3 Rooms', 'price': 500, 'color': Colors.orange, 'unlocks': 3},
        {'title': 'Growth Pack', 'subtitle': '5 Rooms', 'price': 800, 'color': Colors.purple, 'isBestValue': true, 'unlocks': 5},
        {'title': 'Pro Pack', 'subtitle': '10 Rooms', 'price': 1200, 'color': Colors.green, 'unlocks': 10},
        {'title': 'Premium Pack', 'subtitle': '15 Rooms', 'price': 2000, 'color': Colors.red, 'unlocks': 15},
      ];"""

# Regex to find the plans declaration and replace it entirely
pattern = r"final List<Map<String, dynamic>> plans = isBangalore \? \[.*?\] : \[.*?\];"
c = re.sub(pattern, new_plans_str, c, flags=re.DOTALL)

with open("takevolet app/lib/screens/rooms/room_detail_screen.dart", "w", encoding="utf-8") as f:
    f.write(c)

print("Updated plans array using regex!")
