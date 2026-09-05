import os

files = [
    'takevolet app/lib/screens/profile/user_dashboard_screen.dart',
    'takevolet app/lib/screens/admin/admin_dashboard_screen.dart'
]

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        c = file.read()
    c = c.replace("from('build_bookings')", "from('bookings')")
    c = c.replace("'build_bookings'", "'bookings'")
    with open(f, 'w', encoding='utf-8') as file:
        file.write(c)

print("Updated table names")
