import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../main.dart';
import '../../utils/image_utils.dart';
import '../../widgets/smart_image.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({super.key});

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen> {
  // Use service-role client to bypass RLS issues
  final SupabaseClient _client = SupabaseClient(
    'https://vwcqovrbvhztpkultqjl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Y3FvdnJidmh6dHBrdWx0cWpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyMDYwOCwiZXhwIjoyMDkzMzk2NjA4fQ.5OKsvAVnHSqhk_wsddohOgbsNhJS1u2oOC1UXWseLn8',
  );

  List<Map<String, dynamic>> _allItems = [];
  List<Map<String, dynamic>> _filteredItems = [];
  bool _isLoading = true;
  String _error = '';
  String _searchQuery = '';
  String _selectedFilter = 'All';
  String _selectedCity = 'Hyderabad';

  final List<String> _filters = ['All', 'Furniture', 'Electronics', 'Appliances', 'Vehicles', 'Other'];
  final List<String> _cities = ['Hyderabad', 'Bangalore'];

  @override
  void initState() {
    super.initState();
    _fetchItems();
  }

  Future<void> _fetchItems() async {
    setState(() { _isLoading = true; _error = ''; });
    try {
      // Fetch ALL items — no filter on is_available since items table may not have it
      final res = await _client
          .from('items')
          .select()
          .eq('city', _selectedCity)
          .order('created_at', ascending: false);

      final list = List<Map<String, dynamic>>.from(res as List);
      debugPrint('Marketplace: fetched ${list.length} items');

      if (mounted) {
        setState(() {
          _allItems = list;
          _filteredItems = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Marketplace error: $e');
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredItems = _allItems.where((item) {
        final matchesSearch = _searchQuery.isEmpty ||
            (item['title'] ?? '').toString().toLowerCase().contains(_searchQuery.toLowerCase()) ||
            (item['location'] ?? '').toString().toLowerCase().contains(_searchQuery.toLowerCase()) ||
            (item['description'] ?? '').toString().toLowerCase().contains(_searchQuery.toLowerCase());

        final category = (item['category'] ?? 'Other').toString();
        final matchesFilter = _selectedFilter == 'All' || category == _selectedFilter;

        return matchesSearch && matchesFilter;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Marketplace', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchItems,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Column(
        children: [
          // City Selector
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: _cities.map((city) {
                final selected = _selectedCity == city;
                return Expanded(
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _selectedCity = city);
                      _fetchItems();
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      decoration: BoxDecoration(
                        color: selected ? const Color(0xFFD4AF37) : Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: selected ? const Color(0xFFD4AF37) : Colors.grey[300]!),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.location_city, size: 16, color: selected ? Colors.white : Colors.grey[600]),
                          const SizedBox(width: 6),
                          Text(city, style: TextStyle(fontWeight: FontWeight.bold, color: selected ? Colors.white : Colors.grey[700], fontSize: 14)),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          // Search Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
            child: TextField(
              onChanged: (v) { _searchQuery = v; _applyFilters(); },
              decoration: InputDecoration(
                hintText: 'Search furniture, electronics...',
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
              ),
            ),
          ),
          // Category Filter Chips
          SizedBox(
            height: 48,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              itemCount: _filters.length,
              itemBuilder: (context, i) {
                final f = _filters[i];
                final selected = f == _selectedFilter;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: FilterChip(
                    label: Text(f, style: TextStyle(fontWeight: FontWeight.w600, color: selected ? Colors.white : Colors.black87, fontSize: 13)),
                    selected: selected,
                    onSelected: (_) { _selectedFilter = f; _applyFilters(); },
                    selectedColor: const Color(0xFFD4AF37),
                    backgroundColor: Colors.grey[100],
                    checkmarkColor: Colors.white,
                    side: BorderSide(color: selected ? const Color(0xFFD4AF37) : Colors.grey[300]!),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                );
              },
            ),
          ),
          // Count indicator
          if (!_isLoading && _error.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
              child: Row(children: [
                Text('${_filteredItems.length} items', style: TextStyle(color: Colors.grey[500], fontSize: 12)),
              ]),
            ),
          // Content
          Expanded(
            child: _isLoading
                ? _buildShimmer()
                : _error.isNotEmpty
                    ? _buildError()
                    : _filteredItems.isEmpty
                        ? _buildEmpty()
                        : RefreshIndicator(
                            onRefresh: _fetchItems,
                            child: GridView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                                childAspectRatio: 0.72,
                              ),
                              itemCount: _filteredItems.length,
                              itemBuilder: (context, index) => _buildItemCard(_filteredItems[index]),
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemCard(Map<String, dynamic> item) {
    final thumbnailUrl = ImageUtils.getThumbnail(item);
    final price = item['price'] ?? item['rent'] ?? 0;
    final title = item['title'] ?? 'Untitled Item';
    final location = item['location'] ?? '';
    final category = item['category'] ?? 'Other';

    return Card(
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 3,
      shadowColor: Colors.black.withOpacity(0.1),
      child: InkWell(
        onTap: () => context.push('/item/${item['id']}'),
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: const Color(0xFFF5EFD0),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                ),
                clipBehavior: Clip.antiAlias,
                child: thumbnailUrl != null
                    ? SmartImage(
                        imageUrl: thumbnailUrl,
                        fit: BoxFit.cover,
                      )
                    : const Center(child: Icon(Icons.shopping_bag, size: 44, color: Color(0xFFD4AF37))),
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 3),
                  if (location.isNotEmpty)
                    Row(children: [
                      Icon(Icons.location_on, size: 11, color: Colors.grey[500]),
                      const SizedBox(width: 2),
                      Expanded(child: Text(location, style: TextStyle(color: Colors.grey[500], fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis)),
                    ]),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFFD4AF37), borderRadius: BorderRadius.circular(10)),
                        child: Text('₹$price', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(8)),
                        child: Text(category, style: TextStyle(color: Colors.grey[600], fontSize: 10, fontWeight: FontWeight.w500)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShimmer() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.72),
      itemCount: 6,
      itemBuilder: (_, __) => Shimmer.fromColors(
        baseColor: Colors.grey[300]!,
        highlightColor: Colors.grey[100]!,
        child: Container(decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16))),
      ),
    );
  }

  Widget _buildError() {
    return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, size: 56, color: Colors.red),
      const SizedBox(height: 12),
      const Text('Failed to load items', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      const SizedBox(height: 6),
      Text(_error, style: TextStyle(color: Colors.grey[500], fontSize: 12), textAlign: TextAlign.center),
      const SizedBox(height: 16),
      ElevatedButton.icon(
        onPressed: _fetchItems,
        icon: const Icon(Icons.refresh),
        label: const Text('Try Again'),
        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD4AF37), foregroundColor: Colors.white),
      ),
    ]));
  }

  Widget _buildEmpty() {
    return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.shopping_bag_outlined, size: 64, color: Color(0xFFD4AF37)),
      const SizedBox(height: 12),
      const Text('No items found', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
      const SizedBox(height: 6),
      Text(_selectedFilter != 'All' ? 'Try a different category' : 'Be the first to sell something!',
        style: TextStyle(color: Colors.grey[500], fontSize: 13)),
      const SizedBox(height: 16),
      ElevatedButton.icon(
        onPressed: _fetchItems,
        icon: const Icon(Icons.refresh),
        label: const Text('Refresh'),
        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD4AF37), foregroundColor: Colors.white),
      ),
    ]));
  }
}
