import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';

class ClientDashboardScreen extends StatefulWidget {
  const ClientDashboardScreen({super.key});

  @override
  State<ClientDashboardScreen> createState() => _ClientDashboardScreenState();
}

class _ClientDashboardScreenState extends State<ClientDashboardScreen> with SingleTickerProviderStateMixin {
  final _supabase = Supabase.instance.client;
  late TabController _tabController;
  bool _isLoading = true;

  List<Map<String, dynamic>> _rooms = [];
  List<Map<String, dynamic>> _flats = [];
  List<Map<String, dynamic>> _flatmates = [];
  List<Map<String, dynamic>> _services = [];
  List<Map<String, dynamic>> _bookings = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _fetchAllData();
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchAllData() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return;

      final futures = await Future.wait([
        _supabase.from('rooms').select().eq('user_id', user.id).catchError((e) { debugPrint('Dashboard fetch error: $e'); return <Map<String, dynamic>>[]; }),
        _supabase.from('flats').select().eq('user_id', user.id).catchError((e) { debugPrint('Dashboard fetch error: $e'); return <Map<String, dynamic>>[]; }),
        _supabase.from('flatmates').select().eq('user_id', user.id).catchError((e) { debugPrint('Dashboard fetch error: $e'); return <Map<String, dynamic>>[]; }),
        _supabase.from('build_listings').select().eq('user_id', user.id).catchError((e) { debugPrint('Dashboard fetch error: $e'); return <Map<String, dynamic>>[]; }),
        _supabase.from('bookings').select().eq('provider_id', user.id).catchError((e) { debugPrint('Dashboard fetch error: $e'); return <Map<String, dynamic>>[]; }),
      ]);

      if (mounted) {
        setState(() {
          _rooms = List<Map<String, dynamic>>.from(futures[0]);
          _flats = List<Map<String, dynamic>>.from(futures[1]);
          _flatmates = List<Map<String, dynamic>>.from(futures[2]);
          _services = List<Map<String, dynamic>>.from(futures[3]);
          _bookings = List<Map<String, dynamic>>.from(futures[4]);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Widget _buildList(List<Map<String, dynamic>> items, String emptyMessage, String routePrefix) {
    if (items.isEmpty) return Center(child: Text(emptyMessage, style: const TextStyle(color: Colors.grey)));
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (ctx, i) {
        final item = items[i];
        final isService = routePrefix == '/build/detail';
        final imgUrl = item['image_url'] ?? item['photo_url'] ?? item['cover_photo_url'] ?? item['images']?.first;
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.all(12),
            leading: imgUrl != null && imgUrl.toString().isNotEmpty
                ? ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.network(imgUrl, width: 60, height: 60, fit: BoxFit.cover))
                : Container(width: 60, height: 60, decoration: BoxDecoration(color: Colors.grey.shade50, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.image, color: Colors.grey)),
            title: Text(item['title'] ?? item['business_name'] ?? 'Listing', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            subtitle: Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(
                isService 
                  ? 'Type: ${item['sub_category'] ?? 'Service'}\nLocation: ${item['location_name'] ?? ''}'
                  : '₹${item['rent'] ?? item['price'] ?? 0} | ${item['city'] ?? item['location_name'] ?? ''}',
                style: const TextStyle(fontSize: 13, color: Colors.black54),
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
            onTap: () {
               if (isService) {
                 context.push(routePrefix, extra: item);
               } else {
                 context.push('$routePrefix/${item['id']}');
               }
            },
          ),
        );
      },
    );
  }

  Widget _buildBookingsList() {
    if (_bookings.isEmpty) return const Center(child: Text('You have not received any bookings yet.', style: TextStyle(color: Colors.grey)));
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _bookings.length,
      itemBuilder: (ctx, i) {
        final b = _bookings[i];
        final data = b['booking_data'] as Map<String, dynamic>? ?? {};
        final name = data['full_name'] ?? 'Unknown Customer';
        final phone = data['phone_number'] ?? 'No Phone';
        final address = data['delivery_address'] ?? 'No Address';
        
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))],
          ),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: Colors.black87)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.green), borderRadius: BorderRadius.circular(6)),
                      child: Text(b['status'] ?? 'PENDING', style: const TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
                const SizedBox(height: 16),
                Row(children: [const Icon(Icons.phone_outlined, size: 16, color: Colors.grey), const SizedBox(width: 8), Text(phone, style: const TextStyle(fontWeight: FontWeight.w500, color: Colors.black87))]),
                const SizedBox(height: 8),
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [const Icon(Icons.location_on_outlined, size: 16, color: Colors.grey), const SizedBox(width: 8), Expanded(child: Text(address, style: const TextStyle(color: Colors.black87)))]),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: Colors.white, border: Border.all(color: Colors.grey.shade200), borderRadius: BorderRadius.circular(8)),
                  child: Row(
                    children: [
                      const Icon(Icons.local_shipping_outlined, size: 18, color: Colors.black87),
                      const SizedBox(width: 8),
                      Text('Payment: ${b['payment_method'] ?? 'COD'}', style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black87, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Properties & Services'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: Colors.black,
          unselectedLabelColor: Colors.grey,
          tabs: const [
            Tab(text: 'Rooms'),
            Tab(text: 'Flats'),
            Tab(text: 'Flatmates'),
            Tab(text: 'Materials, Transport & Build'),
            Tab(text: 'Bookings Received'),
          ],
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : TabBarView(
            controller: _tabController,
            children: [
              _buildList(_rooms, 'You have no room listings.', '/room'),
              _buildList(_flats, 'You have no flat listings.', '/flat-sale'),
              _buildList(_flatmates, 'You have no flatmate listings.', '/flatmate'),
              _buildList(_services, 'You have no service listings.', '/build/detail'),
              _buildBookingsList(),
            ],
          ),
    );
  }
}
