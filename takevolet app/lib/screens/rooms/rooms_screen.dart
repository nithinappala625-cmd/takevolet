import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../main.dart';

class RoomsScreen extends StatefulWidget {
  const RoomsScreen({super.key});

  @override
  State<RoomsScreen> createState() => _RoomsScreenState();
}

class _RoomsScreenState extends State<RoomsScreen> {
  String _searchQuery = '';
  String _selectedFilter = 'All';

  Future<List<Map<String, dynamic>>> _fetchRooms() async {
    var query = supabase.from('rooms').select();
    
    if (_searchQuery.isNotEmpty) {
      query = query.ilike('location', '%$_searchQuery%');
    }

    if (_selectedFilter != 'All') {
      if (_selectedFilter == 'Furnished') {
        query = query.eq('furnishing', 'Furnished');
      } else if (_selectedFilter == 'PG/Hostel') {
        // PG / Hostel logic
      } else {
        query = query.ilike('title', '%$_selectedFilter%');
      }
    }

    return await query.order('created_at', ascending: false);
  }

  Widget _buildLoadingSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: 3,
      itemBuilder: (context, index) => Container(
        height: 250,
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  Widget _buildTag(BuildContext context, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(text, style: TextStyle(color: Theme.of(context).colorScheme.primary, fontSize: 12, fontWeight: FontWeight.w500)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Rooms', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        actions: [
          IconButton(icon: const Icon(Icons.notifications_none), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: TextField(
              onChanged: (val) {
                setState(() { _searchQuery = val; });
              },
              decoration: InputDecoration(
                hintText: 'Search by city, locality, or colony...',
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(30),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
          // Filter Chips
          SizedBox(
            height: 50,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _buildFilterChip('All'),
                _buildFilterChip('1 RK'),
                _buildFilterChip('1 BHK'),
                _buildFilterChip('2 BHK'),
                _buildFilterChip('PG/Hostel'),
                _buildFilterChip('Furnished'),
              ],
            ),
          ),
          Expanded(
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: _fetchRooms(),
              builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return _buildLoadingSkeleton();
          final data = snapshot.data;
          if (data == null || data.isEmpty) return const Center(child: Text('No rooms available right now.'));
          
          return RefreshIndicator(
            onRefresh: () async { setState(() {}); },
            child: ListView.builder(
              padding: const EdgeInsets.only(bottom: 100, top: 16),
              itemCount: data.length,
              itemBuilder: (context, index) {
                final room = data[index];
                final images = (room['images'] as List<dynamic>?)?.cast<String>() ?? [];
                final thumbnailUrl = images.isNotEmpty ? images.first : null;

                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: () => context.push('/room/${room['id']}'),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          height: 200,
                          width: double.infinity,
                          child: thumbnailUrl != null
                              ? CachedNetworkImage(imageUrl: thumbnailUrl, fit: BoxFit.cover, placeholder: (context, url) => Container(color: Colors.grey[200]))
                              : Container(color: Colors.grey[200], child: const Icon(Icons.home, size: 50, color: Colors.grey)),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(child: Text(room['title'] ?? 'Premium Room', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                  Text('₹${room['rent']}/mo', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 18)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  const Icon(Icons.location_on, color: Colors.grey, size: 14),
                                  const SizedBox(width: 4),
                                  Text('${room['colony'] ?? ''}, ${room['location'] ?? ''}', style: const TextStyle(color: Colors.grey, fontSize: 14)),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  _buildTag(context, room['gender_preference'] ?? 'Any Gender'),
                                  const SizedBox(width: 8),
                                  _buildTag(context, room['furnishing'] ?? 'Furnished'),
                                ],
                              )
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    bool isSelected = _selectedFilter == label;
    return Container(
      margin: const EdgeInsets.only(right: 8, top: 8, bottom: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (bool value) {
          setState(() { _selectedFilter = label; });
        },
        selectedColor: Theme.of(context).colorScheme.primary.withOpacity(0.2),
        checkmarkColor: Theme.of(context).colorScheme.primary,
        labelStyle: TextStyle(
          color: isSelected ? Theme.of(context).colorScheme.primary : Colors.black87,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
        backgroundColor: Colors.grey[100],
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: isSelected ? Theme.of(context).colorScheme.primary : Colors.transparent)),
      ),
    );
  }
}
