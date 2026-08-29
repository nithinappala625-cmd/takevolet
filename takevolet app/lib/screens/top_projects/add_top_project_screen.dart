import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import 'dart:convert';
import '../../services/r2_storage_service.dart';
import '../../services/payment_service.dart';
import '../../services/onesignal_service.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

class AddTopProjectScreen extends StatefulWidget {
  const AddTopProjectScreen({super.key});

  @override
  State<AddTopProjectScreen> createState() => _AddTopProjectScreenState();
}

class _AddTopProjectScreenState extends State<AddTopProjectScreen> {
  static const _gold = Color(0xFFD4AF37);

  int _currentStep = 0;
  bool _isSubmitting = false;

  // ── Step 1: Basic Project Details ──
  final _projectNameController = TextEditingController();
  final _developerNameController = TextEditingController();
  final _reraNumberController = TextEditingController();
  String _projectType = 'Apartment';
  String _projectStatus = 'New Launch';
  final _possessionDateController = TextEditingController();
  final _descriptionController = TextEditingController();
  String _approvalStatus = 'Not Applicable';
  final _approvalNumberController = TextEditingController();
  final _websiteUrlController = TextEditingController();

  // ── Step 2: Location Details ──
  final _stateController = TextEditingController();
  final _cityController = TextEditingController();
  final _localityController = TextEditingController();
  final _fullAddressController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _googleMapsLinkController = TextEditingController();
  final _distanceOrrController = TextEditingController();
  final _distanceMetroController = TextEditingController();
  final _distanceAirportController = TextEditingController();
  final _nearbySchoolsController = TextEditingController();
  final _nearbyHospitalsController = TextEditingController();
  final _nearbyItHubsController = TextEditingController();

  // ── Step 3: Project Size & Construction ──
  final _totalAreaController = TextEditingController();
  final _numTowersController = TextEditingController();
  final _numBlocksController = TextEditingController();
  final _numFloorsController = TextEditingController();
  final _totalUnitsController = TextEditingController();
  final _unitsPerFloorController = TextEditingController();
  final _numBasementsController = TextEditingController();
  final _openSpacePctController = TextEditingController();
  String _constructionTech = 'RCC';

  // ── Step 4: Amenities ──
  final List<String> _allAmenities = [
    'Swimming Pool',
    'Gymnasium',
    'Clubhouse',
    "Children's Play Area",
    'Indoor Games',
    'Jogging Track',
    'Landscaped Gardens',
    'Multipurpose Hall',
    'Tennis Court',
    'Basketball Court',
    'Badminton Court',
    'Cricket Pitch',
    'Yoga/Meditation Room',
    'Library',
    'Co-working Space',
    'Amphitheatre',
    'Mini Theatre',
    'Rainwater Harvesting',
    'Solar Power',
    'EV Charging Stations',
    'Senior Citizen Park',
    'Pet Park',
    'Skating Rink',
    'Squash Court',
    'Rooftop Garden',
    'Sky Lounge',
    'Infinity Pool',
    'Spa & Sauna',
    'Concierge Service',
    'Smart Home Features',
    'CCTV Security',
    '24/7 Security',
    'Power Backup',
    'Water Treatment Plant',
    'Sewage Treatment Plant',
    'Fire Fighting System',
    'Intercom',
    'Visitor Management',
    'Vastu Compliant',
  ];
  final List<String> _selectedAmenities = [];

  // ── Step 5: Unit Configurations ──
  final List<Map<String, dynamic>> _unitConfigurations = [];

  // ── Step 6: Media & Payment ──
  File? _projectLogo;
  File? _coverImage;
  List<File> _additionalPhotos = [];
  File? _brochureFile;
  File? _videoFile;
  final _marketingVideoController = TextEditingController();

  final _imagePicker = ImagePicker();

