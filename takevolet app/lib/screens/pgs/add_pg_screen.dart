import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../main.dart';
import '../../services/onesignal_service.dart';
import '../../services/r2_storage_service.dart';
import '../../data/locations.dart';
import '../../widgets/video_picker_preview.dart';

class AddPgScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;
  const AddPgScreen({super.key, this.initialData});

  @override
  State<AddPgScreen> createState() => _AddPgScreenState();
}

class _AddPgScreenState extends State<AddPgScreen> {
  static const _gold = Color(0xFF7B3AEC);
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _rentController = TextEditingController();
  final _advanceController = TextEditingController();
  final _vacancyController = TextEditingController(text: '1');
  final _customContactController = TextEditingController();

  // Multi-sharing prices
  final _rent1SharingController = TextEditingController();
  final _rent2SharingController = TextEditingController();
  final _rent3SharingController = TextEditingController();
  final _rent4SharingController = TextEditingController();

  File? _videoFile;
  String? _videoUrl;

  String _pgType = 'Mens PG';
  String _sharingType = '1 Sharing (Single)';
  String _bedType = 'Cot with Mattress';
  String _selectedCity = 'Hyderabad';
  String _location = HYDERABAD_AREAS.first;
  String? _colony;
  String? _professionPref;
  List<String> _lifestyleHabits = [];
  List<File> _images = [];
  bool _isLoading = false;

