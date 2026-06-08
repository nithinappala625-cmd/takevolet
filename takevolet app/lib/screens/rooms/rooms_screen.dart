import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../main.dart';
import '../../utils/image_utils.dart';
import 'package:carousel_slider/carousel_slider.dart';
import '../../widgets/smart_image.dart';

class RoomsScreen extends StatefulWidget {
  const RoomsScreen({super.key});

  @override
  State<RoomsScreen> createState() => _RoomsScreenState();
}

class _RoomsScreenState extends State<RoomsScreen> {
  String _searchQuery = '';
  String _selectedCity = 'Hyderabad';
  double _minBudget = 0;
  double _maxBudget = 50000;
  String _genderFilter = 'Any';
  String _furnishingFilter = 'Any';
  bool _bikeParkingFilter = false;
  bool _carParkingFilter = false;
  int _maxMembersFilter = 0;
  bool _filtersApplied = false;

  final List<String> _cities = ['Hyderabad', 'Bangalore'];
  final List<String> _genderOptions = ['Any', 'Male', 'Female', 'Family'];
  final List<String> _furnishingOptions = ['Any', 'Furnished', 'Semi-Furnished', 'Unfurnished'];

  Future<List<Map<String, dynamic>>> _fetchRooms() async {
    var query = supabase.from('rooms').select().eq('is_available', true).eq('city', _selectedCity);

    if (_searchQuery.isNotEmpty) {
      query = query.ilike('location', '%$_searchQuery%');
    }

    if (_filtersApplied) {
      query = query.gte('rent', _minBudget.toInt()).lte('rent', _maxBudget.toInt());
      if (_genderFilter != 'Any') query = query.eq('gender_preference', _genderFilter);
      if (_furnishingFilter != 'Any') query = query.eq('furnishing', _furnishingFilter);
      if (_bikeParkingFilter) query = query.eq('bike_parking', true);
      if (_carParkingFilter) query = query.eq('car_parking', true);
      if (_maxMembersFilter > 0) query = query.lte('max_tenants', _maxMembersFilter);
    }

    return await query.order('created_at', ascending: false);
  }

