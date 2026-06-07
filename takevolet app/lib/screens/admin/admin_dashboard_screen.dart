import 'package:flutter/material.dart';
import '../../main.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = supabase.auth.currentUser;
    if (user?.email != 'nithinpappala625@gmail.com') {
      return Scaffold(
        appBar: AppBar(title: const Text('Access Denied')),
        body: const Center(child: Text('You do not have admin privileges.')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Admin Panel')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text('Platform Statistics', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 24),
          _buildStatCard(context, 'Total Users', 'profiles'),
          _buildStatCard(context, 'Total Rooms', 'rooms'),
          _buildStatCard(context, 'Total Flatmates', 'flatmates'),
          _buildStatCard(context, 'Total Interests Unlocked', 'interests'),
        ],
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, String title, String table) {
    return FutureBuilder<int>(
      future: supabase.from(table).select('id').then((data) => (data as List).length),
      builder: (context, snapshot) {
        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          elevation: 4,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(24),
            leading: Icon(Icons.analytics, color: Theme.of(context).colorScheme.primary, size: 40),
            title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            trailing: snapshot.connectionState == ConnectionState.waiting
                ? const CircularProgressIndicator()
                : Text(
                    '${snapshot.data ?? 0}',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary),
                  ),
          ),
        );
      },
    );
  }
}
