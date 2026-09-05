import os

with open("takevolet app/lib/main.dart", "r", encoding="utf-8") as f:
    router_code = f.read()

import_code = """import 'screens/profile/client_dashboard_screen.dart';
import 'screens/profile/user_bookings_screen.dart';
import 'screens/profile/wishlist_screen.dart';
"""
if "client_dashboard_screen.dart" not in router_code:
    router_code = router_code.replace("import 'package:go_router/go_router.dart';", "import 'package:go_router/go_router.dart';\n" + import_code)

routes_code = """    GoRoute(path: '/client-dashboard', builder: (context, state) => const ClientDashboardScreen()),
    GoRoute(path: '/my-bookings', builder: (context, state) => const UserBookingsScreen()),
    GoRoute(path: '/my-wishlist', builder: (context, state) => const WishlistScreen()),
"""
if "/client-dashboard" not in router_code:
    router_code = router_code.replace("GoRoute(path: '/login',", routes_code + "    GoRoute(path: '/login',")

with open("takevolet app/lib/main.dart", "w", encoding="utf-8") as f:
    f.write(router_code)

print("Updated main.dart routes")
