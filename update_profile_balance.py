import re

with open("takevolet app/lib/screens/profile/profile_dashboard_screen.dart", "r", encoding="utf-8") as f:
    c = f.read()

# Replace totalUnlocks in Stats Grid with contactBalance
old_stat_grid = """              Row(children: [
                Expanded(child: _buildStatCard('₹$totalEarnings', 'Earnings', Icons.account_balance_wallet, Colors.green)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('$totalListings', 'Listings', Icons.home_work, Colors.blue)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('$totalUnlocks', 'Unlocks', Icons.lock_open, Colors.purple)),
              ]),"""

new_stat_grid = """              Row(children: [
                Expanded(child: _buildStatCard('₹$totalEarnings', 'Earnings', Icons.account_balance_wallet, Colors.green)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('$totalListings', 'Listings', Icons.home_work, Colors.blue)),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard('${profile?['contact_balance'] ?? 0}', 'Balance', Icons.contacts, Colors.orange)),
              ]),"""

c = c.replace(old_stat_grid, new_stat_grid)

with open("takevolet app/lib/screens/profile/profile_dashboard_screen.dart", "w", encoding="utf-8") as f:
    f.write(c)

print("Updated profile_dashboard_screen.dart")
