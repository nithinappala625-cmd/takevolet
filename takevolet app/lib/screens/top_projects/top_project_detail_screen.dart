import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';

class TopProjectDetailScreen extends StatelessWidget {
  const TopProjectDetailScreen({super.key, required this.project});

  final Map<String, dynamic> project;

  static const _gold = Color(0xFFD4AF37);

  String _val(dynamic v) =>
      (v == null || v.toString().isEmpty) ? '' : v.toString();

  bool _has(dynamic v) => v != null && v.toString().isNotEmpty;

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  List<dynamic> _parseJsonList(dynamic value) {
    if (value == null) return [];
    if (value is List) return value;
    if (value is String) {
      try {
        final decoded = json.decode(value);
        if (decoded is List) return decoded;
      } catch (_) {}
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    final name = _val(project['project_name']);
    final coverImage = _val(project['cover_image']);
    final description = _val(project['description']);
    final amenitiesList = _parseJsonList(project['amenities']);
    final unitConfigs = _parseJsonList(project['unit_configurations']);
    final additionalPhotos = _parseJsonList(project['additional_photos']);

    // Collect action buttons
    final List<_ActionItem> actions = [];
    if (_has(project['brochure_url'])) {
      actions.add(_ActionItem(
          'Download Brochure', Icons.picture_as_pdf, project['brochure_url']));
    }
    if (_has(project['video_file_url'])) {
      actions.add(_ActionItem(
          'Watch Video', Icons.videocam, project['video_file_url']));
    }
    if (_has(project['marketing_video_link'])) {
      actions.add(_ActionItem('Marketing Video', Icons.play_circle_fill,
          project['marketing_video_link']));
    }
    if (_has(project['website_url'])) {
      actions.add(
          _ActionItem('Visit Website', Icons.language, project['website_url']));
    }
    if (_has(project['google_maps_link'])) {
      actions.add(_ActionItem(
          'View on Maps', Icons.map, project['google_maps_link']));
    }

    // Project details rows
    final projectDetails = <_DetailRow>[];
    if (_has(project['developer_name'])) {
      projectDetails
          .add(_DetailRow(Icons.business, 'Developer', _val(project['developer_name'])));
    }
    if (_has(project['project_type'])) {
      projectDetails
          .add(_DetailRow(Icons.category, 'Type', _val(project['project_type'])));
    }
    if (_has(project['project_status'])) {
      projectDetails.add(
          _DetailRow(Icons.info_outline, 'Status', _val(project['project_status'])));
    }
    if (_has(project['possession_date'])) {
      projectDetails.add(_DetailRow(
          Icons.calendar_today, 'Possession', _val(project['possession_date'])));
    }
    if (_has(project['developer_rera'])) {
      projectDetails.add(
          _DetailRow(Icons.verified, 'RERA', _val(project['developer_rera'])));
    }
    if (_has(project['approval_status']) || _has(project['approval_number'])) {
      final approvalParts = <String>[];
      if (_has(project['approval_status'])) {
        approvalParts.add(_val(project['approval_status']));
      }
      if (_has(project['approval_number'])) {
        approvalParts.add(_val(project['approval_number']));
      }
      projectDetails.add(
          _DetailRow(Icons.check_circle, 'Approval', approvalParts.join(' • ')));
    }
    if (_has(project['construction_tech'])) {
      projectDetails.add(_DetailRow(
          Icons.construction, 'Construction', _val(project['construction_tech'])));
    }

    // Location rows
    final locationDetails = <_DetailRow>[];
    if (_has(project['locality'])) {
      locationDetails
          .add(_DetailRow(Icons.location_on, 'Locality', _val(project['locality'])));
    }
    if (_has(project['city'])) {
      locationDetails
          .add(_DetailRow(Icons.location_city, 'City', _val(project['city'])));
    }
    if (_has(project['state'])) {
      locationDetails.add(_DetailRow(Icons.map_outlined, 'State', _val(project['state'])));
    }
    if (_has(project['complete_address'])) {
      locationDetails.add(
          _DetailRow(Icons.home_outlined, 'Address', _val(project['complete_address'])));
    }
    if (_has(project['landmark'])) {
      locationDetails
          .add(_DetailRow(Icons.flag, 'Landmark', _val(project['landmark'])));
    }
    if (_has(project['distance_orr'])) {
      locationDetails.add(
          _DetailRow(Icons.roundabout_left, 'Distance ORR', _val(project['distance_orr'])));
    }
    if (_has(project['distance_metro'])) {
      locationDetails.add(
          _DetailRow(Icons.train, 'Distance Metro', _val(project['distance_metro'])));
    }
    if (_has(project['distance_airport'])) {
      locationDetails.add(_DetailRow(
          Icons.flight, 'Distance Airport', _val(project['distance_airport'])));
    }
    if (_has(project['nearby_schools'])) {
      locationDetails.add(
          _DetailRow(Icons.school, 'Nearby Schools', _val(project['nearby_schools'])));
    }
    if (_has(project['nearby_hospitals'])) {
      locationDetails.add(_DetailRow(
          Icons.local_hospital, 'Nearby Hospitals', _val(project['nearby_hospitals'])));
    }
    if (_has(project['nearby_it_hubs'])) {
      locationDetails.add(
          _DetailRow(Icons.computer, 'Nearby IT Hubs', _val(project['nearby_it_hubs'])));
    }

    // Project size rows
    final sizeDetails = <_DetailRow>[];
    if (_has(project['total_area_acres'])) {
      sizeDetails.add(_DetailRow(
          Icons.square_foot, 'Total Area', '${_val(project['total_area_acres'])} acres'));
    }
    if (_has(project['num_towers'])) {
      sizeDetails.add(
          _DetailRow(Icons.apartment, 'Towers', _val(project['num_towers'])));
    }
    if (_has(project['num_blocks'])) {
      sizeDetails
          .add(_DetailRow(Icons.grid_view, 'Blocks', _val(project['num_blocks'])));
    }
    if (_has(project['num_floors'])) {
      sizeDetails
          .add(_DetailRow(Icons.layers, 'Floors', _val(project['num_floors'])));
    }
    if (_has(project['total_units'])) {
      sizeDetails.add(
          _DetailRow(Icons.door_front_door, 'Total Units', _val(project['total_units'])));
    }
    if (_has(project['units_per_floor'])) {
      sizeDetails.add(_DetailRow(
          Icons.view_module, 'Units/Floor', _val(project['units_per_floor'])));
    }
    if (_has(project['num_basements'])) {
      sizeDetails.add(
          _DetailRow(Icons.garage, 'Basements', _val(project['num_basements'])));
    }
    if (_has(project['open_space_pct'])) {
      sizeDetails.add(_DetailRow(
          Icons.park, 'Open Space', '${_val(project['open_space_pct'])}%'));
    }

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: CustomScrollView(
        slivers: [
          // ── Header with cover image ──
          SliverAppBar(
            expandedHeight: 280,
            pinned: true,
            backgroundColor: const Color(0xFF1E1E1E),
            iconTheme: const IconThemeData(color: Colors.white),
            flexibleSpace: FlexibleSpaceBar(
              title: Text(
                name,
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              background: coverImage.isNotEmpty
                  ? Stack(
                      fit: StackFit.expand,
                      children: [
                        Image.network(
                          coverImage,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            color: Colors.grey[800],
                            child: const Center(
                              child: Icon(Icons.broken_image,
                                  color: Colors.white54, size: 64),
                            ),
                          ),
                        ),
                        const DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Colors.transparent, Colors.black87],
                            ),
                          ),
                        ),
                      ],
                    )
                  : Container(
                      color: Colors.grey[800],
                      child: const Center(
                        child: Icon(Icons.apartment,
                            color: Colors.white38, size: 80),
                      ),
                    ),
            ),
          ),

