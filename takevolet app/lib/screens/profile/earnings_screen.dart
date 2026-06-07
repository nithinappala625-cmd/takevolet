import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../main.dart';

class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});

  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  int _totalEarnings = 0;

  @override
  void initState() {
    super.initState();
    _fetchEarnings();
  }

  Future<void> _fetchEarnings() async {
    final user = supabase.auth.currentUser;
    if (user != null) {
      final res = await supabase.from('earnings').select('amount').eq('user_id', user.id);
      int total = 0;
      for (var row in res) {
        total += (row['amount'] as num).toInt();
      }
      if (mounted) setState(() => _totalEarnings = total);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Wallet & Earnings')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [Theme.of(context).colorScheme.primary, Colors.orangeAccent]),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: Column(
              children: [
                const Text('Available Balance', style: TextStyle(color: Colors.white, fontSize: 16)),
                const SizedBox(height: 8),
                Text('₹$_totalEarnings', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.account_balance, color: Colors.black),
                  label: const Text('Withdraw via UPI', style: TextStyle(color: Colors.black)),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.white),
                )
              ],
            ),
          ),
          const SizedBox(height: 32),
          const Text('Transaction History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          // Placeholder for actual transactions stream
          const ListTile(
            leading: Icon(Icons.check_circle, color: Colors.green),
            title: Text('No recent transactions'),
            subtitle: Text('Start posting rooms to earn rewards!'),
          )
        ],
      ),
    );
  }
}
