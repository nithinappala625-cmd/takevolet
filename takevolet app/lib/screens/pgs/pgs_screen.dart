import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../main.dart';
import '../../utils/image_utils.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../widgets/smart_image.dart';
import '../../data/locations.dart';

class PgsScreen extends StatefulWidget {
  final String? city;
  const PgsScreen({super.key, this.city});

  @override
  State<PgsScreen> createState() => _PgsScreenState();
}

class _PgsScreenState extends State<PgsScreen> {
  String _searchQuery = '';
  String _selectedPgType = 'All';
  String _selectedCity = 'All';
  double _minBudget = 0;
  double _maxBudget = 50000;
  String _genderFilter = 'Any';
  String _furnishingFilter = 'Any';
  bool _bikeParkingFilter = false;
  bool _carParkingFilter = false;
  int _maxMembersFilter = 0;
  bool _filtersApplied = false;

  final List<String> _cities = ['All', ...AVAILABLE_CITIES];
  final List<String> _genderOptions = ['Any', 'Male', 'Female', 'Family'];
  final List<String> _furnishingOptions = ['Any', 'Furnished', 'Semi-Furnished', 'Unfurnished'];

  @override
  void initState() {
    super.initState();
    if (widget.city != null) {
      _selectedCity = widget.city!;
    }
  }

