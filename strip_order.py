import re

def strip_order(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace .order('created_at', ascending: false)
    content = content.replace(".order('created_at', ascending: false)", "")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

strip_order('takevolet app/lib/screens/profile/user_dashboard_screen.dart')
strip_order('takevolet app/lib/screens/profile/client_dashboard_screen.dart')