          // ── Body content ──
          SliverToBoxAdapter(
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── About ──
                  if (description.isNotEmpty) ...[
                    _buildSectionHeader('About'),
                    const SizedBox(height: 8),
                    Text(
                      description,
                      style: const TextStyle(
                          color: Colors.white70, fontSize: 14, height: 1.5),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Project Details ──
                  if (projectDetails.isNotEmpty) ...[
                    _buildSectionHeader('Project Details'),
                    const SizedBox(height: 8),
                    _buildDetailsList(projectDetails),
                    const SizedBox(height: 24),
                  ],

                  // ── Location ──
                  if (locationDetails.isNotEmpty) ...[
                    _buildSectionHeader('Location'),
                    const SizedBox(height: 8),
                    _buildDetailsList(locationDetails),
                    const SizedBox(height: 24),
                  ],

                  // ── Project Size ──
                  if (sizeDetails.isNotEmpty) ...[
                    _buildSectionHeader('Project Size'),
                    const SizedBox(height: 8),
                    _buildDetailsList(sizeDetails),
                    const SizedBox(height: 24),
                  ],

                  // ── Amenities ──
                  if (amenitiesList.isNotEmpty) ...[
                    _buildSectionHeader('Amenities'),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: amenitiesList.map<Widget>((a) {
                        return Chip(
                          label: Text(
                            a.toString(),
                            style: const TextStyle(
                                color: Colors.white, fontSize: 13),
                          ),
                          backgroundColor: const Color(0xFF2A2A2A),
                          side: const BorderSide(color: _gold, width: 0.5),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Unit Configurations ──
                  if (unitConfigs.isNotEmpty) ...[
                    _buildSectionHeader('Unit Configurations'),
                    const SizedBox(height: 8),
                    ...unitConfigs.map<Widget>((config) {
                      final c = config is Map<String, dynamic>
                          ? config
                          : <String, dynamic>{};
                      return _buildUnitConfigCard(c);
                    }),
                    const SizedBox(height: 24),
                  ],

                  // ── Gallery ──
                  if (additionalPhotos.isNotEmpty) ...[
                    _buildSectionHeader('Gallery'),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 200,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: additionalPhotos.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (context, index) {
                          final url = additionalPhotos[index].toString();
                          return ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              url,
                              width: 280,
                              height: 200,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                width: 280,
                                height: 200,
                                color: Colors.grey[800],
                                child: const Center(
                                  child: Icon(Icons.broken_image,
                                      color: Colors.white38, size: 40),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // ── Action Buttons ──
                  if (actions.isNotEmpty) ...[
                    _buildSectionHeader('Links & Resources'),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: actions.map<Widget>((a) {
                        return OutlinedButton.icon(
                          onPressed: () => _openUrl(a.url),
                          icon: Icon(a.icon, size: 18, color: _gold),
                          label: Text(
                            a.label,
                            style: const TextStyle(color: Colors.white),
                          ),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: _gold),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 14, vertical: 10),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),
                  ],

                  // Bottom spacer for the persistent bottom bar
                  const SizedBox(height: 60),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _has(project['dev_contact_person'])
          ? SafeArea(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: const BoxDecoration(
                  color: Color(0xFF1E1E1E),
                  border:
                      Border(top: BorderSide(color: _gold, width: 0.5)),
                ),
                child: SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      final phone = _val(project['dev_contact_person']);
                      final uri = Uri.parse('tel:$phone');
                      launchUrl(uri);
                    },
                    icon: const Icon(Icons.call, color: Colors.black),
                    label: Text(
                      'Contact Builder',
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.black,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _gold,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ),
            )
          : null,
    );
  }

  // ── Section header ──
  Widget _buildSectionHeader(String title) {
    return Row(
      children: [
        Container(width: 4, height: 22, color: _gold),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ],
    );
  }

  // ── Detail list ──
  Widget _buildDetailsList(List<_DetailRow> rows) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: List.generate(rows.length, (i) {
          final row = rows[i];
          return Column(
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(row.icon, size: 20, color: _gold),
                    const SizedBox(width: 12),
                    SizedBox(
                      width: 110,
                      child: Text(
                        row.label,
                        style: const TextStyle(
                            color: Colors.white54, fontSize: 13),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        row.value,
                        style: const TextStyle(
                            color: Colors.white, fontSize: 14),
                      ),
                    ),
                  ],
                ),
              ),
              if (i < rows.length - 1)
                const Divider(
                    color: Colors.white12, height: 1, indent: 46),
            ],
          );
        }),
      ),
    );
  }

