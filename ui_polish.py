import re

def update_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. build_detail_screen.dart
build_detail_repl = [
    (
        r"builder: \(ctx\) => AlertDialog\(",
        "builder: (ctx) => AlertDialog(\n            backgroundColor: Colors.white,\n            surfaceTintColor: Colors.transparent,\n            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),\n            elevation: 8,"
    ),
    (
        r"// Trigger Push Notification",
        "// Trigger Push Notification and In-App Notification\n      try {\n        await _supabase.from('notifications').insert({\n          'profile_id': widget.listing['user_id'],\n          'title': 'New Booking Request 🎉',\n          'body': 'Someone just booked your listing: ${widget.listing['title'] ?? 'Service'}',\n          'type': 'booking',\n        });\n      } catch (e) {\n        debugPrint('Failed to insert in-app notification: $e');\n      }\n"
    )
]
update_file("takevolet app/lib/screens/build/build_detail_screen.dart", build_detail_repl)

# 2. build_category_screen.dart & build_hub_screen.dart
# Replace Color(0xFFFFF9E6) with Colors.white and add a subtle border color.
build_hub_repl = [
    (
        r"color: const Color\(0xFFFFF9E6\)",
        "color: Colors.white"
    )
]
update_file("takevolet app/lib/screens/build/build_category_screen.dart", build_hub_repl)
update_file("takevolet app/lib/screens/build/build_hub_screen.dart", build_hub_repl)

# 3. flatmate_detail_screen.dart & room_detail_screen.dart
# Replace Colors.amber.shade50 with Colors.white and plan['color'].withOpacity(0.05) with Colors.white
room_repl = [
    (
        r"color: isVisitor \? \(isSelected \? Colors\.amber\.shade50 : Colors\.white\) : \(isSelected \? plan\['color'\]\.withOpacity\(0\.05\) : Colors\.white\),",
        "color: Colors.white,"
    )
]
update_file("takevolet app/lib/screens/flatmates/flatmate_detail_screen.dart", room_repl)
update_file("takevolet app/lib/screens/rooms/room_detail_screen.dart", room_repl)

print("Phase 1 and 2 updates completed")
