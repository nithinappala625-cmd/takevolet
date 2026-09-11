import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class LegalPartnerDetailScreen extends StatelessWidget {
  final Map<String, dynamic> partner;

  const LegalPartnerDetailScreen({super.key, required this.partner});

  static const Color _gold = Color(0xFF7B3AEC);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Text(partner['business_name'] ?? 'Partner Details', style: GoogleFonts.outfit(color: Colors.black, fontWeight: FontWeight.bold)),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (partner['cover_photo_url'] != null)
              Image.network(partner['cover_photo_url'], height: 200, width: double.infinity, fit: BoxFit.cover)
            else
              Container(height: 200, width: double.infinity, color: Colors.blueGrey[100], child: const Icon(Icons.gavel, size: 80, color: Colors.blueGrey)),
            
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundImage: partner['logo_url'] != null ? NetworkImage(partner['logo_url']) : null,
                        backgroundColor: Colors.grey[200],
                        child: partner['logo_url'] == null ? const Icon(Icons.business, size: 40, color: Colors.grey) : null,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(partner['business_name'] ?? 'Unknown Firm', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
                            Text(partner['category'] ?? 'Legal Services', style: TextStyle(color: _gold, fontWeight: FontWeight.w600, fontSize: 16)),
                            const SizedBox(height: 4),
                            if (partner['years_experience'] != null)
                              Text('${partner['years_experience']} Years of Experience', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 24),
                  const Text('About', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(partner['description'] ?? 'No description provided.', style: const TextStyle(fontSize: 15, color: Colors.black87, height: 1.5)),
                  
                  const SizedBox(height: 24),
                  const Text('Contact Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _buildContactRow(Icons.person, 'Contact Person', partner['contact_person'] ?? 'N/A'),
                  _buildContactRow(Icons.phone, 'Mobile Number', partner['mobile_number'] ?? 'N/A'),
                  _buildContactRow(Icons.phone_android, 'WhatsApp', partner['whatsapp_number'] ?? 'N/A'),
                  _buildContactRow(Icons.email, 'Email', partner['email'] ?? 'N/A'),
                  _buildContactRow(Icons.location_on, 'Office Address', partner['office_address'] ?? 'N/A'),
                  _buildContactRow(Icons.map, 'City/Town', '${partner['city_town'] ?? ''}, ${partner['district'] ?? ''}'),
                  
                  const SizedBox(height: 24),
                  const Text('Service Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  _buildContactRow(Icons.calendar_today, 'Working Days', partner['working_days'] ?? 'N/A'),
                  _buildContactRow(Icons.access_time, 'Working Hours', partner['working_hours'] ?? 'N/A'),
                  _buildContactRow(Icons.local_hospital, 'Emergency Service', partner['emergency_service'] == true ? 'Available' : 'No'),
                  _buildContactRow(Icons.home, 'Home Visit', partner['home_visit_available'] == true ? 'Available' : 'No'),
                  _buildContactRow(Icons.video_call, 'Online Consultation', partner['online_consultation'] == true ? 'Available' : 'No'),
                  
                  const SizedBox(height: 24),
                  const Text('Pricing', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  if (partner['free_consultation'] == true)
                    const Text('🟢 Offers Free Initial Consultation', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                  _buildContactRow(Icons.attach_money, 'Consultation Fee', partner['consultation_fee'] != null ? '₹${partner['consultation_fee']}' : 'N/A'),
                  _buildContactRow(Icons.monetization_on, 'Starting Charges', partner['starting_charges'] != null ? '₹${partner['starting_charges']}' : 'N/A'),
                  
                  const SizedBox(height: 50),
                ],
              ),
            )
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: _gold,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Calling feature coming soon!')));
            },
            icon: const Icon(Icons.phone),
            label: const Text('Call Now', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ),
        ),
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String label, String value) {
    if (value.isEmpty || value == 'N/A' || value == ', ') return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: _gold),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
              ],
            ),
          )
        ],
      ),
    );
  }
}
