import re

def update_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. Update user_dashboard_screen.dart
user_dash_replacements = [
    (
        r"final buildBookings = await _adminClient\.from\('bookings'\)\.select\('\*, build_listings\(\*\)'\)\.eq\('user_id', userId\)\.order\('created_at', ascending: false\);",
        "List<dynamic> buildBookings = [];\n      try {\n        buildBookings = await _adminClient.from('bookings').select('*, build_listings(*)').eq('user_id', userId).order('created_at', ascending: false);\n      } catch (e) {\n        debugPrint('Error fetching user bookings: $e');\n      }"
    )
]
update_file("takevolet app/lib/screens/profile/user_dashboard_screen.dart", user_dash_replacements)

# 2. Update client_dashboard_screen.dart
client_dash_replacements = [
    (
        r"final futures = await Future\.wait\(\[([\s\S]*?)\]\);",
        "final futures = await Future.wait([\n        _supabase.from('rooms').select().eq('user_id', user.id).order('created_at', ascending: false).catchError((e) => []),\n        _supabase.from('flats').select().eq('user_id', user.id).order('created_at', ascending: false).catchError((e) => []),\n        _supabase.from('flatmates').select().eq('user_id', user.id).order('created_at', ascending: false).catchError((e) => []),\n        _supabase.from('build_listings').select().eq('user_id', user.id).order('created_at', ascending: false).catchError((e) => []),\n        _supabase.from('bookings').select().eq('provider_id', user.id).order('created_at', ascending: false).catchError((e) => []),\n      ]);"
    )
]
update_file("takevolet app/lib/screens/profile/client_dashboard_screen.dart", client_dash_replacements)
