import os

dart_code = """import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:carousel_slider/carousel_slider.dart';
import '../../services/dynamic_forms_service.dart';
import '../shared/dynamic_form_renderer.dart';

class BuildDetailScreen extends StatefulWidget {
  final Map<String, dynamic> listing;

  const BuildDetailScreen({super.key, required this.listing});

  @override
  State<BuildDetailScreen> createState() => _BuildDetailScreenState();
}

class _BuildDetailScreenState extends State<BuildDetailScreen> {
  final _supabase = Supabase.instance.client;
  bool _isWishlisted = false;
  
  @override
  void initState() {
    super.initState();
    _checkWishlist();
  }

  Future<void> _checkWishlist() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;
    
    try {
      final res = await _supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', user.id)
          .eq('listing_id', widget.listing['id'])
          .maybeSingle();
      if (res != null && mounted) {
        setState(() => _isWishlisted = true);
      }
    } catch (_) {}
  }

  Future<void> _toggleWishlist() async {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please login first')));
      return;
    }
    
    try {
      if (_isWishlisted) {
        await _supabase
            .from('wishlists')
            .delete()
            .eq('user_id', user.id)
            .eq('listing_id', widget.listing['id']);
        setState(() => _isWishlisted = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Removed from wishlist')));
      } else {
        await _supabase
            .from('wishlists')
            .insert({
              'user_id': user.id,
              'listing_id': widget.listing['id'],
              'listing_type': 'build'
            });
        setState(() => _isWishlisted = true);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Added to wishlist')));
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    }
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final Uri launchUri = Uri(scheme: 'tel', path: phoneNumber);
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch phone dialer')));
    }
  }

  Future<void> _openWhatsApp(String phoneNumber) async {
    final Uri launchUri = Uri.parse('https://wa.me/$phoneNumber');
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch WhatsApp')));
    }
  }

  void _showBookingSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => _BookingBottomSheet(listing: widget.listing),
    );
  }

  String _findContactNumber(Map<String, dynamic> metadata) {
    if (metadata['contact_number'] != null && metadata['contact_number'].toString().isNotEmpty) return metadata['contact_number'];
    if (metadata['phone'] != null && metadata['phone'].toString().isNotEmpty) return metadata['phone'];
    if (metadata['whatsapp'] != null && metadata['whatsapp'].toString().isNotEmpty) return metadata['whatsapp'];
    if (widget.listing['contact_phone'] != null) return widget.listing['contact_phone'];
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final l = widget.listing;
    final metadata = (l['metadata'] as Map<String, dynamic>?) ?? {};
    final title = l['title'] ?? metadata['title'] ?? 'Listing Details';
    final description = l['description'] ?? metadata['description'] ?? 'No description provided.';
    final price = l['price'] ?? metadata['price'] ?? 0;
    final locationName = l['location_name'] ?? metadata['location'] ?? 'Location not specified';
    final contactNumber = _findContactNumber(metadata);
    
    final List<String> images = (l['media_urls'] as List<dynamic>?)?.cast<String>() ?? [];
    if (images.isEmpty && l['image'] != null) images.add(l['image']);
    if (images.isEmpty && metadata['images'] != null) {
      if (metadata['images'] is List) {
        images.addAll((metadata['images'] as List).cast<String>());
      }
    }
    final hasImages = images.isNotEmpty;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Text(title, style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.black87),
        elevation: 1,
        actions: [
          IconButton(
            icon: Icon(_isWishlisted ? Icons.favorite : Icons.favorite_border, color: _isWishlisted ? Colors.red : Colors.grey),
            onPressed: _toggleWishlist,
          ),
          IconButton(
            icon: const Icon(Icons.share, color: Colors.black87),
            onPressed: () {},
          )
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (hasImages)
              Container(
                color: Colors.white,
                child: CarouselSlider(
                  options: CarouselOptions(
                    height: 280.0,
                    viewportFraction: 1.0,
                    enableInfiniteScroll: images.length > 1,
                    autoPlay: true,
                  ),
                  items: images.map((url) {
                    return Builder(
                      builder: (BuildContext context) {
                        return CachedNetworkImage(
                          imageUrl: url,
                          fit: BoxFit.cover,
                          width: MediaQuery.of(context).size.width,
                          placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                          errorWidget: (context, url, error) => const Icon(Icons.error),
                        );
                      },
                    );
                  }).toList(),
                ),
              ),
            
            // Header Info Card
            Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.black87)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.green.shade200)
                        ),
                        child: Text('₹$price', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green.shade700)),
                      )
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.red, size: 18),
                      const SizedBox(width: 4),
                      Expanded(child: Text(locationName, style: const TextStyle(fontSize: 15, color: Colors.black54))),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _buildTrustBadge(Icons.verified, 'Verified', Colors.blue),
                      const SizedBox(width: 12),
                      if (metadata['experience_years'] != null)
                        _buildTrustBadge(Icons.star, '${metadata['experience_years']} Yrs Exp', Colors.orange),
                      const SizedBox(width: 12),
                      _buildTrustBadge(Icons.thumb_up, 'Top Rated', Colors.green),
                    ],
                  )
                ],
              ),
            ),

            // Dynamic Details Card
            if (metadata.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(16),
                color: Colors.white,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Service Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
                    const SizedBox(height: 16),
                    ...metadata.entries
                      .where((e) => !['title', 'description', 'price', 'location', 'images', 'contact_number'].contains(e.key) && e.value != null && e.value.toString().isNotEmpty)
                      .map((e) {
                         final label = e.key.replaceAll('_', ' ').split(' ').map((s) => s.isNotEmpty ? '${s[0].toUpperCase()}${s.substring(1)}' : '').join(' ');
                         return _buildDetailRow(label, e.value.toString());
                      }).toList(),
                  ],
                ),
              ),

            // Description Card
            Container(
              margin: const EdgeInsets.only(bottom: 100),
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              width: double.infinity,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('About this service', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87)),
                  const SizedBox(height: 12),
                  Text(description, style: const TextStyle(fontSize: 15, height: 1.6, color: Colors.black54)),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4, offset: const Offset(0, -2))],
        ),
        child: SafeArea(
          child: Row(
            children: [
              if (contactNumber.isNotEmpty) ...[
                Expanded(
                  flex: 1,
                  child: ElevatedButton.icon(
                    onPressed: () => _makePhoneCall(contactNumber),
                    icon: const Icon(Icons.call, size: 20),
                    label: const Text('Call'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue.shade600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      elevation: 0,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 1,
                  child: ElevatedButton.icon(
                    onPressed: () => _openWhatsApp(contactNumber),
                    icon: const Icon(Icons.chat, size: 20),
                    label: const Text('WhatsApp', style: TextStyle(fontSize: 13)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      elevation: 0,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                flex: contactNumber.isNotEmpty ? 1 : 2,
                child: ElevatedButton(
                  onPressed: _showBookingSheet,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black87,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    elevation: 0,
                  ),
                  child: const Text('Book Now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTrustBadge(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(text, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 140, child: Text(label, style: const TextStyle(color: Colors.black54, fontSize: 14))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black87, fontSize: 14))),
        ],
      ),
    );
  }
}

class _BookingBottomSheet extends StatefulWidget {
  final Map<String, dynamic> listing;

  const _BookingBottomSheet({required this.listing});

  @override
  State<_BookingBottomSheet> createState() => _BookingBottomSheetState();
}

class _BookingBottomSheetState extends State<_BookingBottomSheet> {
  final _supabase = Supabase.instance.client;
  final _dynamicFormsService = DynamicFormsService();
  
  List<Map<String, dynamic>> _formSchema = [];
  Map<String, dynamic> _formData = {};
  bool _isLoading = true;
  bool _isSubmitting = false;
  bool _confirmLocation = false;

  @override
  void initState() {
    super.initState();
    _fetchSchema();
  }

  Future<void> _fetchSchema() async {
    final schema = await _dynamicFormsService.getFormSchema('booking_form');
    if (mounted) {
      setState(() {
        _formSchema = schema;
        _isLoading = false;
      });
    }
  }

  Future<void> _submitBooking() async {
    if (!_confirmLocation) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please confirm your location')));
      return;
    }

    // Basic required check
    for (var field in _formSchema) {
      if (field['required'] == true && (_formData[field['key']] == null || _formData[field['key']].toString().isEmpty)) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${field['label']} is required')));
        return;
      }
    }

    setState(() => _isSubmitting = true);

    try {
      final user = _supabase.auth.currentUser;
      if (user == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please login first')));
        Navigator.pop(context);
        return;
      }

      await _supabase.from('bookings').insert({
        'user_id': user.id,
        'listing_id': widget.listing['id'],
        'provider_id': widget.listing['user_id'],
        'booking_data': _formData,
        'payment_method': 'COD',
        'status': 'PENDING',
      });
      
      // Note: OneSignal Push Notification trigger goes here or via DB Webhook

      if (mounted) {
        Navigator.pop(context);
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Booking Confirmed! 🎉'),
            content: const Text('Your booking has been placed with Cash on Delivery. The provider will contact you shortly.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK', style: TextStyle(color: Colors.black)))
            ],
          )
        );
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Booking failed: $e')));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.85,
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Complete Booking', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(context))
              ],
            ),
            const Divider(),
            Expanded(
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_formSchema.isEmpty)
                           const Padding(
                             padding: EdgeInsets.all(16.0),
                             child: Text('Please provide your contact details.'),
                           ),
                        DynamicFormRenderer(
                          schema: _formSchema,
                          initialData: _formData,
                          onChange: (key, value) {
                            setState(() {
                              _formData[key] = value;
                            });
                          },
                        ),
                        const SizedBox(height: 20),
                        
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.blue.shade200)),
                          child: Row(
                            children: [
                              Icon(Icons.payments, color: Colors.blue.shade700),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Payment Method', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue.shade900)),
                                    Text('Cash on Delivery (COD) applied automatically.', style: TextStyle(fontSize: 13, color: Colors.blue.shade800)),
                                  ],
                                ),
                              )
                            ],
                          ),
                        ),
                        
                        const SizedBox(height: 16),
                        CheckboxListTile(
                          contentPadding: EdgeInsets.zero,
                          title: const Text('I confirm my location and booking details are correct.', style: TextStyle(fontSize: 14)),
                          value: _confirmLocation,
                          onChanged: (v) => setState(() => _confirmLocation = v ?? false),
                          controlAffinity: ListTileControlAffinity.leading,
                          activeColor: Colors.black,
                        ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
            ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting || _isLoading ? null : _submitBooking,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black87,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: _isSubmitting 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Confirm Booking (COD)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            )
          ],
        ),
      ),
    );
  }
}
"""

with open("takevolet app/lib/screens/build/build_detail_screen.dart", "w", encoding="utf-8") as f:
    f.write(dart_code)

print("Updated build_detail_screen.dart")
