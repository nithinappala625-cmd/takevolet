import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'legal_constants.dart';
import 'legal_partner_detail_screen.dart';

class LegalFeedScreen extends StatefulWidget {
  final String category;

  const LegalFeedScreen({super.key, required this.category});

  @override
  State<LegalFeedScreen> createState() => _LegalFeedScreenState();
}

class _LegalFeedScreenState extends State<LegalFeedScreen> {
  static const Color _gold = Color(0xFFD4AF37);
  String _searchQuery = '';
  final _searchCtrl = TextEditingController();

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<List<Map<String, dynamic>>> _fetchLegalPartners() async {
    var query = Supabase.instance.client
        .from('legal_partners')
        .select()
        .eq('status', 'active');

    query = query.eq('category', widget.category);

    if (_searchQuery.isNotEmpty) {
      query = query.or(
          'business_name.ilike.%$_searchQuery%,category.ilike.%$_searchQuery%,city_town.ilike.%$_searchQuery%');
    }

    final response = await query.order('created_at', ascending: false);
    return List<Map<String, dynamic>>.from(response);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F8F8),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Text(widget.category,
            style: GoogleFonts.outfit(
                color: Colors.black,
                fontWeight: FontWeight.bold,
                fontSize: 20)),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Column(
        children: [
          // ── Search Bar ──────────────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search lawyers, deed writers, meeseva...',
                hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
                prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close, size: 18, color: Colors.grey),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
                filled: true,
                fillColor: const Color(0xFFF2F2F2),
                contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30),
                    borderSide: BorderSide.none),
              ),
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
            ),
          ),

          // ── Search Bar ────────────────────────────────────────────────
          Expanded(
            child: FutureBuilder<List<Map<String, dynamic>>>(
              future: _fetchLegalPartners(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                      child: CircularProgressIndicator(color: _gold));
                }
                if (snapshot.hasError) {
                  return Center(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
                    const SizedBox(height: 12),
                    Text('Error loading partners',
                        style: TextStyle(color: Colors.grey[600])),
                  ]));
                }
                final items = snapshot.data ?? [];
                if (items.isEmpty) {
                  return Center(
                      child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                    Icon(Icons.gavel_rounded, size: 64, color: Colors.grey[300]),
                    const SizedBox(height: 16),
                    Text('No legal partners found',
                        style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text('Try a different category or search term',
                        style: TextStyle(color: Colors.grey[400], fontSize: 13)),
                  ]));
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  itemCount: items.length,
                  itemBuilder: (context, index) => _buildLegalCard(items[index]),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ── Legal Partner Card ────────────────────────────────────────────
  Widget _buildLegalCard(Map<String, dynamic> item) {
    final hasCover = item['cover_photo_url'] != null &&
        (item['cover_photo_url'] as String).isNotEmpty;
    final hasLogo = item['logo_url'] != null &&
        (item['logo_url'] as String).isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.07),
              blurRadius: 12,
              offset: const Offset(0, 4)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => Navigator.push(context,
              MaterialPageRoute(builder: (_) => LegalPartnerDetailScreen(partner: item))),
          borderRadius: BorderRadius.circular(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Cover Image ────────────────────────────────────
              if (hasCover)
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  child: Image.network(
                    item['cover_photo_url'],
                    height: 130,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                  ),
                ),

              // ── Card Body ──────────────────────────────────────
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Avatar + Name Row
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Logo
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFFF5F5F5),
                            border: Border.all(color: _gold.withOpacity(0.4), width: 2),
                          ),
                          child: ClipOval(
                            child: hasLogo
                                ? Image.network(item['logo_url'], fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => Icon(Icons.gavel, color: Colors.grey[500], size: 28))
                                : Icon(Icons.gavel, color: Colors.grey[500], size: 28),
                          ),
                        ),
                        const SizedBox(width: 14),
                        // Name + Category
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['business_name'] ?? 'Legal Partner',
                                style: GoogleFonts.outfit(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: _gold.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  item['category'] ?? 'Legal Services',
                                  style: TextStyle(
                                      color: _gold,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 11),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Verified badge
                        if (item['is_verified'] == true)
                          const Icon(Icons.verified, color: Colors.blue, size: 22),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Location
                    Row(children: [
                      Icon(Icons.location_on_outlined, size: 14, color: Colors.grey[500]),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          [
                            item['city_town'] ?? '',
                            item['district'] ?? '',
                          ].where((s) => s.isNotEmpty).join(', '),
                          style: TextStyle(color: Colors.grey[600], fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ]),

                    const SizedBox(height: 8),

                    // Description
                    if ((item['description'] ?? '').toString().isNotEmpty)
                      Text(
                        item['description'],
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: Colors.grey[700], fontSize: 13, height: 1.4),
                      ),

                    const SizedBox(height: 14),

                    // View Profile Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _gold,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          elevation: 0,
                        ),
                        onPressed: () => Navigator.push(context,
                            MaterialPageRoute(
                                builder: (_) => LegalPartnerDetailScreen(partner: item))),
                        icon: const Icon(Icons.person_outline, size: 16),
                        label: const Text('View Profile',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