  final _pgTypes = ['Mens PG', 'Womens PG', 'Working Womens PG', 'Girls Hostel', 'Boys Hostel', 'Co-ed PG'];
  final _sharingOptions = ['1 Sharing (Single)', '2 Sharing', '3 Sharing', '4 Sharing', '5 Sharing', '6+ Sharing'];
  final List<String> _amenitiesOptions = [
    'Wi-Fi',
    'Geyser',
    'Luxury PG',
    'AC',
    'Non-AC',
    'Washing Machine',
    'TV',
    'Food Included',
    'Power Backup',
    'CCTV',
    'Daily Housekeeping',
    'Attached Washroom',
    'Furnished',
    'Fridge',
    'Hot Water',
    'Lift',
    'Gym',
    'Study Table',
    'RO Water',
  ];
  final List<String> _selectedAmenities = [];
  final _professions = [
    'Software Engineer',
    'IT Professional',
    'Student',
    'Doctor',
    'Pharmacist',
    'Architect',
    'CA/Finance',
    'Banker',
    'Teacher/Lecturer',
    'Business Owner',
    'Marketing/Sales',
    'Designer',
    'Data Analyst',
    'Other',
    'No Preference',
  ];
  final _lifestyleOptions = [
    'Non-Smoker',
    'Non-Drinker',
    'Vegetarian',
    'Non-Vegetarian',
    'Early Bird',
    'Night Owl',
    'Pet Friendly',
    'Fitness Enthusiast',
    'Neat & Clean',
    'Introvert',
    'Extrovert',
    'WFH Professional',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      final data = widget.initialData!;
      _titleController.text = data['title']?.toString() ?? '';
      _descriptionController.text = data['description']?.toString() ?? '';
      _rentController.text = data['rent_share']?.toString() ?? '';
      _advanceController.text = data['advance_share']?.toString() ?? '';
      _vacancyController.text = data['vacancy_count']?.toString() ?? '1';
      _customContactController.text = data['custom_contact']?.toString() ?? '';

      _pgType = data['pg_type']?.toString() ?? 'Mens PG';
      _sharingType = data['sharing_type']?.toString() ?? '1 Sharing (Single)';
            _bedType = data['bed_type']?.toString() ?? 'Cot with Mattress';
      final am = data['amenities'];
      if (am != null && am is List) {
        _selectedAmenities.addAll(am.map((e) => e.toString()));
      }
      if (AVAILABLE_CITIES.contains(data['city'])) {
        _selectedCity = data['city'];
        List<String> cityAreas = getAreasForCity(_selectedCity);
        if (cityAreas.contains(data['location'])) {
          _location = data['location'];
        } else {
          _location = cityAreas.first;
        }
      } else {
        _selectedCity = 'Hyderabad';
        if (HYDERABAD_AREAS.contains(data['location'])) {
          _location = data['location'];
        }
      }
      _colony = data['colony']?.toString() != ''
          ? data['colony']?.toString()
          : null;
      final metadata = data['metadata'] ?? {};
      final sp = metadata['sharing_prices'] as Map<String, dynamic>?;
      if (sp != null) {
        if (sp['1_sharing'] != null) _rent1SharingController.text = sp['1_sharing'].toString();
        if (sp['2_sharing'] != null) _rent2SharingController.text = sp['2_sharing'].toString();
        if (sp['3_sharing'] != null) _rent3SharingController.text = sp['3_sharing'].toString();
        if (sp['4_sharing'] != null) _rent4SharingController.text = sp['4_sharing'].toString();
      }
      _videoUrl = data['video_url']?.toString() ?? metadata['video_url']?.toString();

      _professionPref =
          metadata['profession_pref']?.toString() ??
          (data['profession_pref']?.toString() != ''
              ? data['profession_pref']?.toString()
              : null);
      if (metadata['lifestyle_habits'] != null) {
        _lifestyleHabits = (metadata['lifestyle_habits'] as List)
            .cast<String>();
      } else if (data['lifestyle_habits'] != null) {
        _lifestyleHabits = (data['lifestyle_habits'] as List).cast<String>();
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _rentController.dispose();
    _advanceController.dispose();
    _vacancyController.dispose();
    _customContactController.dispose();
    _rent1SharingController.dispose();
    _rent2SharingController.dispose();
    _rent3SharingController.dispose();
    _rent4SharingController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage(
      imageQuality: 70,
      maxWidth: 1280,
      maxHeight: 1280,
    );
    if (picked.isNotEmpty) {
      setState(() {
        _images.addAll(picked.map((x) => File(x.path)));
        if (_images.length > 6) _images = _images.sublist(0, 6);
      });
    }
  }

  Future<void> _pickVideo() async {
    final picker = ImagePicker();
    final picked = await picker.pickVideo(
      source: ImageSource.gallery,
      maxDuration: const Duration(minutes: 3),
    );
    if (picked != null) {
      setState(() {
        _videoFile = File(picked.path);
      });
    }
  }

  Future<List<String>> _uploadImages() async {
    final userId = supabase.auth.currentUser!.id;
    final List<String> urls = [];

    for (int i = 0; i < _images.length; i++) {
      final file = _images[i];
      final ext = file.path.split('.').last;
      final path =
          'pgs/$userId/${DateTime.now().millisecondsSinceEpoch}_$i.$ext';

      final url = await R2StorageService.uploadFile(file, path);
      urls.add(url);
    }
    return urls;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final user = supabase.auth.currentUser;
      if (user == null) throw Exception('You must be logged in.');

      List<String> imageUrls = [];
      if (_images.isNotEmpty) {
        imageUrls = await _uploadImages();
      } else if (widget.initialData != null &&
          widget.initialData!['images'] != null) {
        imageUrls = (widget.initialData!['images'] as List).cast<String>();
      }

      String? uploadedVideoUrl = _videoUrl;
      if (_videoFile != null) {
        final userId = user.id;
        final ext = _videoFile!.path.split('.').last;
        final path = 'pgs/$userId/video_${DateTime.now().millisecondsSinceEpoch}.$ext';
        uploadedVideoUrl = await R2StorageService.uploadFile(_videoFile!, path);
      }

      final Map<String, dynamic> sharingPrices = {};
      if (_rent1SharingController.text.trim().isNotEmpty) {
        sharingPrices['1_sharing'] = int.tryParse(_rent1SharingController.text.trim()) ?? 0;
      }
      if (_rent2SharingController.text.trim().isNotEmpty) {
        sharingPrices['2_sharing'] = int.tryParse(_rent2SharingController.text.trim()) ?? 0;
      }
      if (_rent3SharingController.text.trim().isNotEmpty) {
        sharingPrices['3_sharing'] = int.tryParse(_rent3SharingController.text.trim()) ?? 0;
      }
      if (_rent4SharingController.text.trim().isNotEmpty) {
        sharingPrices['4_sharing'] = int.tryParse(_rent4SharingController.text.trim()) ?? 0;
      }

      final pgMetadata = {
        'profession_pref': _professionPref ?? '',
        'lifestyle_habits': _lifestyleHabits,
        'pg_type': _pgType,
        'sharing_type': _sharingType,
        'bed_type': _bedType,
        'amenities': _selectedAmenities,
        'sharing_prices': sharingPrices,
        if (uploadedVideoUrl != null && uploadedVideoUrl.isNotEmpty) 'video_url': uploadedVideoUrl,
        'listing_type': 'pg',
      };

      final int parsedRent = int.tryParse(_rentController.text.trim()) ??
          (sharingPrices['1_sharing'] ??
              sharingPrices['2_sharing'] ??
              sharingPrices['3_sharing'] ??
              sharingPrices['4_sharing'] ??
              5000);

      final pgData = {
        'user_id': user.id,
        'title': _titleController.text.trim().isNotEmpty ? _titleController.text.trim() : '$_pgType in $_location',
        'description': _descriptionController.text.trim(),
        'rent': parsedRent,
        'advance': int.tryParse(_advanceController.text) ?? 5000,
        'location': _location,
        'colony': (_colony != null && _colony!.isNotEmpty) ? _colony! : _location,
        'full_address': '$_location, $_selectedCity',
        'leaving_date': DateTime.now().add(const Duration(days: 365)).toIso8601String(),
        'images': imageUrls,
        if (uploadedVideoUrl != null && uploadedVideoUrl.isNotEmpty) 'video_url': uploadedVideoUrl,
        'is_available': true,
        'city': _selectedCity,
        'tenant_type': 'pg',
        'gender_preference': (_pgType.contains('Women') || _pgType.contains('Girls')) ? 'Female' : ((_pgType.contains('Men') || _pgType.contains('Boys')) ? 'Male' : 'Any'),
        'metadata': pgMetadata,
        if (_customContactController.text.trim().isNotEmpty)
          'custom_contact': _customContactController.text.trim(),
      };

      if (widget.initialData != null) {
        await supabase
            .from('rooms')
            .update(pgData)
            .eq('id', widget.initialData!['id']);
      } else {
        await supabase.from('rooms').insert(pgData);
        try {
          await OneSignalService.sendPushNotification(
            title: 'New PG Listed',
            message:
                'New PG available in $_location, $_selectedCity. Rent share: ₹${pgData['rent_share']}/mo.',
          );
        } catch (e) {
          debugPrint('Push Notification error: $e');
        }

        try {
          await OneSignalService.broadcastInAppNotification(
            title: 'New PG Listed',
            body:
                'New PG available in $_location, $_selectedCity. Rent share: ₹${pgData['rent_share']}/mo.',
            type: 'pg',
          );
        } catch (e) {
          debugPrint('In-App Notification DB error: $e');
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ PG Listed successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        context.go('/pgs');
      }
    } catch (e) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  InputDecoration _inputDeco(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: Colors.grey[700], fontSize: 14),
      prefixIcon: Icon(icon, color: _gold, size: 22),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: Colors.grey[300]!),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _gold, width: 1.5),
      ),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: _gold.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: _gold, size: 22),
                ),
                const SizedBox(width: 14),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            ...children,
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colonies = getColonies(_location, city: _selectedCity);
    final areas = getAreasForCity(_selectedCity);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: Text(
          widget.initialData != null
              ? 'Edit PG / Hostel'
              : 'Post PG / Hostel',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const CircularProgressIndicator(color: _gold),
                  const SizedBox(height: 16),
                  Text(
                    _images.isNotEmpty ? 'Uploading images...' : 'Posting...',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            )
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Image Upload Section
                  _buildSectionCard(
                    title: 'Photos',
                    icon: Icons.photo_library,
                    children: [
                      if (_images.isNotEmpty)
                        SizedBox(
                          height: 100,
                          child: ListView.builder(
                            scrollDirection: Axis.horizontal,
                            itemCount: _images.length,
                            itemBuilder: (_, i) => Stack(
                              children: [
                                Container(
                                  margin: const EdgeInsets.only(right: 8),
                                  width: 100,
                                  height: 100,
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(12),
                                    image: DecorationImage(
                                      image: FileImage(_images[i]),
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                ),
                                Positioned(
                                  top: 2,
                                  right: 10,
                                  child: GestureDetector(
                                    onTap: () =>
                                        setState(() => _images.removeAt(i)),
                                    child: Container(
                                      padding: const EdgeInsets.all(2),
                                      decoration: const BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: Colors.red,
                                      ),
                                      child: const Icon(
                                        Icons.close,
                                        color: Colors.white,
                                        size: 14,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      if (_images.isNotEmpty) const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _images.length < 6 ? _pickImages : null,
                        icon: const Icon(Icons.add_a_photo),
                        label: Text(
                          _images.isEmpty
                              ? 'Add Photos (up to 6)'
                              : 'Add More (${_images.length}/6)',
                        ),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: _gold,
                          side: BorderSide(color: _gold.withOpacity(0.5)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Video Tour Section
                  _buildSectionCard(
                    title: 'Video Tour (Optional)',
                    icon: Icons.videocam,
                    children: [
                      VideoPickerPreview(
                        videoFile: _videoFile,
                        videoUrl: _videoUrl,
                        onPick: _pickVideo,
                        onRemove: () => setState(() {
                          _videoFile = null;
                          _videoUrl = null;
                        }),
                        primaryColor: _gold,
                      ),
                    ],
                  ),

                  // Basic Info
                  _buildSectionCard(
                    title: 'Basic Info',
                    icon: Icons.info_outline,
                    children: [
                      TextFormField(
                        controller: _titleController,
                        decoration: _inputDeco('Title *', Icons.title),
                        validator: (v) => (v == null || v.trim().isEmpty)
                            ? 'Title is required'
                            : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _descriptionController,
                        decoration: _inputDeco('Description', Icons.description)
                            .copyWith(
                              hintText:
                                  'Describe the room, amenities, and what you\'re looking for...',
                            ),
                        maxLines: 4,
                      ),
                    ],
                  ),

                  // Pricing
                  _buildSectionCard(
                    title: 'Pricing & Sharing Tariffs',
                    icon: Icons.currency_rupee,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _rentController,
                              decoration: _inputDeco(
                                'Starting Rent (₹) *',
                                Icons.currency_rupee,
                              ),
                              keyboardType: TextInputType.number,
                              validator: (v) =>
                                  (v == null || v.isEmpty) ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _advanceController,
                              decoration: _inputDeco(
                                'Deposit / Advance (₹)',
                                Icons.account_balance,
                              ),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'Sharing-Wise Tariffs (Optional)',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF475569)),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _rent1SharingController,
                              decoration: _inputDeco('1 Sharing (₹)', Icons.person),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _rent2SharingController,
                              decoration: _inputDeco('2 Sharing (₹)', Icons.people),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _rent3SharingController,
                              decoration: _inputDeco('3 Sharing (₹)', Icons.group),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _rent4SharingController,
                              decoration: _inputDeco('4 Sharing (₹)', Icons.groups),
                              keyboardType: TextInputType.number,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _vacancyController,
                        decoration: _inputDeco('Vacancies', Icons.person_add),
                        keyboardType: TextInputType.number,
                      ),
                    ],
                  ),

                  // Location
                  _buildSectionCard(
                    title: 'Location',
                    icon: Icons.location_on,
                    children: [
                      DropdownButtonFormField<String>(
                        value: _selectedCity,
                        decoration: _inputDeco('City *', Icons.location_city),
                        isExpanded: true,
                        items: AVAILABLE_CITIES
                            .map(
                              (e) => DropdownMenuItem(value: e, child: Text(e)),
                            )
                            .toList(),
                        onChanged: (v) => setState(() {
                          _selectedCity = v!;
                          _location = getAreasForCity(_selectedCity).first;
                          _colony = null;
                        }),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _location,
                        decoration: _inputDeco('Area *', Icons.map),
                        isExpanded: true,
                        items: areas
                            .map(
                              (e) => DropdownMenuItem(value: e, child: Text(e)),
                            )
                            .toList(),
                        onChanged: (v) => setState(() {
                          _location = v!;
                          _colony = null;
                        }),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _colony,
                        decoration: _inputDeco('Colony', Icons.holiday_village),
                        isExpanded: true,
                        items: colonies
                            .map(
                              (e) => DropdownMenuItem(value: e, child: Text(e)),
                            )
                            .toList(),
                        onChanged: (v) => setState(() => _colony = v),
                      ),
                    ],
                  ),

                  _buildSectionCard(
                    title: 'Preferences & Contact',
                    icon: Icons.tune,
                    children: [
                      DropdownButtonFormField<String>(
                        value: _pgType,
                        decoration: _inputDeco('PG Type *', Icons.wc),
                        items: _pgTypes
                            .map(
                              (e) => DropdownMenuItem(value: e, child: Text(e)),
                            )
                            .toList(),
                        onChanged: (v) => setState(() => _pgType = v!),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _sharingType,
                        decoration: _inputDeco('Sharing Type *', Icons.people_alt),
                        items: _sharingOptions
                            .map(
                              (e) => DropdownMenuItem(value: e, child: Text(e)),
                            )
                            .toList(),
                        onChanged: (v) => setState(() => _sharingType = v!),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _professionPref,
                        decoration: _inputDeco(
                          'Profession Preference',
                          Icons.work,
                        ),
                        isExpanded: true,
                        items: _professions
                            .map(
                              (e) => DropdownMenuItem(value: e, child: Text(e)),
                            )
                            .toList(),
                        onChanged: (v) => setState(() => _professionPref = v),
                      ),
                      const SizedBox(height: 14),
                      const Text(
                        'Lifestyle Preferences',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _lifestyleOptions.map((h) {
                          final selected = _lifestyleHabits.contains(h);
                          return FilterChip(
                            label: Text(
                              h,
                              style: TextStyle(
                                fontSize: 12,
                                color: selected ? Colors.white : Colors.black87,
                              ),
                            ),
                            selected: selected,
                            onSelected: (v) => setState(
                              () => v
                                  ? _lifestyleHabits.add(h)
                                  : _lifestyleHabits.remove(h),
                            ),
                            selectedColor: _gold,
                            backgroundColor: Colors.grey[100],
                            checkmarkColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(20),
                            ),
                          );
                        }).toList(),
                      ),
                      if (supabase.auth.currentUser?.email ==
                              'nithinappala625@gmail.com' ||
                          supabase.auth.currentUser?.email ==
                              'nithinpatel2025@gmail.com') ...[
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _customContactController,
                          decoration: _inputDeco(
                            'Custom Contact Number (Admin Only)',
                            Icons.phone,
                          ),
                          keyboardType: TextInputType.phone,
                        ),
                      ],
                    ],
                  ),

                  // Amenities & Facilities Section
                  _buildSectionCard(
                    title: 'Amenities & Facilities',
                    icon: Icons.checklist_rounded,
                    children: [
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _amenitiesOptions.map((amenity) {
                          final isSelected = _selectedAmenities.contains(amenity);
                          return FilterChip(
                            label: Text(
                              amenity,
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w700,
                                color: isSelected ? Colors.white : const Color(0xFF0F172A),
                              ),
                            ),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() {
                                if (selected) {
                                  _selectedAmenities.add(amenity);
                                } else {
                                  _selectedAmenities.remove(amenity);
                                }
                              });
                            },
                            selectedColor: const Color(0xFF7B3AEC),
                            backgroundColor: const Color(0xFFF1F5F9),
                            checkmarkColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                              side: BorderSide(
                                color: isSelected ? const Color(0xFF7B3AEC) : const Color(0xFFCBD5E1),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Submit
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _gold,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 6,
                        shadowColor: _gold.withOpacity(0.4),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.publish, size: 22),
                          const SizedBox(width: 10),
                          Text(
                            widget.initialData != null
                                ? 'Save Changes'
                                : 'Post PG / Hostel',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }
}





