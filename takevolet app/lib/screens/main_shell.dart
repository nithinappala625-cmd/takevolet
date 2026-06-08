import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:supabase_flutter/supabase_flutter.dart';

class MainShell extends StatelessWidget {
  final Widget child;

  const MainShell({super.key, required this.child});

  Future<void> _handlePostNavigation(BuildContext context, String route) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      context.push('/login');
      return;
    }

    try {
      final profile = await Supabase.instance.client
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();
      
      final isComplete = (profile['full_name'] ?? '').toString().isNotEmpty && 
                         (profile['phone'] ?? '').toString().isNotEmpty;
                         
      if (!isComplete && context.mounted) {
        context.push('/profile-complete');
      } else if (context.mounted) {
        context.push(route);
      }
    } catch (_) {
      if (context.mounted) context.push('/profile-complete');
    }
  }

  void _showPostMenu(BuildContext parentContext) {
    showModalBottomSheet(
      context: parentContext,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'What would you like to post?',
                style: Theme.of(sheetContext).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              ListTile(
                leading: CircleAvatar(
                  backgroundColor: Theme.of(sheetContext).colorScheme.primary.withOpacity(0.1),
                  child: Icon(Icons.home_work, color: Theme.of(sheetContext).colorScheme.primary),
                ),
                title: const Text('Post a Room'),
                subtitle: const Text('Find tenants for your property'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  _handlePostNavigation(parentContext, '/add-room');
                },
              ),
              ListTile(
                leading: CircleAvatar(
                  backgroundColor: Theme.of(sheetContext).colorScheme.primary.withOpacity(0.1),
                  child: Icon(Icons.people, color: Theme.of(sheetContext).colorScheme.primary),
                ),
                title: const Text('Find a Flatmate'),
                subtitle: const Text('Share your current apartment'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  _handlePostNavigation(parentContext, '/add-flatmate');
                },
              ),
              ListTile(
                leading: CircleAvatar(
                  backgroundColor: Theme.of(sheetContext).colorScheme.primary.withOpacity(0.1),
                  child: Icon(Icons.shopping_bag, color: Theme.of(sheetContext).colorScheme.primary),
                ),
                title: const Text('Sell an Item'),
                subtitle: const Text('Furniture, electronics, etc.'),
                onTap: () {
                  Navigator.pop(sheetContext);
                  _handlePostNavigation(parentContext, '/add-item');
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  int _calculateSelectedIndex(BuildContext context) {
    final String location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/home')) return 0;
    if (location.startsWith('/rooms')) return 1;
    if (location.startsWith('/flatmates')) return 2;
    if (location.startsWith('/marketplace')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/home');
        break;
      case 1:
        context.go('/rooms');
        break;
      case 2:
        context.go('/flatmates');
        break;
      case 3:
        context.go('/marketplace');
        break;
      case 4:
        context.go('/profile');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentIndex = _calculateSelectedIndex(context);

    return Scaffold(
      body: child,
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showPostMenu(context),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.add, size: 32),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) => _onItemTapped(index, context),
        backgroundColor: Colors.white,
        elevation: 10,
        indicatorColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.bed_outlined), selectedIcon: Icon(Icons.bed), label: 'Rooms'),
          NavigationDestination(icon: Icon(Icons.people_outline), selectedIcon: Icon(Icons.people), label: 'Flatmates'),
          NavigationDestination(icon: Icon(Icons.storefront_outlined), selectedIcon: Icon(Icons.storefront), label: 'Market'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