  // ── Unit configuration card ──
  Widget _buildUnitConfigCard(Map<String, dynamic> c) {
    final unitType = _val(c['unit_type']);

    final details = <_DetailRow>[];
    if (_has(c['facing'])) {
      details.add(_DetailRow(Icons.explore, 'Facing', _val(c['facing'])));
    }
    if (_has(c['carpet_area'])) {
      details.add(
          _DetailRow(Icons.square_foot, 'Carpet Area', '${_val(c['carpet_area'])} sq.ft'));
    }
    if (_has(c['buildup_area'])) {
      details.add(
          _DetailRow(Icons.square_foot, 'Buildup Area', '${_val(c['buildup_area'])} sq.ft'));
    }
    if (_has(c['super_buildup_area'])) {
      details.add(_DetailRow(
          Icons.square_foot, 'Super Buildup', '${_val(c['super_buildup_area'])} sq.ft'));
    }
    if (_has(c['starting_price'])) {
      details.add(
          _DetailRow(Icons.currency_rupee, 'Starting Price', '₹${_val(c['starting_price'])}'));
    }
    if (_has(c['max_price'])) {
      details.add(
          _DetailRow(Icons.currency_rupee, 'Max Price', '₹${_val(c['max_price'])}'));
    }
    if (_has(c['price_per_sqft'])) {
      details.add(_DetailRow(
          Icons.currency_rupee, 'Price/sq.ft', '₹${_val(c['price_per_sqft'])}'));
    }
    if (_has(c['floor_rise'])) {
      details.add(
          _DetailRow(Icons.trending_up, 'Floor Rise', '₹${_val(c['floor_rise'])}'));
    }
    if (_has(c['plc_charges'])) {
      details.add(
          _DetailRow(Icons.attach_money, 'PLC Charges', '₹${_val(c['plc_charges'])}'));
    }
    if (_has(c['corner_charges'])) {
      details.add(_DetailRow(
          Icons.attach_money, 'Corner Charges', '₹${_val(c['corner_charges'])}'));
    }
    if (_has(c['parking_charges'])) {
      details.add(_DetailRow(
          Icons.local_parking, 'Parking Charges', '₹${_val(c['parking_charges'])}'));
    }
    if (_has(c['clubhouse_charges'])) {
      details.add(_DetailRow(
          Icons.pool, 'Clubhouse Charges', '₹${_val(c['clubhouse_charges'])}'));
    }
    if (_has(c['maintenance_charges'])) {
      details.add(_DetailRow(
          Icons.build, 'Maintenance', '₹${_val(c['maintenance_charges'])}'));
    }
    if (_has(c['corpus_fund'])) {
      details.add(
          _DetailRow(Icons.savings, 'Corpus Fund', '₹${_val(c['corpus_fund'])}'));
    }
    if (_has(c['other_charges'])) {
      details.add(_DetailRow(
          Icons.receipt_long, 'Other Charges', '₹${_val(c['other_charges'])}'));
    }

    if (unitType.isEmpty && details.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _gold.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (unitType.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: _gold.withOpacity(0.15),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(12),
                  topRight: Radius.circular(12),
                ),
              ),
              child: Text(
                unitType,
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: _gold,
                ),
              ),
            ),
          if (details.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Column(
                children: List.generate(details.length, (i) {
                  final row = details[i];
                  return Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(row.icon, size: 18, color: _gold),
                            const SizedBox(width: 10),
                            SizedBox(
                              width: 110,
                              child: Text(
                                row.label,
                                style: const TextStyle(
                                    color: Colors.white54, fontSize: 13),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                row.value,
                                style: const TextStyle(
                                    color: Colors.white, fontSize: 14),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (i < details.length - 1)
                        const Divider(
                            color: Colors.white12, height: 1, indent: 42),
                    ],
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Private helper classes ──
class _DetailRow {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow(this.icon, this.label, this.value);
}

class _ActionItem {
  final String label;
  final IconData icon;
  final String url;

  const _ActionItem(this.label, this.icon, this.url);
}