  void _showFilterBottomSheet() {
    double tempMin = _minBudget;
    double tempMax = _maxBudget;
    String tempGender = _genderFilter;
    String tempFurnishing = _furnishingFilter;
    bool tempBike = _bikeParkingFilter;
    bool tempCar = _carParkingFilter;
    int tempMembers = _maxMembersFilter;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2)),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Filters', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                    TextButton(
                      onPressed: () {
                        setModalState(() {
                          tempMin = 0; tempMax = 50000; tempGender = 'Any';
                          tempFurnishing = 'Any'; tempBike = false; tempCar = false; tempMembers = 0;
                        });
                      },
                      child: const Text('Reset All', style: TextStyle(color: Color(0xFFD4AF37))),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  children: [
                    // Budget Range
                    const Text('Monthly Budget', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 4),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text('₹${tempMin.toInt()}', style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.w600)),
                      Text('₹${tempMax.toInt()}', style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.w600)),
                    ]),
                    RangeSlider(
                      values: RangeValues(tempMin, tempMax),
                      min: 0, max: 50000, divisions: 50,
                      activeColor: const Color(0xFFD4AF37),
                      labels: RangeLabels('₹${tempMin.toInt()}', '₹${tempMax.toInt()}'),
                      onChanged: (v) => setModalState(() { tempMin = v.start; tempMax = v.end; }),
                    ),
                    const SizedBox(height: 16),

                    // Gender Preference
                    const Text('Gender Preference', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: _genderOptions.map((g) => ChoiceChip(
                        label: Text(g),
                        selected: tempGender == g,
                        selectedColor: const Color(0xFFD4AF37).withOpacity(0.2),
                        labelStyle: TextStyle(color: tempGender == g ? const Color(0xFFD4AF37) : Colors.black87, fontWeight: FontWeight.w600),
                        onSelected: (_) => setModalState(() => tempGender = g),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: tempGender == g ? const Color(0xFFD4AF37) : Colors.grey[300]!)),
                      )).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Furnishing
                    const Text('Furnishing', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: _furnishingOptions.map((f) => ChoiceChip(
                        label: Text(f),
                        selected: tempFurnishing == f,
                        selectedColor: const Color(0xFFD4AF37).withOpacity(0.2),
                        labelStyle: TextStyle(color: tempFurnishing == f ? const Color(0xFFD4AF37) : Colors.black87, fontWeight: FontWeight.w600),
                        onSelected: (_) => setModalState(() => tempFurnishing = f),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: tempFurnishing == f ? const Color(0xFFD4AF37) : Colors.grey[300]!)),
                      )).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Max Members
                    const Text('Max Members Allowed', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: [0, 1, 2, 3, 4, 5].map((m) => ChoiceChip(
                        label: Text(m == 0 ? 'Any' : '$m'),
                        selected: tempMembers == m,
                        selectedColor: const Color(0xFFD4AF37).withOpacity(0.2),
                        labelStyle: TextStyle(color: tempMembers == m ? const Color(0xFFD4AF37) : Colors.black87, fontWeight: FontWeight.w600),
                        onSelected: (_) => setModalState(() => tempMembers = m),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: tempMembers == m ? const Color(0xFFD4AF37) : Colors.grey[300]!)),
                      )).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Parking
                    const Text('Parking', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Row(children: [
                      Expanded(child: InkWell(
                        onTap: () => setModalState(() => tempBike = !tempBike),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: tempBike ? const Color(0xFFD4AF37).withOpacity(0.1) : Colors.grey[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: tempBike ? const Color(0xFFD4AF37) : Colors.grey[300]!),
                          ),
                          child: Column(children: [
                            Icon(Icons.two_wheeler, color: tempBike ? const Color(0xFFD4AF37) : Colors.grey),
                            const SizedBox(height: 4),
                            Text('Bike Parking', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: tempBike ? const Color(0xFFD4AF37) : Colors.grey[600])),
                          ]),
                        ),
                      )),
                      const SizedBox(width: 12),
                      Expanded(child: InkWell(
                        onTap: () => setModalState(() => tempCar = !tempCar),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: tempCar ? const Color(0xFFD4AF37).withOpacity(0.1) : Colors.grey[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: tempCar ? const Color(0xFFD4AF37) : Colors.grey[300]!),
                          ),
                          child: Column(children: [
                            Icon(Icons.directions_car, color: tempCar ? const Color(0xFFD4AF37) : Colors.grey),
                            const SizedBox(height: 4),
                            Text('Car Parking', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: tempCar ? const Color(0xFFD4AF37) : Colors.grey[600])),
                          ]),
                        ),
                      )),
                    ]),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
              Padding(
                padding: EdgeInsets.only(left: 20, right: 20, bottom: MediaQuery.of(context).padding.bottom + 16, top: 8),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _minBudget = tempMin; _maxBudget = tempMax;
                        _genderFilter = tempGender; _furnishingFilter = tempFurnishing;
                        _bikeParkingFilter = tempBike; _carParkingFilter = tempCar;
                        _maxMembersFilter = tempMembers;
                        _filtersApplied = tempMin > 0 || tempMax < 50000 || tempGender != 'Any' ||
                            tempFurnishing != 'Any' || tempBike || tempCar || tempMembers > 0;
                      });
                      Navigator.pop(ctx);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD4AF37),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text('Apply Filters', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: 4,
      itemBuilder: (context, index) => Shimmer.fromColors(
        baseColor: Colors.grey[300]!,
        highlightColor: Colors.grey[100]!,
        child: Container(
          height: 250,
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }

  Widget _buildTag(BuildContext context, IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: const Color(0xFFD4AF37)),
          const SizedBox(width: 4),
          Text(text, style: TextStyle(color: Colors.grey[700], fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Rooms', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        actions: [
          IconButton(
            icon: Stack(children: [
              const Icon(Icons.notifications_none),
              if (true) Positioned(right: 0, top: 0, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle))),
            ]),
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('No new notifications'))),
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
                    onTap: () => setState(() => _selectedCity = city),
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

          // Removed Coming soon placeholder
          // Search + Filter Row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 4.0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      onChanged: (val) => setState(() => _searchQuery = val),
                      decoration: InputDecoration(
                        hintText: 'Search by locality...',
                        prefixIcon: const Icon(Icons.search, color: Colors.grey),
                        filled: true,
                        fillColor: Colors.grey[100],
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide.none),
                        contentPadding: const EdgeInsets.symmetric(vertical: 0),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: _showFilterBottomSheet,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _filtersApplied ? const Color(0xFFD4AF37) : Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _filtersApplied ? const Color(0xFFD4AF37) : Colors.grey[300]!),
                      ),
                      child: Stack(children: [
                        Icon(Icons.tune, color: _filtersApplied ? Colors.white : Colors.grey[700]),
                        if (_filtersApplied) Positioned(right: 0, top: 0, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle))),
                      ]),
                    ),
                  ),
                ],
              ),
            ),
            if (_filtersApplied)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                child: Row(children: [
                  const Icon(Icons.filter_list, size: 14, color: Color(0xFFD4AF37)),
                  const SizedBox(width: 4),
                  const Text('Filters active', style: TextStyle(fontSize: 12, color: Color(0xFFD4AF37), fontWeight: FontWeight.w600)),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => setState(() {
                      _minBudget = 0; _maxBudget = 50000; _genderFilter = 'Any';
                      _furnishingFilter = 'Any'; _bikeParkingFilter = false; _carParkingFilter = false;
                      _maxMembersFilter = 0; _filtersApplied = false;
                    }),
                    child: const Text('Clear', style: TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.w600)),
                  ),
                ]),
              ),

            // Rooms Ad Banner
            FutureBuilder<List<Map<String, dynamic>>>(
              future: supabase.from('ads').select().eq('placement', 'rooms_page').eq('is_active', true).order('created_at', ascending: false),
              builder: (context, snapshot) {
                final ads = snapshot.data ?? [];
                if (ads.isEmpty) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: CarouselSlider(
                    options: CarouselOptions(
                      height: 120,
                      autoPlay: true,
                      enlargeCenterPage: true,
                      viewportFraction: 1.0,
                    ),
                    items: ads.map((ad) => Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: Colors.grey[200],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          if (ad['image_url'] != null && ad['image_url'].toString().isNotEmpty)
                            SmartImage(imageUrl: ad['image_url'], fit: BoxFit.cover)
                          else
                            Container(color: const Color(0xFFD4AF37).withOpacity(0.1)),
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Colors.black.withOpacity(0.5), Colors.transparent],
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                              ),
                            ),
                            alignment: Alignment.bottomLeft,
                            padding: const EdgeInsets.all(12),
                            child: Text(ad['title'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          ),
                        ],
                      ),
                    )).toList(),
                  ),
                );
              },
            ),

            Expanded(
              child: FutureBuilder<List<Map<String, dynamic>>>(
                key: ValueKey('$_searchQuery$_filtersApplied$_selectedCity$_minBudget$_maxBudget$_genderFilter'),
                future: _fetchRooms(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) return _buildLoadingSkeleton();
                  final data = snapshot.data;
                  if (data == null || data.isEmpty) {
                    return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.home_work_outlined, size: 64, color: Colors.grey[300]),
                      const SizedBox(height: 12),
                      Text('No rooms found', style: TextStyle(color: Colors.grey[500], fontSize: 16)),
                      if (_filtersApplied) ...[
                        const SizedBox(height: 8),
                        TextButton(onPressed: () => setState(() { _filtersApplied = false; }), child: const Text('Clear Filters')),
                      ],
                    ]));
                  }

                  return RefreshIndicator(
                    onRefresh: () async => setState(() {}),
                    child: ListView.builder(
                      padding: const EdgeInsets.only(bottom: 100, top: 8, left: 16, right: 16),
                      itemCount: data.length,
                      itemBuilder: (context, index) {
                        final room = data[index];
                        final thumbnailUrl = ImageUtils.getThumbnail(room);

                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))],
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
                                      ? CachedNetworkImage(imageUrl: thumbnailUrl, fit: BoxFit.cover,
                                          placeholder: (c, u) => Container(color: Colors.grey[200]),
                                          errorWidget: (c, u, e) => Container(color: const Color(0xFFF5EFD0), child: const Icon(Icons.home_work_rounded, size: 56, color: Color(0xFFD4AF37))))
                                      : Container(color: const Color(0xFFF5EFD0), child: const Icon(Icons.home_work_rounded, size: 56, color: Color(0xFFD4AF37))),
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(14),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(child: Text(room['title'] ?? 'Premium Room', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 2, overflow: TextOverflow.ellipsis)),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                            decoration: BoxDecoration(color: const Color(0xFFD4AF37), borderRadius: BorderRadius.circular(20)),
                                            child: Text('₹${room['rent']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Row(children: [
                                        const Icon(Icons.location_on, color: Colors.grey, size: 14),
                                        const SizedBox(width: 4),
                                        Expanded(child: Text('${room['colony'] ?? ''}, ${room['location'] ?? ''}', style: const TextStyle(color: Colors.grey, fontSize: 13), overflow: TextOverflow.ellipsis)),
                                      ]),
                                      const SizedBox(height: 10),
                                      Wrap(spacing: 8, runSpacing: 6, children: [
                                        _buildTag(context, Icons.wc, room['gender_preference'] ?? 'Any Gender'),
                                        _buildTag(context, Icons.chair, room['furnishing'] ?? 'Furnished'),
                                        if (room['bike_parking'] == true) _buildTag(context, Icons.two_wheeler, 'Bike Parking'),
                                        if (room['car_parking'] == true) _buildTag(context, Icons.directions_car, 'Car Parking'),
                                      ]),
                                    ],
                                  ),
                                ),
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
}