  @override
  void dispose() {
    _projectNameController.dispose();
    _developerNameController.dispose();
    _reraNumberController.dispose();
    _possessionDateController.dispose();
    _descriptionController.dispose();
    _approvalNumberController.dispose();
    _websiteUrlController.dispose();
    _stateController.dispose();
    _cityController.dispose();
    _localityController.dispose();
    _fullAddressController.dispose();
    _landmarkController.dispose();
    _googleMapsLinkController.dispose();
    _distanceOrrController.dispose();
    _distanceMetroController.dispose();
    _distanceAirportController.dispose();
    _nearbySchoolsController.dispose();
    _nearbyHospitalsController.dispose();
    _nearbyItHubsController.dispose();
    _totalAreaController.dispose();
    _numTowersController.dispose();
    _numBlocksController.dispose();
    _numFloorsController.dispose();
    _totalUnitsController.dispose();
    _unitsPerFloorController.dispose();
    _numBasementsController.dispose();
    _openSpacePctController.dispose();
    _marketingVideoController.dispose();
    super.dispose();
  }

  // ─────────────────── HELPERS ───────────────────

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red),
    );
  }

  void _showSuccess(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.green),
    );
  }

  InputDecoration _inputDecoration(String label, {String? hint}) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      labelStyle: const TextStyle(color: Colors.white70),
      hintStyle: const TextStyle(color: Colors.white38),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: _gold.withOpacity(0.4)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: _gold, width: 1.5),
      ),
      filled: true,
      fillColor: Colors.white.withOpacity(0.05),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }

  Widget _sectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16, top: 8),
      child: Text(
        title,
        style: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: _gold,
        ),
      ),
    );
  }

  // ─────────────────── IMAGE / FILE PICKERS ───────────────────

  Future<void> _pickImage({required bool isLogo}) async {
    final picked = await _imagePicker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
    );
    if (picked != null) {
      setState(() {
        if (isLogo) {
          _projectLogo = File(picked.path);
        } else {
          _coverImage = File(picked.path);
        }
      });
    }
  }

  Future<void> _pickMultipleImages() async {
    final picked = await _imagePicker.pickMultiImage(imageQuality: 80);
    if (picked.isNotEmpty) {
      setState(() {
        _additionalPhotos = picked.map((x) => File(x.path)).toList();
      });
    }
  }

  Future<void> _pickBrochure() async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx'],
    );
    if (result.isNotEmpty && result.single.path != null) {
      setState(() {
        _brochureFile = File(result.single.path!);
      });
    }
  }

  Future<void> _pickVideo() async {
    final result = await FilePicker.pickFiles(type: FileType.video);
    if (result.isNotEmpty && result.single.path != null) {
      setState(() {
        _videoFile = File(result.single.path!);
      });
    }
  }

  // ─────────────────── UNIT CONFIG MANAGEMENT ───────────────────

  void _addUnitConfiguration() {
    setState(() {
      _unitConfigurations.add({
        'unit_type': '2 BHK',
        'facing': 'East',
        'carpet_area': '',
        'buildup_area': '',
        'super_buildup_area': '',
        'starting_price': '',
        'maximum_price': '',
        'price_per_sqft': '',
        'floor_rise_charges': '',
        'plc_charges': '',
        'corner_unit_charges': '',
        'car_parking_charges': '',
        'clubhouse_charges': '',
        'maintenance_charges': '',
        'corpus_fund': '',
        'other_charges': '',
      });
    });
  }

  void _removeUnitConfiguration(int index) {
    setState(() {
      _unitConfigurations.removeAt(index);
    });
  }

  // ─────────────────── PAYMENT & SUBMIT ───────────────────

  Future<void> _submitListingAndPay() async {
    if (_projectNameController.text.isEmpty ||
        _developerNameController.text.isEmpty) {
      _showError('Please fill all mandatory fields');
      return;
    }
    final user = Supabase.instance.client.auth.currentUser;
    final currentUserEmail = user?.email?.toLowerCase() ?? '';
    if (currentUserEmail == 'nithinappala625@gmail.com' ||
        currentUserEmail == 'nithinappala625@mail.com') {
      await _uploadAndInsert('admin_bypass');
    } else {
      await PaymentService.startRazorpayCheckout(
        amount: 200.0,
        phoneNumber: user?.phone ?? '9999999999',
        email: user?.email ?? 'user@example.com',
        onSuccess: _handlePaymentSuccess,
        onError: _showError,
      );
    }
  }

  Future<void> _handlePaymentSuccess(PaymentSuccessResponse response) async {
    await _uploadAndInsert(response.paymentId ?? 'unknown_payment_id');
  }

  Future<void> _uploadAndInsert(String razorpayPaymentId) async {
    setState(() => _isSubmitting = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      final userId = user?.id ?? '';
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      // ── Upload media files ──
      String? logoUrl;
      String? coverUrl;
      List<String> additionalUrls = [];
      String? brochureUrl;
      String? videoUrl;

      if (_projectLogo != null) {
        logoUrl = await R2StorageService.uploadFile(
          _projectLogo!,
          'top_projects/$userId/$timestamp/logo.jpg',
        );
      }

      if (_coverImage != null) {
        coverUrl = await R2StorageService.uploadFile(
          _coverImage!,
          'top_projects/$userId/$timestamp/cover.jpg',
        );
      }

      for (int i = 0; i < _additionalPhotos.length; i++) {
        final url = await R2StorageService.uploadFile(
          _additionalPhotos[i],
          'top_projects/$userId/$timestamp/photo_$i.jpg',
        );
        if (url != null) additionalUrls.add(url);
      }

      if (_brochureFile != null) {
        brochureUrl = await R2StorageService.uploadFile(
          _brochureFile!,
          'top_projects/$userId/$timestamp/brochure.pdf',
        );
      }

      if (_videoFile != null) {
        videoUrl = await R2StorageService.uploadFile(
          _videoFile!,
          'top_projects/$userId/$timestamp/video.mp4',
        );
      }

      // ── Build payload ──
      final Map<String, dynamic> payload = {
        'user_id': userId,
        'status': 'published',
        'payment_status': 'paid',
        'razorpay_payment_id': razorpayPaymentId,
        // Step 1
        'project_name': _projectNameController.text.trim(),
        'developer_name': _developerNameController.text.trim(),
        'developer_rera': _reraNumberController.text.trim(),
        'project_type': _projectType,
        'project_status': _projectStatus,
        'possession_date': _possessionDateController.text.trim(),
        'description': _descriptionController.text.trim(),
        'approval_status': _approvalStatus,
        'approval_number': _approvalNumberController.text.trim(),
        'website_url': _websiteUrlController.text.trim(),
        // Step 2
        'state': _stateController.text.trim(),
        'city': _cityController.text.trim(),
        'locality': _localityController.text.trim(),
        'complete_address': _fullAddressController.text.trim(),
        'landmark': _landmarkController.text.trim(),
        'google_maps_link': _googleMapsLinkController.text.trim(),
        'distance_orr': _distanceOrrController.text.trim(),
        'distance_metro': _distanceMetroController.text.trim(),
        'distance_airport': _distanceAirportController.text.trim(),
        'nearby_schools': _nearbySchoolsController.text.trim(),
        'nearby_hospitals': _nearbyHospitalsController.text.trim(),
        'nearby_it_hubs': _nearbyItHubsController.text.trim(),
        // Step 3
        'total_area_acres': _totalAreaController.text.trim(),
        'num_towers': _numTowersController.text.trim(),
        'num_blocks': _numBlocksController.text.trim(),
        'num_floors': _numFloorsController.text.trim(),
        'total_units': _totalUnitsController.text.trim(),
        'units_per_floor': _unitsPerFloorController.text.trim(),
        'num_basements': _numBasementsController.text.trim(),
        'open_space_pct': _openSpacePctController.text.trim(),
        'construction_tech': _constructionTech,
        // Step 4
        'amenities': _selectedAmenities,
        // Step 5
        'unit_configurations': _unitConfigurations,
        // Step 6
        'project_logo': logoUrl,
        'cover_image': coverUrl,
        'additional_photos': additionalUrls,
        'brochure_url': brochureUrl,
        'video_file_url': videoUrl,
        'marketing_video_link': _marketingVideoController.text.trim(),
        // Expiry
        'expiry_date':
            DateTime.now().add(const Duration(days: 30)).toIso8601String(),
      };

      // Remove null / empty values
      payload.removeWhere((key, value) =>
          value == '' || value == null || (value is List && value.isEmpty));

      // ── Insert into Supabase ──
      await Supabase.instance.client.from('top_projects').insert(payload);

      // ── Notifications ──
      await OneSignalService.sendPushNotification(
        title: 'New Top Project: ${_projectNameController.text.trim()}',
        message:
            'A new premium project in ${_localityController.text.trim()}, ${_cityController.text.trim()}!',
      );
      await OneSignalService.broadcastInAppNotification(
        title: 'New Top Project: ${_projectNameController.text.trim()}',
        body:
            'A new premium project in ${_localityController.text.trim()}, ${_cityController.text.trim()}!',
        type: 'top_project',
      );

      if (!mounted) return;
      _showSuccess('Top Project posted successfully!');
      if(context.canPop()) context.pop();
    } catch (e) {
      _showError('Error: $e');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  // ─────────────────── STEP BUILDERS ───────────────────

  Widget _buildStep1BasicDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader('Basic Project Details'),
        const SizedBox(height: 4),
        TextField(
          controller: _projectNameController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Project Name *'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _developerNameController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Developer / Builder Name *'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _reraNumberController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('RERA Number'),
        ),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          value: _projectType,
          dropdownColor: const Color(0xFF1E1E1E),
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Project Type *'),
          items: const [
            DropdownMenuItem(value: 'Apartment', child: Text('Apartment')),
            DropdownMenuItem(
                value: 'Gated Community', child: Text('Gated Community')),
            DropdownMenuItem(
                value: 'Villa Community', child: Text('Villa Community')),
            DropdownMenuItem(
                value: 'Mixed Development', child: Text('Mixed Development')),
          ],
          onChanged: (val) => setState(() => _projectType = val!),
        ),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          value: _projectStatus,
          dropdownColor: const Color(0xFF1E1E1E),
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Project Status *'),
          items: const [
            DropdownMenuItem(value: 'Pre-Launch', child: Text('Pre-Launch')),
            DropdownMenuItem(value: 'New Launch', child: Text('New Launch')),
            DropdownMenuItem(
                value: 'Under Construction',
                child: Text('Under Construction')),
            DropdownMenuItem(
                value: 'Ready to Move', child: Text('Ready to Move')),
          ],
          onChanged: (val) => setState(() => _projectStatus = val!),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _possessionDateController,
          style: const TextStyle(color: Colors.white),
          decoration:
              _inputDecoration('Possession Date', hint: 'e.g. Dec 2026'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _descriptionController,
          style: const TextStyle(color: Colors.white),
          maxLines: 4,
          decoration: _inputDecoration('Project Description'),
        ),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          value: _approvalStatus,
          dropdownColor: const Color(0xFF1E1E1E),
          style: const TextStyle(color: Colors.white),
          decoration:
              _inputDecoration('RERA / DTCP / HMDA Approval Status'),
          items: const [
            DropdownMenuItem(
                value: 'RERA Approved', child: Text('RERA Approved')),
            DropdownMenuItem(
                value: 'DTCP Approved', child: Text('DTCP Approved')),
            DropdownMenuItem(
                value: 'HMDA Approved', child: Text('HMDA Approved')),
            DropdownMenuItem(
                value: 'Both RERA & HMDA',
                child: Text('Both RERA & HMDA')),
            DropdownMenuItem(
                value: 'Approval Pending',
                child: Text('Approval Pending')),
            DropdownMenuItem(
                value: 'Not Applicable', child: Text('Not Applicable')),
          ],
          onChanged: (val) => setState(() => _approvalStatus = val!),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _approvalNumberController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Approval Number'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _websiteUrlController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Official Website URL'),
        ),
      ],
    );
  }

  Widget _buildStep2LocationDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader('Location Details'),
        const SizedBox(height: 4),
        TextField(
          controller: _stateController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('State *'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _cityController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('City *'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _localityController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Locality / Area *'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _fullAddressController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Full Address'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _landmarkController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Landmark'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _googleMapsLinkController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Google Maps Link'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _distanceOrrController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Distance from ORR'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _distanceMetroController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Distance from Metro Station'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _distanceAirportController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Distance from Airport'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _nearbySchoolsController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Nearby Schools'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _nearbyHospitalsController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Nearby Hospitals'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _nearbyItHubsController,
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Nearby IT Hubs'),
        ),
      ],
    );
  }

  Widget _buildStep3ProjectSize() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader('Project Size & Construction'),
        const SizedBox(height: 4),
        TextField(
          controller: _totalAreaController,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.number,
          decoration: _inputDecoration('Total Project Area in Acres'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _numTowersController,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.number,
          decoration: _inputDecoration('Number of Towers'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _numBlocksController,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.number,
          decoration: _inputDecoration('Number of Blocks'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _numFloorsController,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.number,
          decoration: _inputDecoration('Number of Floors'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _totalUnitsController,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.number,
          decoration: _inputDecoration('Total Number of Units'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _unitsPerFloorController,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.number,
          decoration: _inputDecoration('Units Per Floor'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _numBasementsController,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.number,
          decoration: _inputDecoration('Number of Basements'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: _openSpacePctController,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.number,
          decoration: _inputDecoration('Open Space Percentage'),
        ),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          value: _constructionTech,
          dropdownColor: const Color(0xFF1E1E1E),
          style: const TextStyle(color: Colors.white),
          decoration: _inputDecoration('Construction Technology'),
          items: const [
            DropdownMenuItem(value: 'Mivan', child: Text('Mivan')),
            DropdownMenuItem(value: 'RCC', child: Text('RCC')),
            DropdownMenuItem(value: 'Precast', child: Text('Precast')),
            DropdownMenuItem(value: 'Other', child: Text('Other')),
          ],
          onChanged: (val) => setState(() => _constructionTech = val!),
        ),
      ],
    );
  }

  Widget _buildStep4Amenities() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader('Amenities'),
        const SizedBox(height: 4),
        Wrap(
          spacing: 4,
          runSpacing: 0,
          children: _allAmenities.map((amenity) {
            final selected = _selectedAmenities.contains(amenity);
            return SizedBox(
              width: double.infinity,
              child: CheckboxListTile(
                value: selected,
                activeColor: _gold,
                checkColor: Colors.black,
                title: Text(
                  amenity,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
                controlAffinity: ListTileControlAffinity.leading,
                dense: true,
                contentPadding: EdgeInsets.zero,
                onChanged: (val) {
                  setState(() {
                    if (val == true) {
                      _selectedAmenities.add(amenity);
                    } else {
                      _selectedAmenities.remove(amenity);
                    }
                  });
                },
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildStep5UnitConfigurations() {
    const unitTypes = [
      '1 BHK',
      '2 BHK',
      '2.5 BHK',
      '3 BHK',
      '3.5 BHK',
      '4 BHK',
      '4+ BHK',
      'Duplex',
      'Penthouse',
      'Villa',
      'Plot',
    ];
    const facings = [
      'East',
      'West',
      'North',
      'South',
      'North-East',
      'North-West',
      'South-East',
      'South-West',
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader('Unit Configurations'),
        const SizedBox(height: 4),
        ..._unitConfigurations.asMap().entries.map((entry) {
          final index = entry.key;
          final config = entry.value;
          return Card(
            color: Colors.white.withOpacity(0.06),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Configuration ${index + 1}',
                        style: GoogleFonts.outfit(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: _gold,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.redAccent),
                        onPressed: () => _removeUnitConfiguration(index),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    value: config['unit_type'],
                    dropdownColor: const Color(0xFF1E1E1E),
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDecoration('Unit Type'),
                    items: unitTypes
                        .map((t) =>
                            DropdownMenuItem(value: t, child: Text(t)))
                        .toList(),
                    onChanged: (val) =>
                        setState(() => config['unit_type'] = val),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: config['facing'],
                    dropdownColor: const Color(0xFF1E1E1E),
                    style: const TextStyle(color: Colors.white),
                    decoration: _inputDecoration('Facing'),
                    items: facings
                        .map((f) =>
                            DropdownMenuItem(value: f, child: Text(f)))
                        .toList(),
                    onChanged: (val) =>
                        setState(() => config['facing'] = val),
                  ),
                  const SizedBox(height: 12),
                  _configTextField(config, 'carpet_area', 'Carpet Area Sq.ft',
                      isNumber: true),
                  const SizedBox(height: 12),
                  _configTextField(
                      config, 'buildup_area', 'Built-up Area Sq.ft',
                      isNumber: true),
                  const SizedBox(height: 12),
                  _configTextField(config, 'super_buildup_area',
                      'Super Built-up Area Sq.ft',
                      isNumber: true),
                  const SizedBox(height: 12),
                  _configTextField(
                      config, 'starting_price', 'Starting Price ₹',
                      isNumber: true),
                  const SizedBox(height: 12),
                  _configTextField(
                      config, 'maximum_price', 'Maximum Price ₹',
                      isNumber: true),
                  const SizedBox(height: 12),
                  _configTextField(
                      config, 'price_per_sqft', 'Price Per Sq.ft ₹',
                      isNumber: true),
                  const SizedBox(height: 12),
                  _configTextField(
                      config, 'floor_rise_charges', 'Floor Rise Charges'),
                  const SizedBox(height: 12),
                  _configTextField(config, 'plc_charges', 'PLC Charges'),
                  const SizedBox(height: 12),
                  _configTextField(
                      config, 'corner_unit_charges', 'Corner Unit Charges'),
                  const SizedBox(height: 12),
                  _configTextField(
                      config, 'car_parking_charges', 'Car Parking Charges'),
                  const SizedBox(height: 12),
                  _configTextField(
                      config, 'clubhouse_charges', 'Clubhouse Charges'),
                  const SizedBox(height: 12),
                  _configTextField(
                      config, 'maintenance_charges', 'Maintenance Charges'),
                  const SizedBox(height: 12),
                  _configTextField(config, 'corpus_fund', 'Corpus Fund'),
                  const SizedBox(height: 12),
                  _configTextField(config, 'other_charges', 'Other Charges'),
                ],
              ),
            ),
          );
        }),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _addUnitConfiguration,
            icon: const Icon(Icons.add, color: _gold),
            label: const Text(
              '+ Add Configuration',
              style: TextStyle(color: _gold),
            ),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: _gold),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
      ],
    );
  }

  Widget _configTextField(
      Map<String, dynamic> config, String key, String label,
      {bool isNumber = false}) {
    return TextFormField(
      initialValue: config[key]?.toString() ?? '',
      style: const TextStyle(color: Colors.white),
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      decoration: _inputDecoration(label),
      onChanged: (val) => config[key] = val,
    );
  }

  Widget _buildStep6MediaAndPayment() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader('Media & Payment'),
        const SizedBox(height: 4),

        // Project Logo
        _mediaPickerTile(
          label: 'Project Logo',
          file: _projectLogo,
          onTap: () => _pickImage(isLogo: true),
          icon: Icons.image,
        ),
        const SizedBox(height: 14),

        // Cover Image
        _mediaPickerTile(
          label: 'Cover Image',
          file: _coverImage,
          onTap: () => _pickImage(isLogo: false),
          icon: Icons.photo_library,
        ),
        const SizedBox(height: 14),

        // Additional Photos
        ListTile(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          tileColor: Colors.white.withOpacity(0.05),
          leading: const Icon(Icons.collections, color: _gold),
          title: Text(
            _additionalPhotos.isEmpty
                ? 'Additional Photos'
                : '${_additionalPhotos.length} photo(s) selected',
            style: const TextStyle(color: Colors.white),
          ),
          trailing:
              const Icon(Icons.arrow_forward_ios, color: _gold, size: 16),
          onTap: _pickMultipleImages,
        ),
        const SizedBox(height: 14),

        // Brochure PDF
        _mediaPickerTile(
          label: _brochureFile != null
              ? 'Brochure: ${_brochureFile!.path.split(Platform.pathSeparator).last}'
              : 'Project Brochure (PDF/Doc)',
          file: null,
          onTap: _pickBrochure,
          icon: Icons.picture_as_pdf,
        ),
        const SizedBox(height: 14),

        // Video
        _mediaPickerTile(
          label: _videoFile != null
              ? 'Video: ${_videoFile!.path.split(Platform.pathSeparator).last}'
              : 'Project Video',
          file: null,
          onTap: _pickVideo,
          icon: Icons.videocam,
        ),
        const SizedBox(height: 14),

        // Marketing Video URL
        TextField(
          controller: _marketingVideoController,
          style: const TextStyle(color: Colors.white),
          decoration:
              _inputDecoration('Marketing Video / YouTube URL'),
        ),
        const SizedBox(height: 24),

        // Listing Fee
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _gold.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _gold.withOpacity(0.4)),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Listing Fee',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              Text(
                '₹200',
                style: GoogleFonts.outfit(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: _gold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _mediaPickerTile({
    required String label,
    required File? file,
    required VoidCallback onTap,
    required IconData icon,
  }) {
    return ListTile(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      tileColor: Colors.white.withOpacity(0.05),
      leading: file != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.file(file, width: 48, height: 48, fit: BoxFit.cover),
            )
          : Icon(icon, color: _gold),
      title: Text(label, style: const TextStyle(color: Colors.white)),
      trailing: const Icon(Icons.arrow_forward_ios, color: _gold, size: 16),
      onTap: onTap,
    );
  }

  // ─────────────────── BUILD ───────────────────

  @override
  Widget build(BuildContext context) {
    final steps = <Step>[
      Step(
        title: const Text('Basic Details',
            style: TextStyle(color: Colors.white)),
        content: _buildStep1BasicDetails(),
        isActive: _currentStep >= 0,
        state: _currentStep > 0 ? StepState.complete : StepState.indexed,
      ),
      Step(
        title:
            const Text('Location', style: TextStyle(color: Colors.white)),
        content: _buildStep2LocationDetails(),
        isActive: _currentStep >= 1,
        state: _currentStep > 1 ? StepState.complete : StepState.indexed,
      ),
      Step(
        title: const Text('Size & Construction',
            style: TextStyle(color: Colors.white)),
        content: _buildStep3ProjectSize(),
        isActive: _currentStep >= 2,
        state: _currentStep > 2 ? StepState.complete : StepState.indexed,
      ),
      Step(
        title:
            const Text('Amenities', style: TextStyle(color: Colors.white)),
        content: _buildStep4Amenities(),
        isActive: _currentStep >= 3,
        state: _currentStep > 3 ? StepState.complete : StepState.indexed,
      ),
      Step(
        title: const Text('Unit Configs',
            style: TextStyle(color: Colors.white)),
        content: _buildStep5UnitConfigurations(),
        isActive: _currentStep >= 4,
        state: _currentStep > 4 ? StepState.complete : StepState.indexed,
      ),
      Step(
        title: const Text('Media & Pay',
            style: TextStyle(color: Colors.white)),
        content: _buildStep6MediaAndPayment(),
        isActive: _currentStep >= 5,
        state: _currentStep > 5 ? StepState.complete : StepState.indexed,
      ),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: _gold),
          onPressed: () => context.canPop() ? context.pop() : null,
        ),
        title: Text(
          'Add Top Project',
          style: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: _gold,
          ),
        ),
        centerTitle: true,
      ),
      body: Theme(
        data: Theme.of(context).copyWith(
          colorScheme: Theme.of(context).colorScheme.copyWith(
                primary: _gold,
                onSurface: Colors.white70,
              ),
          canvasColor: const Color(0xFF121212),
        ),
        child: Stepper(
          type: StepperType.vertical,
          currentStep: _currentStep,
          physics: const ClampingScrollPhysics(),
          onStepContinue: () {
            if (_currentStep < steps.length - 1) {
              setState(() => _currentStep++);
            } else {
              _submitListingAndPay();
            }
          },
          onStepCancel: () {
            if (_currentStep > 0) {
              setState(() => _currentStep--);
            }
          },
          onStepTapped: (step) => setState(() => _currentStep = step),
          controlsBuilder: (context, details) {
            final isLastStep = _currentStep == steps.length - 1;
            return Padding(
              padding: const EdgeInsets.only(top: 20),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed:
                          _isSubmitting ? null : details.onStepContinue,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _gold,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isSubmitting
                          ? const SizedBox(
                              width: 22,
                              height: 22,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2.5, color: Colors.black),
                            )
                          : Text(
                              isLastStep ? 'Pay & Submit' : 'Continue',
                              style: GoogleFonts.outfit(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                  if (_currentStep > 0) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: details.onStepCancel,
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: _gold),
                          padding:
                              const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          'Back',
                          style: GoogleFonts.outfit(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: _gold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
          steps: steps,
        ),
      ),
    );
  }
}
