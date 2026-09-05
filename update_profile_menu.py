import re

with open("takevolet app/lib/screens/profile/profile_dashboard_screen.dart", "r", encoding="utf-8") as f:
    c = f.read()

# Fix the Client Panel and User Panel menu items
old_menu = """            _buildMenuItem(Icons.account_balance_wallet, 'Earnings & Wallet', Colors.green, () => context.push('/earnings')),
            _buildMenuItem(Icons.list_alt, 'My Listings', Colors.blue, () => context.push('/user-dashboard')),
            _buildMenuItem(Icons.lock_open, 'Unlock History', Colors.purple, () => context.push('/unlock-history')),"""

new_menu = """            _buildMenuItem(Icons.account_balance_wallet, 'Earnings & Wallet', Colors.green, () => context.push('/earnings')),
            _buildMenuItem(Icons.dashboard_customize, 'Client Panel (My Listings)', Colors.blue, () => context.push('/user-dashboard')),
            _buildMenuItem(Icons.person, 'User Panel (Wishlist & Bookings)', Colors.indigo, () => context.push('/user-dashboard')), // TODO: Link to proper user panel
            _buildMenuItem(Icons.lock_open, 'Unlock History', Colors.purple, () => context.push('/unlock-history')),"""

c = c.replace(old_menu, new_menu)

with open("takevolet app/lib/screens/profile/profile_dashboard_screen.dart", "w", encoding="utf-8") as f:
    f.write(c)

print("Updated profile_dashboard_screen.dart with Client and User Panels")
