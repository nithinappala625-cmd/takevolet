import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../main.dart';
import '../../utils/image_utils.dart';
import '../../widgets/smart_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart' as geocoding;
import '../info/static_screens.dart';
import '../notifications/notifications_screen.dart';
import '../../theme/app_theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _currentLocation = 'Hyderabad';
  String _currentSubLocality = '';

  @override
  void initState() {
    super.initState();
    _determinePosition();
  }

  Future<void> _determinePosition() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) setState(() => _currentLocation = 'Hyderabad');
        return;
      }
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) setState(() => _currentLocation = 'Hyderabad');
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        if (mounted) setState(() => _currentLocation = 'Hyderabad');
        return;
      }
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
        timeLimit: const Duration(seconds: 5),
      );
      final placemarks = await geocoding.Geocoding().placemarkFromCoordinates(position.latitude, position.longitude);
      if (placemarks.isNotEmpty && mounted) {
        final p = placemarks.first;
        final locality = p.locality ?? p.subAdministrativeArea ?? 'Hyderabad';
        final subLoc = p.subLocality ?? p.thoroughfare ?? '';
        setState(() {
          _currentLocation = locality;
          _currentSubLocality = subLoc;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _currentLocation = 'Hyderabad');
    }
  }
  
  Future<List<Map<String, dynamic>>> _fetchAds(String placement) async {
    return await supabase.from('ads').select().eq('placement', placement).eq('is_active', true).order('created_at', ascending: false);
  }

  Future<List<Map<String, dynamic>>> _fetchData(String table) async {
    var query = supabase.from(table).select();
    if (table == 'rooms') query = query.eq('is_available', true).neq('tenant_type', 'pg').neq('tenant_type', 'day_wise');
    if (table == 'flatmates') query = query.eq('is_available', true);
    final results = await query.order('created_at', ascending: false).limit(10);
    if (table == 'rooms') {
      return results.where((r) => r['tenant_type'] != 'pg' && r['tenant_type'] != 'day_wise').toList();
    }
    return results;
  }

  Future<List<Map<String, dynamic>>> _fetchRecentRequirements() async {
    final reqs = await supabase.from('requirements').select().order('created_at', ascending: false).limit(2);
    List<Map<String, dynamic>> finalReqs = List<Map<String, dynamic>>.from(reqs);
    if (finalReqs.isNotEmpty) {
      final userIds = finalReqs.map((e) => e['user_id']).where((id) => id != null).toSet().toList();
      if (userIds.isNotEmpty) {
        try {
          final profiles = await supabase.from('profiles').select('id, full_name, avatar_url').inFilter('id', userIds);
          final profileMap = { for (var p in profiles) p['id']: p };
          for (var r in finalReqs) {
            final pid = r['user_id'];
            if (profileMap.containsKey(pid)) {
              r['avatar_url'] = profileMap[pid]?['avatar_url'];
              r['name'] = profileMap[pid]?['full_name'] ?? r['name'];
            }
          }
        } catch (_) {}
      }
    }
    return finalReqs;
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not open $url')));
    }
  }

  Widget _buildHeroHeader() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: const BorderRadius.only(bottomLeft: Radius.circular(24), bottomRight: Radius.circular(24)),
        image: DecorationImage(
          image: const NetworkImage('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(Colors.black.withOpacity(0.6), BlendMode.darken),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Find Your\nPerfect Space in India', style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold, height: 1.2)),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Search rooms, properties, flatmates...',
                border: InputBorder.none,
                icon: Icon(Icons.search, color: Colors.grey),
              ),
              onSubmitted: (val) {
                if (val.isNotEmpty) context.go('/rooms');
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryGrid() {
    final categories = [
      {'icon': Icons.bed_rounded, 'label': 'Rooms', 'route': '/rooms', 'color': const Color(0xFF2563EB), 'bg': const Color(0xFFEFF6FF)},
      {'icon': Icons.people_alt_rounded, 'label': 'Flatmates', 'route': '/flatmates', 'color': const Color(0xFFEA580C), 'bg': const Color(0xFFFFF7ED)},
      {'icon': Icons.apartment_rounded, 'label': 'Properties', 'route': '/flats', 'color': const Color(0xFF059669), 'bg': const Color(0xFFECFDF5)},
      {'icon': Icons.construction_rounded, 'label': 'Build', 'route': '/build', 'color': const Color(0xFFD97706), 'bg': const Color(0xFFF5F3FF)},
      {'icon': Icons.hotel_rounded, 'label': 'PG / Hostel', 'route': '/pgs', 'color': const Color(0xFF7C3AED), 'bg': const Color(0xFFF5F3FF)},
    ];

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: categories.map((cat) {
          return GestureDetector(
            onTap: () => context.go(cat['route'] as String),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 54,
                  height: 54,
                  decoration: BoxDecoration(
                    color: cat['bg'] as Color,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(color: (cat['color'] as Color).withOpacity(0.18), blurRadius: 8, offset: const Offset(0, 3)),
                    ],
                  ),
                  child: Icon(cat['icon'] as IconData, color: cat['color'] as Color, size: 26),
                ),
                const SizedBox(height: 8),
                Text(
                  cat['label'] as String,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 11, color: Color(0xFF1E293B)),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPopularCities() {
    final cities = [
      {'name': 'Hyderabad', 'image': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80'},
      {'name': 'Bengaluru', 'image': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=500&q=80'},
      {'name': 'Mumbai', 'image': 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=500&q=80'},
      {'name': 'Pune', 'image': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80'},
      {'name': 'Chennai', 'image': 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=500&q=80'},
      {'name': 'Delhi', 'image': 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=500&q=80'},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8), child: Text('Popular Cities', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18))),
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: cities.length,
            itemBuilder: (context, index) {
              return GestureDetector(
                onTap: () => context.go('/rooms', extra: cities[index]['name']),
                child: Container(
                  width: 140,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    image: DecorationImage(
                      image: NetworkImage(cities[index]['image']!),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: LinearGradient(
                        colors: [Colors.black.withOpacity(0.6), Colors.transparent],
                        begin: Alignment.bottomCenter,
                        end: Alignment.center,
                      ),
                    ),
                    alignment: Alignment.bottomLeft,
                    padding: const EdgeInsets.all(12),
                    child: Text(cities[index]['name']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFeaturedPGCard(Map<String, dynamic> pg) {
    final images = ImageUtils.parseImages(pg['images']);
    final thumbnailUrl = images.isNotEmpty ? images.first : null;
    final meta = pg['metadata'] ?? {};
    final pgType = meta['pg_type']?.toString() ?? 'PG / Hostel';

    final locParts = [pg['colony'] ?? meta['colony'], pg['locality'] ?? meta['locality'], pg['location'] ?? meta['location'], pg['city'] ?? meta['city']]
        .where((e) => e != null && e.toString().trim().isNotEmpty)
        .map((e) => e.toString().trim().replaceAll(RegExp(r'^,\s*'), ''))
        .where((e) => e.isNotEmpty)
        .toList();
    final locStr = locParts.isNotEmpty ? locParts.take(2).join(', ') : 'Prime Location';

    return Container(
      width: 260,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/pg/${pg['id']}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                SizedBox(
                  height: 145,
                  width: double.infinity,
                  child: thumbnailUrl != null
                      ? SmartImage(imageUrl: thumbnailUrl, fit: BoxFit.cover)
                      : Container(
                          color: const Color(0xFFF1F5F9),
                          child: const Icon(Icons.apartment_rounded, size: 48, color: Color(0xFF94A3B8)),
                        ),
                ),
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withOpacity(0.85),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'PG / HOSTEL',
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
                if (pgType.isNotEmpty && pgType != 'PG / Hostel')
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        pgType.split(' ').first,
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    pg['title'] ?? pgType,
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: const Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: Color(0xFFE11D48)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          locStr,
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF475569),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F3FF),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFDDD6FE), width: 1.1),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '₹${pg['rent'] ?? meta['rent'] ?? 0}',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF6D28D9),
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                              ),
                            ),
                            Text(
                              ' / mo',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF92400E),
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: Text(
                          '0 Brokerage',
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF16A34A),
                            fontWeight: FontWeight.w700,
                            fontSize: 10,
                          ),
                        ),
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

  Widget _buildFeaturedPGList() {
    return SizedBox(
      height: 290,
      child: FutureBuilder<List<Map<String, dynamic>>>(
        future: supabase.from('rooms').select().eq('is_available', true).eq('tenant_type', 'pg').order('created_at', ascending: false).limit(10),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return _buildLoadingSkeleton();
          final data = snapshot.data;
          if (data == null || data.isEmpty) {
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.black12),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.12), shape: BoxShape.circle),
                    child: const Icon(Icons.hotel, color: AppTheme.primary, size: 28),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('Explore PGs & Hostels', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 4),
                        Text('Find verified PGs in top cities', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => context.go('/pgs'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('View All'),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: data.length,
            itemBuilder: (context, index) => _buildFeaturedPGCard(data[index]),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title, VoidCallback onSeeAll) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
          TextButton(
            onPressed: onSeeAll,
            child: Text('See All', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      itemCount: 3,
      itemBuilder: (context, index) => Container(
        width: 260,
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  Widget _buildHorizontalList({required String table, required Widget Function(Map<String, dynamic>) itemBuilder}) {
    return SizedBox(
      height: 290,
      child: FutureBuilder<List<Map<String, dynamic>>>(
        future: _fetchData(table),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) return _buildLoadingSkeleton();
          final data = snapshot.data;
          if (data == null || data.isEmpty) return const Center(child: Text('Nothing available yet.'));
          return ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: data.length,
            itemBuilder: (context, index) => itemBuilder(data[index]),
          );
        },
      ),
    );
  }

  Widget _buildRoomCard(Map<String, dynamic> room) {
    final metadata = room['metadata'] ?? {};
    final thumbnailUrl = ImageUtils.getThumbnail(room);

    final locParts = [room['colony'] ?? metadata['colony'], room['locality'] ?? metadata['locality'], room['location'] ?? metadata['location'], room['city'] ?? metadata['city']]
        .where((e) => e != null && e.toString().trim().isNotEmpty)
        .map((e) => e.toString().trim().replaceAll(RegExp(r'^,\s*'), ''))
        .where((e) => e.isNotEmpty)
        .toList();
    final locStr = locParts.isNotEmpty ? locParts.take(2).join(', ') : 'Prime Location';

    final furnishing = room['furnishing'] ?? metadata['furnishing'] ?? '';
    final roomType = room['bhk_type'] ?? room['room_type'] ?? metadata['bhk_type'] ?? '';

    return Container(
      width: 260,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/room/${room['id']}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                SizedBox(
                  height: 145,
                  width: double.infinity,
                  child: thumbnailUrl != null
                      ? SmartImage(imageUrl: thumbnailUrl, fit: BoxFit.cover)
                      : Container(
                          color: const Color(0xFFF1F5F9),
                          child: const Icon(Icons.home_rounded, size: 48, color: Color(0xFF94A3B8)),
                        ),
                ),
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withOpacity(0.85),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'ROOM',
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
                if (roomType.toString().isNotEmpty || furnishing.toString().isNotEmpty)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        (roomType.toString().isNotEmpty ? roomType : furnishing).toString(),
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    room['title']?.toString() ?? metadata['title']?.toString() ?? 'Room for Rent',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: const Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: Color(0xFFE11D48)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          locStr,
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF475569),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F3FF),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFDDD6FE), width: 1.1),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '₹${room['rent'] ?? metadata['rent'] ?? 0}',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF6D28D9),
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                              ),
                            ),
                            Text(
                              ' / mo',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF92400E),
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: Text(
                          '0 Brokerage',
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF16A34A),
                            fontWeight: FontWeight.w700,
                            fontSize: 10,
                          ),
                        ),
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

  Widget _buildFlatmateCard(Map<String, dynamic> flatmate) {
    final metadata = flatmate['metadata'] ?? {};
    final thumbnailUrl = ImageUtils.getThumbnail(flatmate);

    final locParts = [flatmate['colony'] ?? metadata['colony'], flatmate['locality'] ?? metadata['locality'], flatmate['location'] ?? metadata['location'], flatmate['city'] ?? metadata['city']]
        .where((e) => e != null && e.toString().trim().isNotEmpty)
        .map((e) => e.toString().trim().replaceAll(RegExp(r'^,\s*'), ''))
        .where((e) => e.isNotEmpty)
        .toList();
    final locStr = locParts.isNotEmpty ? locParts.take(2).join(', ') : 'Prime Location';

    final genderPref = flatmate['gender_preference'] ?? metadata['gender_preference'] ?? flatmate['gender'] ?? '';

    return Container(
      width: 260,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/flatmate/${flatmate['id']}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                SizedBox(
                  height: 145,
                  width: double.infinity,
                  child: thumbnailUrl != null
                      ? SmartImage(imageUrl: thumbnailUrl, fit: BoxFit.cover)
                      : Container(
                          color: const Color(0xFFEFF6FF),
                          child: const Icon(Icons.people_alt_rounded, size: 48, color: Color(0xFF3B82F6)),
                        ),
                ),
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withOpacity(0.85),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'FLATMATE',
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
                if (genderPref.toString().isNotEmpty)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        genderPref.toString(),
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    flatmate['title']?.toString() ?? metadata['title']?.toString() ?? 'Looking for Flatmate',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: const Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: Color(0xFFE11D48)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          locStr,
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF475569),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F3FF),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFDDD6FE), width: 1.1),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '₹${flatmate['rent_share'] ?? flatmate['price'] ?? metadata['rent_share'] ?? metadata['price'] ?? 0}',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF6D28D9),
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                              ),
                            ),
                            Text(
                              ' / mo',
                              style: GoogleFonts.outfit(
                                color: const Color(0xFF92400E),
                                fontWeight: FontWeight.w600,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFCBD5E1)),
                        ),
                        child: Text(
                          'Shared Rent',
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF475569),
                            fontWeight: FontWeight.w600,
                            fontSize: 10,
                          ),
                        ),
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

  String _formatFlatPrice(dynamic price) {
    if (price == null) return '₹0';
    double p = 0;
    if (price is int) p = price.toDouble();
    else if (price is double) p = price;
    else if (price is String) p = double.tryParse(price) ?? 0;

    if (p >= 10000000) return '₹${(p / 10000000).toStringAsFixed(2)} Cr';
    if (p >= 100000) return '₹${(p / 100000).toStringAsFixed(2)} L';
    return '₹${p.toStringAsFixed(0)}';
  }

  Widget _buildFlatSaleCard(Map<String, dynamic> flat) {
    final metadata = flat['metadata'] ?? {};

    final locParts = [
      flat['village'] ?? metadata['village'],
      flat['locality'] ?? metadata['locality'],
      flat['area'] ?? metadata['area'],
      flat['city'] ?? metadata['city'],
      flat['district'] ?? metadata['district']
    ]
        .where((e) => e != null && e.toString().trim().isNotEmpty)
        .map((e) => e.toString().trim().replaceAll(RegExp(r'^,\s*'), ''))
        .where((e) => e.isNotEmpty)
        .toList();
    final locStr = locParts.isNotEmpty ? locParts.take(2).join(', ') : 'Prime Location';

    return Container(
      width: 260,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/flat-sale/${flat['id']}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                SizedBox(
                  height: 145,
                  width: double.infinity,
                  child: flat['cover_image'] != null
                      ? SmartImage(imageUrl: flat['cover_image'], fit: BoxFit.cover)
                      : Container(
                          color: const Color(0xFFF1F5F9),
                          child: const Icon(Icons.home_work_rounded, size: 48, color: Color(0xFF94A3B8)),
                        ),
                ),
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withOpacity(0.85),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'FOR SALE',
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
                if (flat['property_type'] != null)
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        flat['property_type'].toString(),
                        style: GoogleFonts.outfit(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    flat['title']?.toString() ?? metadata['title']?.toString() ?? 'Premium Property',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: const Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: Color(0xFFE11D48)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          locStr,
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF475569),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F3FF),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFDDD6FE), width: 1.1),
                        ),
                        child: Text(
                          _formatFlatPrice(flat['expected_price'] ?? flat['price'] ?? metadata['expected_price'] ?? metadata['price']),
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF6D28D9),
                            fontWeight: FontWeight.w800,
                            fontSize: 15,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: Text(
                          'Verified',
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF16A34A),
                            fontWeight: FontWeight.w700,
                            fontSize: 10,
                          ),
                        ),
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

  Widget _buildBuildCard(Map<String, dynamic> buildListing) {
    final subCat = buildListing['sub_category'] ?? 'Service';
    final loc = (buildListing['location_name']?.toString().replaceAll(RegExp(r'^,\s*'), '').trim().isNotEmpty == true)
        ? buildListing['location_name']
        : 'Available';

    return Container(
      width: 260,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/build/detail', extra: buildListing),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                SizedBox(
                  height: 145,
                  width: double.infinity,
                  child: buildListing['image_url'] != null
                      ? SmartImage(imageUrl: buildListing['image_url'], fit: BoxFit.cover)
                      : Container(
                          color: const Color(0xFFF8FAFC),
                          child: const Icon(Icons.handyman_rounded, size: 48, color: Color(0xFF94A3B8)),
                        ),
                ),
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A).withOpacity(0.85),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'BUILD / SERVICE',
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  top: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.primary,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      subCat.toString(),
                      style: GoogleFonts.outfit(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    buildListing['title'] ?? 'Construction Service',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: const Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 14, color: Color(0xFFE11D48)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          loc.toString(),
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF475569),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Verified Pro',
                        style: GoogleFonts.outfit(
                          color: const Color(0xFF6D28D9),
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: const Color(0xFFBFDBFE)),
                        ),
                        child: Text(
                          'Available',
                          style: GoogleFonts.outfit(
                            color: const Color(0xFF2563EB),
                            fontWeight: FontWeight.w700,
                            fontSize: 10,
                          ),
                        ),
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

  Widget _buildItemCard(Map<String, dynamic> item) {
    final thumbnailUrl = ImageUtils.getThumbnail(item);

    return Container(
      width: 190,
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F172A).withOpacity(0.06),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/item/${item['id']}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 120,
              width: double.infinity,
              child: thumbnailUrl != null
                  ? SmartImage(imageUrl: thumbnailUrl, fit: BoxFit.cover)
                  : Container(
                      color: const Color(0xFFF8FAFC),
                      child: const Icon(Icons.shopping_bag_outlined, size: 40, color: Color(0xFF94A3B8)),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['title'] ?? 'Item',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: const Color(0xFF0F172A),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F3FF),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFDDD6FE)),
                    ),
                    child: Text(
                      '₹${item['price'] ?? 0}',
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF6D28D9),
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Color(0xFF0F172A)),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [Color(0xFF0F172A), AppTheme.primary, AppTheme.primaryDark],
                    stops: [0.0, 0.65, 1.0],
                  ).createShader(bounds),
                  child: Text(
                    'TAKEVOLET',
                    style: GoogleFonts.outfit(
                      fontSize: 19,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.1,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppTheme.primary, AppTheme.primaryDark],
                    ),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'INDIA',
                    style: GoogleFonts.outfit(
                      fontSize: 8.5,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 1),
            InkWell(
              onTap: _determinePosition,
              borderRadius: BorderRadius.circular(4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.location_on, color: Color(0xFFE11D48), size: 12),
                  const SizedBox(width: 2),
                  Text(
                    _currentSubLocality.isNotEmpty ? '$_currentSubLocality, $_currentLocation' : _currentLocation,
                    style: GoogleFonts.outfit(
                      fontSize: 11,
                      color: const Color(0xFF475569),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 1),
                  const Icon(Icons.keyboard_arrow_down_rounded, size: 14, color: Color(0xFF64748B)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Stack(children: [
              const Icon(Icons.notifications_none, color: Color(0xFF0F172A)),
              Positioned(right: 0, top: 0, child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle))),
            ]),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen())),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline, color: Color(0xFF0F172A)),
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      drawer: Drawer(
        backgroundColor: Colors.white,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: Colors.white),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Image.asset('assets/images/tvl_real_logo.jpg', height: 50),
                  const SizedBox(height: 12),
                  const Text('Takevolet', style: TextStyle(color: Colors.black, fontSize: 24, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            ListTile(leading: const Icon(Icons.info_outline, color: Colors.black87), title: const Text('About Us', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const AboutScreen())); }),
            ListTile(leading: const Icon(Icons.article_outlined, color: Colors.black87), title: const Text('Articles & Blog', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const ArticlesScreen())); }),
            ListTile(leading: const Icon(Icons.handshake_outlined, color: Colors.black87), title: const Text('Partners', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const PartnersScreen())); }),
            ListTile(leading: const Icon(Icons.contact_support_outlined, color: Colors.black87), title: const Text('Contact Us', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const ContactScreen())); }),
            const Divider(color: Colors.black12),
            ListTile(leading: const Icon(Icons.privacy_tip_outlined, color: Colors.black87), title: const Text('Privacy Policy', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const PrivacyScreen())); }),
            ListTile(leading: const Icon(Icons.gavel_outlined, color: Colors.black87), title: const Text('Terms of Service', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const TermsScreen())); }),
            ListTile(leading: const Icon(Icons.currency_exchange_outlined, color: Colors.black87), title: const Text('Refund Policy', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)), onTap: () { Navigator.pop(context); Navigator.push(context, MaterialPageRoute(builder: (_) => const RefundScreen())); }),
          ],
        ),
      ),
      body: Column(
        children: [
          _buildHeroHeader(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => setState(() {}),
              child: ListView(
                padding: const EdgeInsets.only(bottom: 100),
                children: [
                  _buildCategoryGrid(),
                  _buildPopularCities(),
                  const SizedBox(height: 8),

                  _buildSectionHeader('Featured PGs', () => context.go('/pgs')),
                  _buildFeaturedPGList(),
                  const SizedBox(height: 24),
                  
                  _buildSectionHeader('Featured Rooms', () => context.go('/rooms')),
                  _buildHorizontalList(table: 'rooms', itemBuilder: _buildRoomCard),
                  const SizedBox(height: 24),
                  _buildSectionHeader('Properties for Sale', () => context.go('/flats')),
                  _buildHorizontalList(table: 'property_sales', itemBuilder: _buildFlatSaleCard),
                  const SizedBox(height: 24),
                  _buildSectionHeader('Find Flatmates', () => context.go('/flatmates')),
                  _buildHorizontalList(table: 'flatmates', itemBuilder: _buildFlatmateCard),
                  const SizedBox(height: 24),
                  _buildSectionHeader('Construction & Materials', () => context.go('/build')),
                  _buildHorizontalList(table: 'build_listings', itemBuilder: _buildBuildCard),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentRequirements() {
    return FutureBuilder<List<Map<String, dynamic>>>(
      future: _fetchRecentRequirements(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const SizedBox(height: 100, child: Center(child: CircularProgressIndicator()));
        final reqs = snapshot.data;
        if (reqs == null || reqs.isEmpty) return const Center(child: Text('No recent requirements.'));
        return Column(
          children: reqs.map((req) => _buildReqCard(req)).toList(),
        );
      },
    );
  }

  Widget _buildReqCard(Map<String, dynamic> req) {
    final name = req['name'] ?? 'Unknown';
    final location = req['preferred_locations'] ?? 'Any location';
    final budget = req['budget'] ?? 'Negotiable';
    final description = req['description'] ?? '';
    final createdAtStr = req['created_at'];
    final avatarUrl = req['avatar_url'];
    final roomType = req['room_type'] ?? 'Any';
    
    String timeAgo = '';
    if (createdAtStr != null) {
      try {
        timeAgo = timeago.format(DateTime.parse(createdAtStr));
      } catch (_) {}
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 6)),
        ],
        border: Border.all(color: Colors.grey.shade200, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppTheme.primary.withOpacity(0.15),
                  backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
                  child: avatarUrl == null 
                      ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 16))
                      : null,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      if (timeAgo.isNotEmpty) Text(timeAgo, style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(12)),
                  child: Text('Looking for Room', style: TextStyle(color: Colors.blue.shade700, fontSize: 10, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            if (description.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(description, style: TextStyle(fontSize: 14, color: Colors.grey.shade800), maxLines: 2, overflow: TextOverflow.ellipsis),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _buildSmallTag(Icons.location_on, location, Colors.red),
                _buildSmallTag(Icons.currency_rupee, budget, Colors.green),
                _buildSmallTag(Icons.house_siding, roomType, Colors.purple),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSmallTag(IconData icon, String text, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color.shade700),
          const SizedBox(width: 4),
          Text(text, style: TextStyle(color: color.shade800, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
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
}
