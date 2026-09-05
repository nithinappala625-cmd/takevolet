import re

with open("takevolet app/lib/screens/rooms/room_detail_screen.dart", "r", encoding="utf-8") as f:
    c = f.read()

# Fix the method declarations
old_code = """  void _showUnlockDialog() {
    if (_contactBalance <= 0) {
      _showUnlockSheet();
      return;
    }
    if (_contactBalance > 0) {"""

new_code = """  void _showUnlockDialog() {"""

c = c.replace(old_code, new_code)

# Now we have void _showUnlockDialog() { showDialog(...) }
# Wait, let's see how the return; was structured
old_code2 = """      );
      return;
    }

    final String location = (room!['location'] ?? '').toLowerCase();"""

new_code2 = """      );
  }

  void _showUnlockSheet() {
    final String location = (room!['location'] ?? '').toLowerCase();"""

c = c.replace(old_code2, new_code2)

with open("takevolet app/lib/screens/rooms/room_detail_screen.dart", "w", encoding="utf-8") as f:
    f.write(c)

print("Fixed room_detail_screen.dart")
