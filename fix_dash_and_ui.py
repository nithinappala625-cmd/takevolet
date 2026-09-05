import re

def update_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. user_dashboard_screen.dart - Remove _adminClient and use _supabase with correct catchError
user_dash_replacements = [
    (
        r"final SupabaseClient _adminClient = SupabaseClient\([\s\S]*?\);",
        ""
    ),
    (
        r"_adminClient\.from",
        "_supabase.from"
    ),
    (
        r"List<dynamic> buildBookings = \[\];\n\s*try \{\n\s*buildBookings = await _supabase.from\('bookings'\).select\('\*, build_listings\(\*\)'\).eq\('user_id', userId\).order\('created_at', ascending: false\);\n\s*\} catch \(e\) \{\n\s*debugPrint\('Error fetching user bookings: \$e'\);\n\s*\}",
        "final buildBookings = await _supabase.from('bookings').select('*, build_listings(*)').eq('user_id', userId).order('created_at', ascending: false).catchError((e) { debugPrint('Bookings error: $e'); return <Map<String, dynamic>>[]; });"
    ),
    (
        r"final rooms = await _supabase\.from\('rooms'\)\.select\(\)\.eq\('user_id', userId\)\.order\('created_at', ascending: false\);",
        "final rooms = await _supabase.from('rooms').select().eq('user_id', userId).order('created_at', ascending: false).catchError((e) => <Map<String, dynamic>>[]);"
    ),
    (
        r"final flatmates = await _supabase\.from\('flatmates'\)\.select\(\)\.eq\('user_id', userId\)\.order\('created_at', ascending: false\);",
        "final flatmates = await _supabase.from('flatmates').select().eq('user_id', userId).order('created_at', ascending: false).catchError((e) => <Map<String, dynamic>>[]);"
    ),
    (
        r"final items = await _supabase\.from\('items'\)\.select\(\)\.eq\('user_id', userId\)\.order\('created_at', ascending: false\);",
        "final items = await _supabase.from('items').select().eq('user_id', userId).order('created_at', ascending: false).catchError((e) => <Map<String, dynamic>>[]);"
    ),
    (
        r"final flats = await _supabase\.from\('property_sales'\)\.select\(\)\.eq\('user_id', userId\)\.order\('created_at', ascending: false\);",
        "final flats = await _supabase.from('property_sales').select().eq('user_id', userId).order('created_at', ascending: false).catchError((e) => <Map<String, dynamic>>[]);"
    ),
    (
        r"final buildListings = await _supabase\.from\('build_listings'\)\.select\(\)\.eq\('user_id', userId\)\.order\('created_at', ascending: false\);",
        "final buildListings = await _supabase.from('build_listings').select().eq('user_id', userId).order('created_at', ascending: false).catchError((e) => <Map<String, dynamic>>[]);"
    )
]
update_file("takevolet app/lib/screens/profile/user_dashboard_screen.dart", user_dash_replacements)

# 2. client_dashboard_screen.dart - Fix the catchError return types
client_dash_replacements = [
    (
        r"\.catchError\(\(e\) => \[\]\)",
        ".catchError((e) { debugPrint('Dashboard fetch error: $e'); return <Map<String, dynamic>>[]; })"
    )
]
update_file("takevolet app/lib/screens/profile/client_dashboard_screen.dart", client_dash_replacements)

# 3. splash_screen.dart - Change background to Blue and ensure logo path
splash_replacements = [
    (
        r"gradient: LinearGradient\(\s*colors: \[Color\(0xFFFFFDF5\), Color\(0xFFFFF8DC\), Color\(0xFFFFFFFF\)\],\s*begin: Alignment\.topCenter,\s*end: Alignment\.bottomCenter,\s*\)",
        "color: const Color(0xFF0F172A)" # Slate 900 Blue
    ),
    (
        r"color: Color\(0xFFD4AF37\),\s*letterSpacing: 2\.5,",
        "color: Colors.white,\n                          letterSpacing: 2.5,"
    ),
    (
        r"color: Colors\.grey\[500\]",
        "color: Colors.grey[300]"
    )
]
update_file("takevolet app/lib/screens/splash_screen.dart", splash_replacements)

# 4. login_screen.dart - Change background to Blue and adjust text colors
login_replacements = [
    (
        r"backgroundColor: Colors\.white,",
        "backgroundColor: const Color(0xFF0F172A),"
    ),
    (
        r"TextSpan\(text: 'Take', style: TextStyle\(color: Colors\.black87, fontSize: 36, fontWeight: FontWeight\.w900\)\)",
        "TextSpan(text: 'Take', style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900))"
    ),
    (
        r"color: Colors\.black87, height: 1\.2",
        "color: Colors.white, height: 1.2"
    ),
    (
        r"color: Colors\.grey\.shade600",
        "color: Colors.grey.shade400"
    ),
    (
        r"color: Colors\.black87\), textAlign: TextAlign\.center",
        "color: Colors.white), textAlign: TextAlign.center"
    ),
    (
        r"color: Colors\.white,\n\s*borderRadius: BorderRadius\.circular\(12\),\n\s*border: Border\.all\(color: Colors\.grey\.shade200\),",
        "color: const Color(0xFF1E293B),\n        borderRadius: BorderRadius.circular(12),\n        border: Border.all(color: const Color(0xFF334155)),"
    ),
    (
        r"color: Colors\.white,\n\s*boxShadow: \[\n\s*BoxShadow\(color: Colors\.black\.withOpacity\(0\.02\)",
        "color: const Color(0xFF0F172A),\n                    boxShadow: [\n                      BoxShadow(color: Colors.black.withOpacity(0.2)"
    ),
    (
        r"color: Colors\.grey\.shade500",
        "color: Colors.grey.shade400"
    ),
    (
        r"style: const TextStyle\(fontSize: 10, fontWeight: FontWeight\.bold, color: Colors\.black87\)",
        "style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)"
    )
]
update_file("takevolet app/lib/screens/auth/login_screen.dart", login_replacements)
