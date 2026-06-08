import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../main.dart';
import '../../utils/image_utils.dart';

class FlatmatesScreen extends StatefulWidget {
  const FlatmatesScreen({super.key});

  @override
  State<FlatmatesScreen> createState() => _FlatmatesScreenState();
}

class _FlatmatesScreenState extends State<FlatmatesScreen> {
  List<Map<String, dynamic>> flatmates = [];
  List<Map<String, dynamic>> filteredFlatmates = [];
  bool isLoading = true;
  String searchQuery = '';
  String selectedFilter = 'All';
  double _minBudget = 0;
  double _maxBudget = 30000;
  bool _filtersApplied = false;
  int _vacancyFilter = 0;
  String _selectedCity = 'Hyderabad';

  final List<String> filters = ['All', 'Male', 'Female', 'Co-ed'];
  final List<String> _cities = ['Hyderabad', 'Bangalore'];

  @override
  void initState() {
    super.initState();
    _fetchFlatmates();
  }

  Future<void> _fetchFlatmates() async {
    try {
      final res = await supabase
          .from('flatmates')
          .select()
          .eq('is_available', true)
          .eq('city', _selectedCity)
          .order('created_at', ascending: false);
      setState(() {
        flatmates = List<Map<String, dynamic>>.from(res);
        filteredFlatmates = flatmates;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  void _applyFilters() {
    setState(() {
      filteredFlatmates = flatmates.where((f) {
        final matchesSearch = searchQuery.isEmpty ||
            (f['title'] ?? '').toString().toLowerCase().contains(searchQuery.toLowerCase()) ||
            (f['location'] ?? '').toString().toLowerCase().contains(searchQuery.toLowerCase()) ||
            (f['colony'] ?? '').toString().toLowerCase().contains(searchQuery.toLowerCase());

        final genderPref = (f['gender_pref'] ?? 'Any').toString();
        final matchesFilter = selectedFilter == 'All' ||
            (selectedFilter == 'Male' && genderPref.contains('Male')) ||
            (selectedFilter == 'Female' && genderPref.contains('Female')) ||
            (selectedFilter == 'Co-ed' && genderPref == 'Any');

        final rent = (f['rent_share'] ?? 0) as num;
        final matchesBudget = !_filtersApplied || (rent >= _minBudget && rent <= _maxBudget);
        final vacancy = (f['vacancy_count'] ?? 1) as num;
        final matchesVacancy = _vacancyFilter == 0 || vacancy >= _vacancyFilter;

        return matchesSearch && matchesFilter && matchesBudget && matchesVacancy;
      }).toList();
    });
  }

  void _showFilterBottomSheet() {
    double tempMin = _minBudget;
    double tempMax = _maxBudget;
    int tempVacancy = _vacancyFilter;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          height: MediaQuery.of(context).size.height * 0.6,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              Container(margin: const EdgeInsets.only(top: 12), width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(2))),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Filters', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                    TextButton(onPressed: () => setModalState(() { tempMin = 0; tempMax = 30000; tempVacancy = 0; }),
                        child: const Text('Reset', style: TextStyle(color: Color(0xFFD4AF37)))),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  children: [
                    const Text('Monthly Budget (per share)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text('₹${tempMin.toInt()}', style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.w600)),
                      Text('₹${tempMax.toInt()}', style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.w600)),
                    ]),
                    RangeSlider(
                      values: RangeValues(tempMin, tempMax),
                      min: 0, max: 30000, divisions: 30,
                      activeColor: const Color(0xFFD4AF37),
                      onChanged: (v) => setModalState(() { tempMin = v.start; tempMax = v.end; }),
                    ),
                    const SizedBox(height: 16),
                    const Text('Min. Vacancies Available', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    Wrap(spacing: 8, children: [0, 1, 2, 3].map((v) => ChoiceChip(
                      label: Text(v == 0 ? 'Any' : '$v+'),
                      selected: tempVacancy == v,
                      selectedColor: const Color(0xFFD4AF37).withOpacity(0.2),
                      labelStyle: TextStyle(color: tempVacancy == v ? const Color(0xFFD4AF37) : Colors.black87, fontWeight: FontWeight.w600),
                      onSelected: (_) => setModalState(() => tempVacancy = v),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: tempVacancy == v ? const Color(0xFFD4AF37) : Colors.grey[300]!)),
                    )).toList()),
                  ],
                ),
              ),
              Padding(
                padding: EdgeInsets.only(left: 20, right: 20, bottom: MediaQuery.of(context).padding.bottom + 16, top: 8),
                child: SizedBox(width: double.infinity, child: ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _minBudget = tempMin; _maxBudget = tempMax; _vacancyFilter = tempVacancy;
                      _filtersApplied = tempMin > 0 || tempMax < 30000 || tempVacancy > 0;
                    });
                    _applyFilters();
                    Navigator.pop(ctx);
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFD4AF37), foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                  child: const Text('Apply Filters', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                )),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Find Flatmates', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
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
                    onTap: () {
                      setState(() => _selectedCity = city);
                      _fetchFlatmates();
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
          // Search + Filter Row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    onChanged: (v) { searchQuery = v; _applyFilters(); },
                    decoration: InputDecoration(
                      hintText: 'Search by city, locality, or colony...',
                      prefixIcon: const Icon(Icons.search, color: Colors.grey),
                      filled: true, fillColor: Colors.grey[100],
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
                    child: Icon(Icons.tune, color: _filtersApplied ? Colors.white : Colors.grey[700]),
                  ),
                ),
              ],
            ),
          ),
          // Filter Chips
          SizedBox(
            height: 44,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: filters.length,
              itemBuilder: (context, index) {
                final filter = filters[index];
                final isSelected = filter == selectedFilter;
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: FilterChip(
                    label: Text(filter, style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: isSelected ? Colors.white : Colors.black87,
                      fontSize: 13,
                    )),
                    selected: isSelected,
                    onSelected: (_) {
                      selectedFilter = filter;
                      _applyFilters();
                    },
                    selectedColor: const Color(0xFFD4AF37),
                    backgroundColor: Colors.grey[100],
                    checkmarkColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    side: BorderSide(color: isSelected ? const Color(0xFFD4AF37) : Colors.grey[300]!),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          // List
          Expanded(
            child: isLoading
                ? ListView.builder(
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
                  )
                : filteredFlatmates.isEmpty
                    ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.people_outline, size: 64, color: Colors.grey[300]),
                        const SizedBox(height: 12),
                        Text('No flatmates found', style: TextStyle(color: Colors.grey[500], fontSize: 16)),
                      ]))
                    : RefreshIndicator(
                        onRefresh: _fetchFlatmates,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filteredFlatmates.length,
                          itemBuilder: (context, index) {
                            final flatmate = filteredFlatmates[index];
                            return _buildFlatmateCard(flatmate);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFlatmateCard(Map<String, dynamic> flatmate) {
    final images = ImageUtils.parseImages(flatmate['images']);
    final hasImage = images.isNotEmpty;
    final title = flatmate['title'] ?? 'Flatmate Needed';
    final location = '${flatmate['colony'] ?? flatmate['location'] ?? ''}';
    final rentShare = flatmate['rent_share'] ?? 0;
    final genderPref = flatmate['gender_pref'] ?? 'Any';
    final vacancy = flatmate['vacancy_count'] ?? 1;

    return GestureDetector(
      onTap: () => context.push('/flatmate/${flatmate['id']}'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4)),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            SizedBox(
              height: 200,
              width: double.infinity,
              child: hasImage
                  ? CachedNetworkImage(
                      imageUrl: images.first,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(color: Colors.grey[200], child: const Center(child: CircularProgressIndicator(strokeWidth: 2))),
                      errorWidget: (_, __, ___) => Container(
                        color: Colors.grey[100],
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Icon(Icons.people, size: 48, color: Colors.grey[400]),
                          const SizedBox(height: 8),
                          Text('No Photo', style: TextStyle(color: Colors.grey[500])),
                        ]),
                      ),
                    )
                  : Container(
                      color: const Color(0xFFF5EFD0),
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(Icons.people_alt_rounded, size: 56, color: const Color(0xFFD4AF37).withOpacity(0.6)),
                        const SizedBox(height: 8),
                        Text('Looking for Flatmate', style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.w500)),
                      ]),
                    ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16), maxLines: 2, overflow: TextOverflow.ellipsis)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFD4AF37),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('₹$rentShare', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(children: [
                    const Icon(Icons.location_on, size: 14, color: Colors.grey),
                    const SizedBox(width: 4),
                    Expanded(child: Text(location, style: const TextStyle(color: Colors.grey, fontSize: 13), overflow: TextOverflow.ellipsis)),
                  ]),
                  const SizedBox(height: 10),
                  Row(children: [
                    _buildTag(Icons.wc, '$genderPref Only'),
                    const SizedBox(width: 10),
                    _buildTag(Icons.group, '$vacancy Vacancy'),
                  ]),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTag(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: const Color(0xFFD4AF37)),
        const SizedBox(width: 4),
        Text(text, style: TextStyle(fontSize: 12, color: Colors.grey[700], fontWeight: FontWeight.w500)),
      ]),
    );
  }
}
