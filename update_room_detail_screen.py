import re

with open("takevolet app/lib/screens/rooms/room_detail_screen.dart", "r", encoding="utf-8") as f:
    c = f.read()

# 1. Replace Plans Array
plans_regex = re.compile(
    r"final List<Map<String, dynamic>> plans = \[\s*\{'title': 'Single Contact'.*?\s*\];",
    re.DOTALL
)

new_plans = """final List<Map<String, dynamic>> plans = [
        {'title': 'Single Contact', 'subtitle': '1 Room', 'price': 200, 'color': Colors.blue, 'unlocks': 1},
        {'title': 'Quick Connect', 'subtitle': '3 Rooms', 'price': 500, 'color': Colors.orange, 'unlocks': 3},
        {'title': 'Smart Connect', 'subtitle': '5 Rooms', 'price': 800, 'color': Colors.purple, 'isBestValue': true, 'unlocks': 5},
        {'title': 'Power Connect', 'subtitle': '10 Rooms', 'price': 1200, 'color': Colors.green, 'unlocks': 10},
        {'title': 'Premium Connect', 'subtitle': '15 Rooms', 'price': 2000, 'color': Colors.red, 'unlocks': 15},
      ];"""

c = plans_regex.sub(new_plans, c)

# 2. Add "no brokers involved" note
note_regex = re.compile(r"const Text\('Choose a plan to contact the owner directly', style: TextStyle\(color: Colors\.grey\)\),")
new_note = """const Text('Note: no brokers involved', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Choose a plan to contact the owner directly', style: TextStyle(color: Colors.grey)),"""

c = note_regex.sub(new_note, c)

# 3. Replace Bottom Navigation Bar else block
bottom_nav_regex = re.compile(
    r"\} else \{\s*final String location =.*?return Row\(\s*children: \[\s*Expanded\(\s*child: ElevatedButton\.icon\(\s*onPressed: \(\) => _purchasePlan\(visitingCharges, 'Visitor Pass'\).*?\]\s*,\s*\);\s*\}",
    re.DOTALL
)

new_bottom_nav = """} else {
      return Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _contactBalance > 0 ? _showUnlockDialog : _showUnlockSheet,
              icon: const Icon(Icons.lock_open, size: 20),
              label: const Text('Unlock Owner Details', textAlign: TextAlign.center, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFD4AF37),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      );
    }"""

c = bottom_nav_regex.sub(new_bottom_nav, c)

with open("takevolet app/lib/screens/rooms/room_detail_screen.dart", "w", encoding="utf-8") as f:
    f.write(c)

print("Updated room_detail_screen.dart")
