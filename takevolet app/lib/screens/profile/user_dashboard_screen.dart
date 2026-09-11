import 'package:flutter/material.dart';
import 'user_bookings_screen.dart';
import 'wishlist_screen.dart';

class UserDashboardScreen extends StatefulWidget {
  const UserDashboardScreen({super.key});

  @override
  State<UserDashboardScreen> createState() => _UserDashboardScreenState();
}

class _UserDashboardScreenState extends State<UserDashboardScreen> {
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('My User Panel', style: TextStyle(fontWeight: FontWeight.bold)),
          bottom: const TabBar(
            indicatorColor: Color(0xFF7B3AEC),
            labelColor: Color(0xFF7B3AEC),
            unselectedLabelColor: Colors.grey,
            tabs: [
              Tab(text: 'My Bookings'),
              Tab(text: 'My Wishlist'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            UserBookingsScreen(isTab: true),
            WishlistScreen(isTab: true),
          ],
        ),
      ),
    );
  }
}