  Future<List<Map<String, dynamic>>> _fetchPgs() async {
    var query = supabase.from('rooms').select().eq('is_available', true).eq('tenant_type', 'pg');
    if (_selectedCity != 'All') query = query.eq('city', _selectedCity);

    if (_selectedPgType != 'All') {
      if (_selectedPgType == 'Mens PG') {
        query = query.eq('gender_preference', 'Male');
      } else if (_selectedPgType == 'Womens PG' || _selectedPgType == 'Girls Hostel') {
        query = query.eq('gender_preference', 'Female');
      }
    }

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
                      child: const Text('Reset All', style: TextStyle(color: Color(0xFF7B3AEC))),
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
                      Text('₹${tempMin.toInt()}', style: const TextStyle(color: Color(0xFF7B3AEC), fontWeight: FontWeight.w600)),
                      Text('₹${tempMax.toInt()}', style: const TextStyle(color: Color(0xFF7B3AEC), fontWeight: FontWeight.w600)),
                    ]),
                    RangeSlider(
                      values: RangeValues(tempMin, tempMax),
                      min: 0, max: 50000, divisions: 50,
                      activeColor: const Color(0xFF7B3AEC),
                      labels: RangeLabels('₹${tempMin.toInt()}', '₹${tempMax.toInt()}'),
                      onChanged: (v) => setModalState(() { tempMin = v.start; tempMax = v.end; }),
                    ),
                    const SizedBox(height: 16),

                    // Gender Preference
                    const Text('Gender Preference', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: _genderOptions.map<Widget>((g) => ChoiceChip(
                        label: Text(g),
                        selected: tempGender == g,
                        selectedColor: const Color(0xFF7B3AEC).withOpacity(0.2),
                        labelStyle: TextStyle(color: tempGender == g ? const Color(0xFF7B3AEC) : Colors.black87, fontWeight: FontWeight.w600),
                        onSelected: (_) => setModalState(() => tempGender = g),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: tempGender == g ? const Color(0xFF7B3AEC) : Colors.grey[300]!)),
                      )).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Furnishing
                    const Text('Furnishing', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: _furnishingOptions.map<Widget>((f) => ChoiceChip(
                        label: Text(f),
                        selected: tempFurnishing == f,
                        selectedColor: const Color(0xFF7B3AEC).withOpacity(0.2),
                        labelStyle: TextStyle(color: tempFurnishing == f ? const Color(0xFF7B3AEC) : Colors.black87, fontWeight: FontWeight.w600),
                        onSelected: (_) => setModalState(() => tempFurnishing = f),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: tempFurnishing == f ? const Color(0xFF7B3AEC) : Colors.grey[300]!)),
                      )).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Max Members
                    const Text('Max Members Allowed', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: [0, 1, 2, 3, 4, 5].map<Widget>((m) => ChoiceChip(
                        label: Text(m == 0 ? 'Any' : '$m'),
                        selected: tempMembers == m,
                        selectedColor: const Color(0xFF7B3AEC).withOpacity(0.2),
                        labelStyle: TextStyle(color: tempMembers == m ? const Color(0xFF7B3AEC) : Colors.black87, fontWeight: FontWeight.w600),
                        onSelected: (_) => setModalState(() => tempMembers = m),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: tempMembers == m ? const Color(0xFF7B3AEC) : Colors.grey[300]!)),
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
                            color: tempBike ? const Color(0xFF7B3AEC).withOpacity(0.1) : Colors.grey[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: tempBike ? const Color(0xFF7B3AEC) : Colors.grey[300]!),
                          ),
                          child: Column(children: [
                            Icon(Icons.two_wheeler, color: tempBike ? const Color(0xFF7B3AEC) : Colors.grey),
                            const SizedBox(height: 4),
                            Text('Bike Parking', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: tempBike ? const Color(0xFF7B3AEC) : Colors.grey[600])),
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
                            color: tempCar ? const Color(0xFF7B3AEC).withOpacity(0.1) : Colors.grey[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: tempCar ? const Color(0xFF7B3AEC) : Colors.grey[300]!),
                          ),
                          child: Column(children: [
                            Icon(Icons.directions_car, color: tempCar ? const Color(0xFF7B3AEC) : Colors.grey),
                            const SizedBox(height: 4),
                            Text('Car Parking', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: tempCar ? const Color(0xFF7B3AEC) : Colors.grey[600])),
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
                      backgroundColor: const Color(0xFF7B3AEC),
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

  Widget _buildTag(BuildContext context, IconData defaultIcon, String text) {
    final lower = text.toLowerCase();
    Color bg;
    Color border;
    Color textColor;
    Color iconColor;
    IconData icon = defaultIcon;

    if (lower.contains('semi')) {
      bg = const Color(0xFFFFF7ED);
      border = const Color(0xFFFED7AA);
      textColor = const Color(0xFFC2410C);
      iconColor = const Color(0xFFEA580C);
      icon = Icons.chair_rounded;
    } else if (lower.contains('fully') || lower == 'furnished') {
      bg = const Color(0xFFEFF6FF);
      border = const Color(0xFFBFDBFE);
      textColor = const Color(0xFF1D4ED8);
      iconColor = const Color(0xFF2563EB);
      icon = Icons.weekend_rounded;
    } else if (lower.contains('unfurnished')) {
      bg = const Color(0xFFF8FAFC);
      border = const Color(0xFFCBD5E1);
      textColor = const Color(0xFF475569);
      iconColor = const Color(0xFF64748B);
      icon = Icons.chair_outlined;
    } else if (lower.contains('parking')) {
      bg = const Color(0xFFF0FDF4);
      border = const Color(0xFFBBF7D0);
      textColor = const Color(0xFF15803D);
      iconColor = const Color(0xFF16A34A);
    } else if (lower.contains('gender') || lower.contains('male') || lower.contains('female') || lower.contains('any') || lower.contains('boys') || lower.contains('girls')) {
      bg = const Color(0xFFFAF5FF);
      border = const Color(0xFFE9D5FF);
      textColor = const Color(0xFF7E22CE);
      iconColor = const Color(0xFF9333EA);
    } else if (lower.contains('sharing')) {
      bg = const Color(0xFFEFF6FF);
      border = const Color(0xFFBFDBFE);
      textColor = const Color(0xFF1D4ED8);
      iconColor = const Color(0xFF2563EB);
      icon = Icons.hotel_rounded;
    } else {
      bg = const Color(0xFFF5F3FF);
      border = const Color(0xFFDDD6FE);
      textColor = const Color(0xFF6D28D9);
      iconColor = const Color(0xFF7B3AEC);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border, width: 1.1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13.5, color: iconColor),
          const SizedBox(width: 5),
          Text(
            text,
            style: GoogleFonts.outfit(
              color: textColor,
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PGs & Hostels', style: TextStyle(fontWeight: FontWeight.bold)),
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
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _cities.length,
              itemBuilder: (context, index) {
                final city = _cities[index];
                final selected = _selectedCity == city;
                return GestureDetector(
                  onTap: () => setState(() => _selectedCity = city),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: selected ? const Color(0xFF7B3AEC) : Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: selected ? const Color(0xFF7B3AEC) : Colors.grey[400]!, width: 1.5),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.location_city, size: 16, color: selected ? Colors.white : Colors.black54),
                        const SizedBox(width: 6),
                        Text(city, style: TextStyle(fontWeight: FontWeight.bold, color: selected ? Colors.white : Colors.black87, fontSize: 14)),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // PG Type Quick Filter Chips
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              children: [
                _buildPgTypeChip('All'),
                _buildPgTypeChip('Mens PG'),
                _buildPgTypeChip('Womens PG'),
                _buildPgTypeChip('Co-ed / Coliving'),
                _buildPgTypeChip('Girls Hostel'),
                _buildPgTypeChip('Boys Hostel'),
              ],
            ),
          ),

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
                        color: _filtersApplied ? const Color(0xFF7B3AEC) : Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _filtersApplied ? const Color(0xFF7B3AEC) : Colors.grey[300]!),
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
                  const Icon(Icons.filter_list, size: 14, color: Color(0xFF7B3AEC)),
                  const SizedBox(width: 4),
                  const Text('Filters active', style: TextStyle(fontSize: 12, color: Color(0xFF7B3AEC), fontWeight: FontWeight.w600)),
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

            // Sponsored PG Banner (Surekha Coliving & Luxury PG)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Container(
                height: 125,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  image: const DecorationImage(
                    image: NetworkImage('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80'),
                    fit: BoxFit.cover,
                  ),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, 3)),
                  ],
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      colors: [Colors.black.withOpacity(0.85), Colors.transparent],
                      begin: Alignment.bottomLeft,
                      end: Alignment.topRight,
                    ),
                  ),
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: const Color(0xFF7B3AEC), borderRadius: BorderRadius.circular(6)),
                            child: const Text('SPONSORED PG', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 10)),
                          ),
                          const Spacer(),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(6)),
                            child: const Text('Starts ₹6,500/mo', style: TextStyle(color: Color(0xFF7B3AEC), fontWeight: FontWeight.bold, fontSize: 11)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text('Surekha Coliving & Luxury PG', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 2),
                      const Text('3 Times Homely Food • AC & Wi-Fi • Zero Deposit', style: TextStyle(color: Colors.white70, fontSize: 11)),
                    ],
                  ),
                ),
              ),
            ),

            Expanded(
              child: FutureBuilder<List<Map<String, dynamic>>>(
                key: ValueKey('$_searchQuery$_filtersApplied$_selectedCity$_minBudget$_maxBudget$_genderFilter'),
                future: _fetchPgs(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) return _buildLoadingSkeleton();
                  final data = snapshot.data;
                  if (data == null || data.isEmpty) {
                    return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.home_work_outlined, size: 64, color: Colors.grey[300]),
                      const SizedBox(height: 12),
                      Text('No PGs found', style: TextStyle(color: Colors.grey[500], fontSize: 16)),
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

                        final locParts = [room['colony'], room['locality'], room['location'], room['city']]
                            .where((e) => e != null && e.toString().trim().isNotEmpty)
                            .map((e) => e.toString().trim().replaceAll(RegExp(r'^,\s*'), ''))
                            .where((e) => e.isNotEmpty)
                            .toList();
                        final locStr = locParts.isNotEmpty ? locParts.take(2).join(', ') : 'Prime Location';

                        final images = ImageUtils.parseImages(room['images']);
                        final photoCount = images.length;
                        final pgType = room['pg_type']?.toString() ?? '';
                        final metadata = room['metadata'] as Map<String, dynamic>? ?? {};
                        final sp = metadata['sharing_prices'] as Map<String, dynamic>?;
                        final List<String> sharingBadges = [];
                        if (sp != null) {
                          if (sp['1_sharing'] != null && sp['1_sharing'] != 0) sharingBadges.add('1 Share: ₹${sp['1_sharing']}');
                          if (sp['2_sharing'] != null && sp['2_sharing'] != 0) sharingBadges.add('2 Share: ₹${sp['2_sharing']}');
                          if (sp['3_sharing'] != null && sp['3_sharing'] != 0) sharingBadges.add('3 Share: ₹${sp['3_sharing']}');
                          if (sp['4_sharing'] != null && sp['4_sharing'] != 0) sharingBadges.add('4 Share: ₹${sp['4_sharing']}');
                        }

                        return Container(
                          margin: const EdgeInsets.only(bottom: 18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFE2E8F0), width: 1.2),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF0F172A).withOpacity(0.06),
                                blurRadius: 14,
                                offset: const Offset(0, 5),
                              ),
                            ],
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: InkWell(
                            onTap: () => context.push('/pg/${room['id']}'),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Stack(
                                  children: [
                                    SizedBox(
                                      height: 205,
                                      width: double.infinity,
                                      child: thumbnailUrl != null
                                          ? CachedNetworkImage(
                                              imageUrl: thumbnailUrl,
                                              fit: BoxFit.cover,
                                              placeholder: (c, u) => Container(color: const Color(0xFFF1F5F9)),
                                              errorWidget: (c, u, e) => Container(
                                                color: const Color(0xFFF1F5F9),
                                                child: const Icon(Icons.apartment_rounded, size: 56, color: Color(0xFF94A3B8)),
                                              ),
                                            )
                                          : Container(
                                              color: const Color(0xFFF1F5F9),
                                              child: const Icon(Icons.apartment_rounded, size: 56, color: Color(0xFF94A3B8)),
                                            ),
                                    ),
                                    Positioned(
                                      top: 12,
                                      left: 12,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF0F172A).withOpacity(0.85),
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const Icon(Icons.hotel_rounded, size: 12, color: Color(0xFF7B3AEC)),
                                            const SizedBox(width: 5),
                                            Text(
                                              'PG / HOSTEL',
                                              style: GoogleFonts.outfit(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w700,
                                                color: Colors.white,
                                                letterSpacing: 0.6,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    if (pgType.isNotEmpty)
                                      Positioned(
                                        top: 12,
                                        right: photoCount > 1 ? 55 : 12,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF7B3AEC),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            pgType,
                                            style: GoogleFonts.outfit(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w700,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ),
                                      ),
                                    if (photoCount > 1)
                                      Positioned(
                                        top: 12,
                                        right: 12,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.black54,
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.photo_library, size: 12, color: Colors.white),
                                              const SizedBox(width: 4),
                                              Text(
                                                '$photoCount',
                                                style: GoogleFonts.outfit(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    if ((room['video_url'] ?? metadata['video_url']) != null && (room['video_url'] ?? metadata['video_url']).toString().trim().isNotEmpty)
                                      Positioned(
                                        bottom: 12,
                                        left: 12,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: Colors.black87,
                                            borderRadius: BorderRadius.circular(6),
                                            border: Border.all(color: Colors.white24),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              const Icon(Icons.play_circle_fill, size: 13, color: Color(0xFF7B3AEC)),
                                              const SizedBox(width: 4),
                                              Text(
                                                'Video Tour',
                                                style: GoogleFonts.outfit(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                                Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        room['title'] ?? 'Premium PG',
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 17,
                                          color: const Color(0xFF0F172A),
                                          height: 1.25,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          const Icon(Icons.location_on, color: Color(0xFFE11D48), size: 15),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              locStr,
                                              style: GoogleFonts.outfit(
                                                color: const Color(0xFF475569),
                                                fontSize: 13,
                                                fontWeight: FontWeight.w500,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 12),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        crossAxisAlignment: CrossAxisAlignment.center,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF5F3FF),
                                              borderRadius: BorderRadius.circular(10),
                                              border: Border.all(color: const Color(0xFFDDD6FE), width: 1.2),
                                            ),
                                            child: Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                Text(
                                                  '₹${room['rent']}',
                                                  style: GoogleFonts.outfit(
                                                    color: const Color(0xFF6D28D9),
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 19,
                                                  ),
                                                ),
                                                Text(
                                                  ' / month',
                                                  style: GoogleFonts.outfit(
                                                    color: const Color(0xFF6D28D9),
                                                    fontWeight: FontWeight.w600,
                                                    fontSize: 12,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF0FDF4),
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: const Color(0xFFBBF7D0)),
                                            ),
                                            child: Text(
                                              '0 Brokerage',
                                              style: GoogleFonts.outfit(
                                                color: const Color(0xFF16A34A),
                                                fontWeight: FontWeight.w700,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      if (sharingBadges.isNotEmpty) ...[
                                        const SizedBox(height: 8),
                                        Wrap(
                                          spacing: 6,
                                          runSpacing: 4,
                                          children: sharingBadges.map((badge) => Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFAF5FF),
                                              borderRadius: BorderRadius.circular(6),
                                              border: Border.all(color: const Color(0xFFE9D5FF)),
                                            ),
                                            child: Text(
                                              badge,
                                              style: GoogleFonts.outfit(
                                                fontSize: 10.5,
                                                fontWeight: FontWeight.w700,
                                                color: const Color(0xFF7B3AEC),
                                              ),
                                            ),
                                          )).toList(),
                                        ),
                                      ],
                                      const SizedBox(height: 12),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        children: [
                                          _buildTag(context, Icons.wc, room['pg_type'] ?? 'Any Gender'),
                                          _buildTag(context, Icons.bed_rounded, room['sharing_type'] ?? 'Furnished'),
                                          if (room['bike_parking'] == true) _buildTag(context, Icons.two_wheeler, 'Bike Parking'),
                                          if (room['car_parking'] == true) _buildTag(context, Icons.directions_car, 'Car Parking'),
                                        ],
                                      ),
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
  Widget _buildPgTypeChip(String type) {
    final selected = _selectedPgType == type;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: FilterChip(
        selected: selected,
        label: Text(type),
        labelStyle: TextStyle(
          fontWeight: selected ? FontWeight.bold : FontWeight.w600,
          color: selected ? Colors.white : Colors.black87,
          fontSize: 12,
        ),
        selectedColor: const Color(0xFF7B3AEC),
        backgroundColor: Colors.grey[100],
        checkmarkColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: selected ? const Color(0xFF7B3AEC) : Colors.grey[300]!),
        ),
        onSelected: (val) {
          setState(() => _selectedPgType = type);
        },
      ),
    );
  }
}
