import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../main.dart';
import '../../services/onesignal_service.dart';
import '../../services/r2_storage_service.dart';
import '../../services/watermark_service.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/locations.dart';
import '../../widgets/video_picker_preview.dart';

class AddRoomScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;
  const AddRoomScreen({super.key, this.initialData});

  @override
  State<AddRoomScreen> createState() => _AddRoomScreenState();
}

class _AddRoomScreenState extends State<AddRoomScreen> {
  int _currentStep = 0;
  bool _isLoading = false;

  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _rentController = TextEditingController();
  final _advanceController = TextEditingController();
  final _addressController = TextEditingController();
  final _leavingDateController = TextEditingController(); // REQUIRED
  final _commissionController = TextEditingController(); 
  final _membersController = TextEditingController(text: '1');
  final _customContactController = TextEditingController();
  
  String _tenantType = 'bachelor';
  String _genderPref = 'Any';
  String _furnishing = 'Semi-Furnished';
  String _parking = 'Bike Parking';
  String _selectedCity = 'Hyderabad';
  String _location = HYDERABAD_AREAS.first;
  String? _colony;

  final List<File> _selectedImages = [];
  File? _selectedVideo;
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickVideo() async {
    final picked = await _picker.pickVideo(source: ImageSource.gallery, maxDuration: const Duration(minutes: 5));
    if (picked != null) {
      final file = File(picked.path);
      final sizeMB = await file.length() / (1024 * 1024);
      if (sizeMB > 50) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Video must be under 50MB')));
        return;
      }
      setState(() => _selectedVideo = file);
    }
  }

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      final data = widget.initialData!;
      _titleController.text = data['title']?.toString() ?? '';
      _descController.text = data['description']?.toString() ?? '';
      _rentController.text = data['rent']?.toString() ?? '';
      _advanceController.text = data['advance']?.toString() ?? '';
      _addressController.text = data['full_address']?.toString() ?? '';
      _leavingDateController.text = data['leaving_date']?.toString() ?? '';
      _customContactController.text = data['custom_contact']?.toString() ?? '';
      final metadata = data['metadata'] ?? {};
      
      _commissionController.text = metadata['commission']?.toString() ?? data['commission']?.toString() ?? '';
      _membersController.text = metadata['members_allowed']?.toString() ?? data['members_allowed']?.toString() ?? '1';
      
      final rawTenant = (metadata['tenant_type']?.toString() ?? data['tenant_type']?.toString() ?? 'bachelor').toLowerCase();
      _tenantType = (rawTenant == 'family') ? 'family' : 'bachelor';

      final rawGender = (metadata['gender_preference']?.toString() ?? data['gender_preference']?.toString() ?? 'Any').toLowerCase();
      if (rawGender.contains('fem') || rawGender.contains('girl') || rawGender.contains('women')) {
        _genderPref = 'Female';
      } else if (rawGender.contains('mal') || rawGender.contains('boy') || rawGender.contains('men')) {
        _genderPref = 'Male';
      } else {
        _genderPref = 'Any';
      }

      final rawFurn = metadata['furnishing']?.toString() ?? data['furnishing']?.toString() ?? 'Semi-Furnished';
      if (['Fully-Furnished', 'Semi-Furnished', 'Unfurnished'].contains(rawFurn)) {
        _furnishing = rawFurn;
      } else {
        _furnishing = 'Semi-Furnished';
      }

      final rawPark = metadata['parking']?.toString() ?? data['parking']?.toString() ?? 'Bike Parking';
      if (['Bike Parking', 'Car Parking', 'Both', 'None'].contains(rawPark)) {
        _parking = rawPark;
      } else {
        _parking = 'Bike Parking';
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
      _colony = data['colony']?.toString() != '' ? data['colony']?.toString() : null;
    }
  }

  Future<ImageSource?> _showImageSourceDialog() async {
    return showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'Upload Photos',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Select an option to add photos to your listing',
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  color: const Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () => Navigator.pop(ctx, ImageSource.camera),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F3FF),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFDDD6FE), width: 1.2),
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Color(0xFF7B3AEC), Color(0xFF6D28D9)],
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 24),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Camera',
                              style: GoogleFonts.outfit(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Take a picture',
                              style: GoogleFonts.outfit(
                                fontSize: 11,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: InkWell(
                      onTap: () => Navigator.pop(ctx, ImageSource.gallery),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFBFDBFE), width: 1.2),
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.photo_library_rounded, color: Colors.white, size: 24),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Gallery',
                              style: GoogleFonts.outfit(
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Choose from album',
                              style: GoogleFonts.outfit(
                                fontSize: 11,
                                color: const Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickImages() async {
    final source = await _showImageSourceDialog();
    if (source == null) return;
    
    if (source == ImageSource.camera) {
      final picked = await _picker.pickImage(source: ImageSource.camera, imageQuality: 70, maxWidth: 1280, maxHeight: 1280);
      if (picked != null && _selectedImages.length < 6) {
        final watermarked = await WatermarkService.addWatermark(File(picked.path));
        setState(() => _selectedImages.add(watermarked));
      }
    } else {
      final List<XFile> images = await _picker.pickMultiImage(
        imageQuality: 70,
        maxWidth: 1280,
        maxHeight: 1280,
      );
      if (images.isNotEmpty) {
        final availableSlots = 6 - _selectedImages.length;
        if (availableSlots > 0) {
          for (var x in images.take(availableSlots)) {
            final watermarked = await WatermarkService.addWatermark(File(x.path));
            setState(() => _selectedImages.add(watermarked));
          }
        }
      }
    }
  }

  Future<void> _submitRoom() async {
    setState(() => _isLoading = true);
    try {
      final user = supabase.auth.currentUser;
      if (user == null) throw Exception('You must be logged in to post.');

      List<String> uploadedUrls = [];
      String? uploadedVideoUrl;
      
      try {
        if (_selectedImages.isNotEmpty) {
          for (var file in _selectedImages) {
            final fileName = '${DateTime.now().millisecondsSinceEpoch}_${file.path.split('/').last}';
            final url = await R2StorageService.uploadFile(file, 'Takevolet/rooms/$fileName');
            uploadedUrls.add(url);
          }
        } else if (widget.initialData != null && widget.initialData!['images'] != null) {
          uploadedUrls = (widget.initialData!['images'] as List).cast<String>();
        } else {
          uploadedUrls.add('https://images.unsplash.com/photo-1502690266266-ce3f2824cd16?w=800&q=80');
        }

        if (_selectedVideo != null) {
          final fileName = '${DateTime.now().millisecondsSinceEpoch}_${_selectedVideo!.path.split('/').last}';
          uploadedVideoUrl = await R2StorageService.uploadFile(_selectedVideo!, 'Takevolet/rooms/videos/$fileName');
        } else if (widget.initialData != null && widget.initialData!['video_url'] != null) {
          uploadedVideoUrl = widget.initialData!['video_url'];
        }
      } catch (e) {
        if (widget.initialData != null && widget.initialData!['images'] != null) {
          uploadedUrls = (widget.initialData!['images'] as List).cast<String>();
        } else {
          uploadedUrls = ['https://images.unsplash.com/photo-1502690266266-ce3f2824cd16?w=800&q=80'];
        }
      }

      final metadata = {
        'tenant_type': _tenantType,
        'gender_preference': _genderPref,
        'furnishing': _furnishing,
        'parking': _parking,
        'commission': int.tryParse(_commissionController.text) ?? 500,
        'members_allowed': int.tryParse(_membersController.text) ?? 1,
      };

      final roomData = {
        'user_id': user.id,
        'title': _titleController.text.isNotEmpty ? _titleController.text : 'Premium Room',
        'description': _descController.text,
        'rent': int.tryParse(_rentController.text) ?? 5000,
        'advance': int.tryParse(_advanceController.text) ?? 10000,
        'location': _location,
        'colony': _colony ?? '', 
        'full_address': _addressController.text,
        'leaving_date': _leavingDateController.text.isNotEmpty ? _leavingDateController.text : DateTime.now().add(const Duration(days: 30)).toIso8601String(),
        'images': uploadedUrls,
        'video_url': uploadedVideoUrl,
        'is_available': true,
        'city': _selectedCity,
        'metadata': metadata,
        'custom_contact': _customContactController.text.trim().isNotEmpty ? _customContactController.text.trim() : null,
      };

      if (widget.initialData != null) {
        await supabase.from('rooms').update(roomData).eq('id', widget.initialData!['id']);
      } else {
        await supabase.from('rooms').insert(roomData);
        try {
          await OneSignalService.sendPushNotification(
            title: 'New Room Available',
            message: 'A new room is available in $_location, $_selectedCity for ₹${roomData['rent']}/mo.',
          );
        } catch (e) {
          debugPrint('Push Notification error: $e');
        }

        try {
          await OneSignalService.broadcastInAppNotification(
            title: 'New Room Available',
            body: 'A new room is available in $_location, $_selectedCity for ₹${roomData['rent']}/mo.',
            type: 'room',
          );
        } catch (e) {
          debugPrint('In-App Notification DB error: $e');
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Room posted successfully!')));
        context.go('/home');
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to post: $e')));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  InputDecoration _inputDeco(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: Theme.of(context).colorScheme.primary),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Theme.of(context).colorScheme.primary, width: 2)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colonies = getColonies(_location, city: _selectedCity);
    final areas = getAreasForCity(_selectedCity);

    return Scaffold(
      appBar: AppBar(title: Text(widget.initialData != null ? 'Edit Room' : 'Post a Room')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Theme(
              data: Theme.of(context).copyWith(
                colorScheme: Theme.of(context).colorScheme.copyWith(primary: Theme.of(context).colorScheme.primary),
              ),
              child: Stepper(
                type: StepperType.vertical, // Changed to vertical for more space
                currentStep: _currentStep,
                onStepContinue: () => _currentStep < 3 ? setState(() => _currentStep += 1) : _submitRoom(),
                onStepCancel: () => _currentStep > 0 ? setState(() => _currentStep -= 1) : context.pop(),
                steps: [
                  Step(
                    title: const Text('Basic Details'),
                    isActive: _currentStep >= 0,
                    content: Column(
                      children: [
                        const SizedBox(height: 16),
                        TextField(controller: _titleController, decoration: _inputDeco('Catchy Title', Icons.title)),
                        const SizedBox(height: 16),
                        TextField(controller: _descController, decoration: _inputDeco('Description', Icons.description), maxLines: 3),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(child: TextField(controller: _rentController, decoration: _inputDeco('Rent/Mo', Icons.currency_rupee), keyboardType: TextInputType.number)),
                            const SizedBox(width: 16),
                            Expanded(child: TextField(controller: _advanceController, decoration: _inputDeco('Advance', Icons.account_balance_wallet), keyboardType: TextInputType.number)),
                          ],
                        ),
                        const SizedBox(height: 16),
                        TextField(controller: _commissionController, decoration: _inputDeco('Commission/Reward (₹)', Icons.money), keyboardType: TextInputType.number),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _customContactController,
                          decoration: _inputDeco('Owner Phone Number (Owner / Contact)', Icons.phone_android),
                          keyboardType: TextInputType.phone,
                        ),
                      ],
                    ),
                  ),
                  Step(
                    title: const Text('Filters & Preferences'),
                    isActive: _currentStep >= 1,
                    content: Column(
                      children: [
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          value: _genderPref,
                          decoration: _inputDeco('Gender Preference', Icons.wc),
                          items: ['Any', 'Male', 'Female'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (v) => setState(() => _genderPref = v!),
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          value: _furnishing,
                          decoration: _inputDeco('Furnishing', Icons.chair),
                          items: ['Fully-Furnished', 'Semi-Furnished', 'Unfurnished'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (v) => setState(() => _furnishing = v!),
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          value: _parking,
                          decoration: _inputDeco('Parking', Icons.local_parking),
                          items: ['Bike Parking', 'Car Parking', 'Both', 'None'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (v) => setState(() => _parking = v!),
                        ),
                        const SizedBox(height: 16),
                        TextField(controller: _membersController, decoration: _inputDeco('Members Allowed', Icons.group), keyboardType: TextInputType.number),
                      ],
                    ),
                  ),
                  Step(
                    title: const Text('Location'),
                    isActive: _currentStep >= 2,
                    content: Column(
                      children: [
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          value: _selectedCity,
                          decoration: _inputDeco('City *', Icons.location_city),
                          isExpanded: true,
                          items: AVAILABLE_CITIES.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (v) => setState(() { 
                            _selectedCity = v!; 
                            _location = getAreasForCity(_selectedCity).first;
                            _colony = null; 
                          }),
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          value: _location,
                          decoration: _inputDeco('Area *', Icons.map),
                          isExpanded: true,
                          items: areas.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (v) => setState(() { _location = v!; _colony = null; }),
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          value: _colony,
                          decoration: _inputDeco('Colony', Icons.holiday_village),
                          isExpanded: true,
                          items: colonies.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (v) => setState(() => _colony = v),
                        ),
                        const SizedBox(height: 16),
                        TextField(controller: _addressController, decoration: _inputDeco('Exact Address (Hidden)', Icons.location_on), maxLines: 2),
                        const SizedBox(height: 16),
                        TextField(controller: _leavingDateController, decoration: _inputDeco('Available From (YYYY-MM-DD)', Icons.date_range)), // FIX
                      ],
                    ),
                  ),
                  Step(
                    title: const Text('Photos'),
                    isActive: _currentStep >= 3,
                    content: Column(
                      children: [
                        const SizedBox(height: 16),
                        InkWell(
                          onTap: _pickImages,
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 20),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFCBD5E1), width: 1.5),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF7B3AEC).withValues(alpha: 0.12),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.add_photo_alternate_rounded, size: 28, color: Color(0xFF7B3AEC)),
                                ),
                                const SizedBox(height: 8),
                                const Text('Add Listing Photos', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 13)),
                                const SizedBox(height: 2),
                                const Text('Upload up to 6 high-quality photos', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                              ],
                            ),
                          ),
                        ),
                        if (_selectedImages.isNotEmpty) ...[
                          const SizedBox(height: 14),
                          SizedBox(
                            height: 100,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _selectedImages.length,
                              itemBuilder: (context, index) => Stack(
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.only(right: 10.0),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(10),
                                      child: Image.file(_selectedImages[index], width: 100, height: 100, fit: BoxFit.cover),
                                    ),
                                  ),
                                  Positioned(
                                    top: 4,
                                    right: 14,
                                    child: GestureDetector(
                                      onTap: () => setState(() => _selectedImages.removeAt(index)),
                                      child: Container(
                                        padding: const EdgeInsets.all(3),
                                        decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                        child: const Icon(Icons.close, size: 14, color: Colors.white),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                        const SizedBox(height: 18),
                        VideoPickerPreview(
                          videoFile: _selectedVideo,
                          videoUrl: widget.initialData != null ? widget.initialData!['video_url'] : null,
                          onPick: _pickVideo,
                          onRemove: () => setState(() => _selectedVideo = null),
                          primaryColor: const Color(0xFF7B3AEC),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
