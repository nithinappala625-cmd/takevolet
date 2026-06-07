import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../main.dart';
import '../../services/payment_service.dart';

class RoomDetailsScreen extends StatefulWidget {
  final String roomId;
  const RoomDetailsScreen({super.key, required this.roomId});

  @override
  State<RoomDetailsScreen> createState() => _RoomDetailsScreenState();
}

class _RoomDetailsScreenState extends State<RoomDetailsScreen> {
  late Future<Map<String, dynamic>> _roomFuture;
  bool _hasUnlocked = false;

  @override
  void initState() {
    super.initState();
    _roomFuture = _fetchRoomDetails();
  }

  Future<Map<String, dynamic>> _fetchRoomDetails() async {
    try {
      final response = await supabase
          .from('rooms')
          .select('*, profiles(full_name, phone, whatsapp, avatar_url, profession)')
          .eq('id', widget.roomId)
          .single();

      // Also check if current user has already unlocked it
      final user = supabase.auth.currentUser;
      if (user != null) {
        final interest = await supabase
            .from('interests')
            .select('id')
            .eq('room_id', widget.roomId)
            .eq('seeker_id', user.id)
            .eq('payment_status', 'paid')
            .maybeSingle();
        
        if (interest != null) {
          setState(() => _hasUnlocked = true);
        }
      }

      return response;
    } catch (e) {
      // Fallback dummy data if not configured
      return {
        'id': widget.roomId,
        'title': 'Demo Room',
        'description': 'This is a beautiful room located in the heart of the city.',
        'rent': 15000,
        'advance': 30000,
        'location': 'Downtown',
        'full_address': '123 Fake Street, Apt 4B, Downtown',
        'images': ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'],
        'amenities': ['WiFi', 'AC', 'Washing Machine'],
        'profiles': {
          'full_name': 'John Doe',
          'phone': '9876543210'
        }
      };
    }
  }

  Future<void> _unlockContact(Map<String, dynamic> room) async {
    final user = supabase.auth.currentUser;
    if (user == null) {
      context.go('/login');
      return;
    }
    
    // Call our Razorpay Payment Service
    final success = await PaymentService.initiateUnlockPayment(
      context: context,
      roomId: widget.roomId,
      posterId: room['user_id'] ?? 'dummy_poster',
      roomTitle: room['title'],
    );

    if (success) {
      setState(() => _hasUnlocked = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Room Details')),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _roomFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError || !snapshot.hasData) {
             return const Center(child: Text('Failed to load room details.'));
          }

          final room = snapshot.data!;
          final images = (room['images'] as List<dynamic>?)?.cast<String>() ?? [];
          final amenities = (room['amenities'] as List<dynamic>?)?.cast<String>() ?? [];
          final profile = room['profiles'] as Map<String, dynamic>? ?? {};

          return ListView(
            padding: const EdgeInsets.only(bottom: 100),
            children: [
              if (images.isNotEmpty)
                SizedBox(
                  height: 250,
                  child: PageView.builder(
                    itemCount: images.length,
                    itemBuilder: (context, i) => CachedNetworkImage(
                      imageUrl: images[i],
                      fit: BoxFit.cover,
                      placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                      errorWidget: (context, url, error) => const Icon(Icons.error),
                    ),
                  ),
                )
              else
                Container(
                  height: 250,
                  color: Colors.grey.shade300,
                  child: const Icon(Icons.image_not_supported, size: 50),
                ),
              
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(room['title'] ?? 'Untitled', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text('₹${room['rent']}/month', style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Theme.of(context).colorScheme.primary)),
                    Text('Advance: ₹${room['advance'] ?? 0}', style: Theme.of(context).textTheme.bodyMedium),
                    const Divider(height: 32),
                    
                    const Text('Description', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 8),
                    Text(room['description'] ?? 'No description provided.'),
                    const Divider(height: 32),

                    const Text('Amenities', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: amenities.map((a) => Chip(label: Text(a))).toList(),
                    ),
                    const Divider(height: 32),

                    const Text('Address & Contact', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    const SizedBox(height: 8),
                    
                    if (_hasUnlocked) ...[
                       ListTile(
                         leading: const Icon(Icons.location_on),
                         title: Text(room['full_address'] ?? 'Address not available'),
                       ),
                       ListTile(
                         leading: const Icon(Icons.person),
                         title: Text(profile['full_name'] ?? 'Unknown Poster'),
                         subtitle: Text('Phone: ${profile['phone'] ?? 'N/A'}'),
                       )
                    ] else ...[
                       Container(
                         padding: const EdgeInsets.all(16),
                         decoration: BoxDecoration(
                           color: Theme.of(context).colorScheme.surfaceContainerHighest,
                           borderRadius: BorderRadius.circular(12),
                         ),
                         child: Column(
                           children: [
                             const Icon(Icons.lock, size: 40),
                             const SizedBox(height: 8),
                             const Text('Exact address and contact details are hidden.', textAlign: TextAlign.center),
                             const SizedBox(height: 16),
                             SizedBox(
                               width: double.infinity,
                               child: ElevatedButton.icon(
                                 onPressed: () => _unlockContact(room),
                                 icon: const Icon(Icons.key),
                                 label: const Text('Unlock for ₹500'),
                               ),
                             )
                           ],
                         ),
                       )
                    ]
                  ],
                ),
              )
            ],
          );
        },
      ),
    );
  }
}
