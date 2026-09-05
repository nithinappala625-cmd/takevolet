import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:file_picker/file_picker.dart';
import 'package:go_router/go_router.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../services/r2_storage_service.dart';
import '../../services/watermark_service.dart';
import '../../services/payment_service.dart';
import '../../services/onesignal_service.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../data/locations.dart';

class AddPropertySaleScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;
  const AddPropertySaleScreen({super.key, this.initialData});

  @override
  State<AddPropertySaleScreen> createState() => _AddPropertySaleScreenState();
}

class _AddPropertySaleScreenState extends State<AddPropertySaleScreen> {
  static const _gold = Color(0xFFD4AF37);
  static const _surfaceDark = Color(0xFF1A1A2E);
  static const _cardDark = Color(0xFF16213E);

  int _currentStep = 0;
  bool _isLoading = false;
  Map<String, dynamic>? _pendingPropertyData;

  final List<GlobalKey<FormState>> _formKeys = List.generate(8, (_) => GlobalKey<FormState>());

  // Step 1: Purpose & Category
  String _purpose = 'Sell';
  String _category = 'Apartment / Flat';
  final _categories = [
    'Apartment / Flat', 'Independent House', 'Villa', 'Open Plot',
    'Farm Land', 'Agricultural Land', 'Commercial Shop',
    'Commercial Office', 'Commercial Building', 'Warehouse / Godown',
    'Gated Community Plot', 'Gated Community Villa', 'Industrial Land',
    'Top Project (Verified Builders Only)'
  ];

  // Step 2: Location
  String _state = 'Telangana';
  String _district = TELANGANA_DISTRICTS.first;
  final _mandalController = TextEditingController();
  final _villageController = TextEditingController();
  final _localityController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _mapController = TextEditingController();

  // Step 3: Details (Common & Dynamic)
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  bool _isNegotiable = true;

  // Dynamic Fields Controllers
  final _plotAreaController = TextEditingController();
  String _areaUnits = 'Sq Yards';
  final _plotNumberController = TextEditingController();
  String _facing = 'East';
  bool _isCorner = false;
  final _roadWidthController = TextEditingController();
  bool _boundaryWall = false;
  bool _reraApproved = false;
  bool _hmdaDtcp = false;
  bool _electricity = false;
  bool _water = false;
  bool _drainage = false;
  bool _bankLoan = false;

  final _surveyNumberController = TextEditingController();
  final _soilTypeController = TextEditingController();
  final _waterSourceController = TextEditingController();
  bool _borewell = false;
  final _fencingController = TextEditingController();
  final _roadAccessController = TextEditingController();
  final _cropsController = TextEditingController();
  bool _farmhouse = false;
  final _distanceHighwayController = TextEditingController();

  String _bhk = '2BHK';
  final _floorNumberController = TextEditingController();
  final _totalFloorsController = TextEditingController();
  final _flatSizeController = TextEditingController();
  final _udsController = TextEditingController();
  final _ageController = TextEditingController();
  String _furnishing = 'Unfurnished';
  final _bathroomsController = TextEditingController();
  final _balconyController = TextEditingController();
  bool _powerBackup = false;
  final _monthlyMaintenanceController = TextEditingController();
  String _occupancyStatus = 'Vacant';
  bool _readyToMove = true;

  final _shopAreaController = TextEditingController();
  String _floorType = 'Ground';
  bool _mainRoadFacing = false;
  final _currentRentController = TextEditingController();
  final _expectedRentController = TextEditingController();
  final _suitableForController = TextEditingController();
  final _cabinsController = TextEditingController();
  final _workstationsController = TextEditingController();
  bool _conferenceRoom = false;
  bool _reception = false;
  bool _pantry = false;
  bool _internet = false;
  final _ceilingHeightController = TextEditingController();
  bool _loadingDock = false;
  bool _truckAccess = false;

  // Step 5: Media
  File? _coverImage;
  String? _existingCoverUrl;
  final List<File> _gallery = [];
  List<String> _existingGallery = [];
  File? _documentFile;
  final ImagePicker _picker = ImagePicker();
  final _videoTourController = TextEditingController();

  // Step 6: Documents
  bool _ecAvailable = false;
  bool _titleClear = false;
  bool _readyForRegistration = false;
  final _reraNumberController = TextEditingController();

  // Step 7: Contact
  final _ownerNameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _emailController = TextEditingController();
  String _preferredTime = 'Anytime';
  final _availableFromController = TextEditingController();
  bool _isFeatured = false;
  bool _agreeTerms = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      _titleController.text = widget.initialData!['title'] ?? '';
      final md = widget.initialData!['metadata'] ?? {};
      _plotAreaController.text = md['plot_area']?.toString() ?? widget.initialData!['plot_area']?.toString() ?? '';
      _flatSizeController.text = md['flat_size_sft']?.toString() ?? widget.initialData!['flat_size_sft']?.toString() ?? '';
      _shopAreaController.text = md['shop_area']?.toString() ?? widget.initialData!['shop_area']?.toString() ?? '';
      _descController.text = widget.initialData!['description'] ?? '';
      _priceController.text = widget.initialData!['expected_price']?.toString() ?? '';
    } else {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        _emailController.text = user.email ?? '';
        _mobileController.text = user.phone ?? '';
      }
    }
  }

  Future<ImageSource?> _showImageSourceDialog() async {
    return showDialog<ImageSource>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Select Image Source'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(leading: const Icon(Icons.camera_alt), title: const Text('Camera'), onTap: () => Navigator.pop(ctx, ImageSource.camera)),
            ListTile(leading: const Icon(Icons.photo_library), title: const Text('Gallery'), onTap: () => Navigator.pop(ctx, ImageSource.gallery)),
          ],
        ),
      ),
    );
  }

  Future<void> _pickCoverImage() async {
    final source = await _showImageSourceDialog();
    if (source == null) return;
    final picked = await _picker.pickImage(source: source, imageQuality: 70);
    if (picked != null) {
      final watermarked = await WatermarkService.addWatermark(File(picked.path));
      setState(() => _coverImage = watermarked);
    }
  }

  Future<void> _pickGalleryImages() async {
    final source = await _showImageSourceDialog();
    if (source == null) return;
    
    if (source == ImageSource.camera) {
      final picked = await _picker.pickImage(source: ImageSource.camera, imageQuality: 70);
      if (picked != null) {
        final watermarked = await WatermarkService.addWatermark(File(picked.path));
        setState(() => _gallery.add(watermarked));
      }
    } else {
      final picked = await _picker.pickMultiImage(imageQuality: 70);
      if (picked.isNotEmpty) {
        for (var x in picked.take(20 - _gallery.length)) {
          final watermarked = await WatermarkService.addWatermark(File(x.path));
          setState(() => _gallery.add(watermarked));
        }
      }
    }
  }

  Future<void> _pickDocument() async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx'],
    );
    if (result.isNotEmpty) {
      setState(() => _documentFile = File(result.single.path!));
    }
  }

  File? _selectedVideo;
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

  Future<void> _submitListing() async {
    if (!_agreeTerms) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please agree to the terms.')));
      return;
    }

    setState(() => _isLoading = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) throw 'User not logged in';

      String? coverUrl = _existingCoverUrl;
      if (_coverImage != null) {
        final path = 'properties/${user.id}-${DateTime.now().millisecondsSinceEpoch}-cover.jpg';
        coverUrl = await R2StorageService.uploadFile(_coverImage!, path);
      }

      List<String> imageUrls = List<String>.from(_existingGallery);
      for (int i = 0; i < _gallery.length; i++) {
        final path = 'properties/${user.id}-${DateTime.now().millisecondsSinceEpoch}-$i.jpg';
        imageUrls.add(await R2StorageService.uploadFile(_gallery[i], path));
      }

      String? documentUrl;
      if (_documentFile != null) {
        final path = 'properties/${user.id}-${DateTime.now().millisecondsSinceEpoch}-doc.pdf';
        documentUrl = await R2StorageService.uploadFile(_documentFile!, path);
      }

      String? uploadedVideoUrl;
      if (_selectedVideo != null) {
        final path = 'properties/videos/${user.id}-${DateTime.now().millisecondsSinceEpoch}-vid.mp4';
        uploadedVideoUrl = await R2StorageService.uploadFile(_selectedVideo!, path);
      }

      final propertyData = {
        'user_id': user.id,
        'purpose': _purpose,
        'listing_type': _purpose,          // NOT NULL fix
        'property_category': _category,
        'property_type': _category,        // NOT NULL fix
        'state': _state.isNotEmpty ? _state : 'Telangana',
        'district': _district.isNotEmpty ? _district : 'Hyderabad',
        'city': _district.isNotEmpty ? _district : 'Hyderabad', // NOT NULL fix: city mapped from district
        'locality': _localityController.text.trim().isNotEmpty ? _localityController.text.trim() : _district,
        'mandal': _mandalController.text.trim(),
        'village': _villageController.text.trim(),
        'title': _titleController.text.trim().isNotEmpty ? _titleController.text.trim() : '$_category for ${_purpose == "Sell" ? "Sale" : _purpose}',
        'description': _descController.text.trim().isNotEmpty ? _descController.text.trim() : 'Contact for details',
        'expected_price': int.tryParse(_priceController.text.trim().replaceAll(RegExp(r'[^0-9]'), '')) ?? 0,
        'is_negotiable': _isNegotiable,
        'cover_image': coverUrl,
        'flat_images': imageUrls,
        'video_tour': _videoTourController.text.trim(),
        'video_url': uploadedVideoUrl,
        'document_url': documentUrl,
        'owner_name': _ownerNameController.text.trim(),
        'owner_mobile': _mobileController.text.trim(),
        'owner_whatsapp': _whatsappController.text.trim(),
        'owner_email': _emailController.text.trim(),
        'document_url': documentUrl,
        'area': _plotAreaController.text.trim().isNotEmpty
            ? _plotAreaController.text.trim()
            : _flatSizeController.text.trim().isNotEmpty
                ? _flatSizeController.text.trim()
                : _shopAreaController.text.trim().isNotEmpty
                    ? _shopAreaController.text.trim()
                    : '0', 

        
        'metadata': {
          'plot_area': _plotAreaController.text.trim(),
          'area_units': _areaUnits,
          'plot_number': _plotNumberController.text.trim(),
          'facing': _facing,
          'is_corner_plot': _isCorner,
          'road_width': _roadWidthController.text.trim(),
          'boundary_wall': _boundaryWall,
          'rera_approved': _reraApproved,
          'hmda_dtcp_approved': _hmdaDtcp,
          'electricity_available': _electricity,
          'water_available': _water,
          'drainage_available': _drainage,
          'bank_loan_available': _bankLoan,
          'survey_number': _surveyNumberController.text.trim(),
          'soil_type': _soilTypeController.text.trim(),
          'water_source': _waterSourceController.text.trim(),
          'borewell_available': _borewell,
          'fencing': _fencingController.text.trim(),
          'road_access': _roadAccessController.text.trim(),
          'crops_grown': _cropsController.text.trim(),
          'farmhouse_available': _farmhouse,
          'distance_from_highway': _distanceHighwayController.text.trim(),
          
          'bhk': _bhk,
          'floor_number': _floorNumberController.text.trim(),
          'total_floors': _totalFloorsController.text.trim(),
          'flat_size_sft': _flatSizeController.text.trim(),
          'uds': _udsController.text.trim(),
          'age_of_property': _ageController.text.trim(),
          'bathrooms': _bathroomsController.text.trim(),
          'balcony_count': _balconyController.text.trim(),
          'power_backup': _powerBackup,
          'monthly_maintenance': _monthlyMaintenanceController.text.trim(),
          'occupancy_status': _occupancyStatus,
          
          'shop_area': _shopAreaController.text.trim(),
          'floor_type': _floorType,
          'main_road_facing': _mainRoadFacing,
          'current_rent': _currentRentController.text.trim(),
          'expected_rent': _expectedRentController.text.trim(),
          'suitable_for': _suitableForController.text.trim(),
          'cabins': _cabinsController.text.trim(),
          'workstations': _workstationsController.text.trim(),
          'conference_room': _conferenceRoom,
          'reception': _reception,
          'pantry': _pantry,
          'internet_available': _internet,
          'ceiling_height': _ceilingHeightController.text.trim(),
          'loading_dock': _loadingDock,
          'truck_access': _truckAccess,

          'ec_available': _ecAvailable,
          'title_clear': _titleClear,
          'ready_for_registration': _readyForRegistration,
          'preferred_contact_time': _preferredTime,
          'available_from': _availableFromController.text.trim(),
          'is_featured': _isFeatured,
        }
      };

      // Remove empty strings from optional fields ONLY — never remove critical NOT NULL ones
      const criticalFields = {'user_id', 'listing_type', 'property_type', 'state', 'district', 'city', 'area', 'title', 'description', 'expected_price', 'purpose'};
      propertyData.removeWhere((key, value) => value == '' && !criticalFields.contains(key));

      if (widget.initialData != null) {
        await Supabase.instance.client.from('property_sales').update(propertyData).eq('id', widget.initialData!['id']);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Property Updated Successfully!'), backgroundColor: Colors.green));
          Navigator.pop(context);
        }
      } else {
        final currentUserEmail = Supabase.instance.client.auth.currentUser?.email?.toLowerCase() ?? '';
        if (currentUserEmail == 'nithinappala625@gmail.com' || currentUserEmail == 'nithinappala625@mail.com') {
          propertyData['razorpay_payment_id'] = 'admin_bypass';
          propertyData['expiry_date'] = DateTime.now().add(const Duration(days: 30)).toIso8601String();
          await Supabase.instance.client.from('property_sales').insert(propertyData);
          await _triggerNotifications(propertyData);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Property Listed Successfully!'), backgroundColor: Colors.green));
            Navigator.pop(context);
          }
        } else {
          _pendingPropertyData = propertyData;
          await PaymentService.startRazorpayCheckout(
            amount: 30, // Rs 30 for property listing
            phoneNumber: _mobileController.text,
            email: _emailController.text.isNotEmpty ? _emailController.text : 'user@takevolet.com',
            onSuccess: _handlePaymentSuccess,
            onError: (msg) {
              if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
              setState(() => _isLoading = false);
            }
          );
          return; // wait for payment
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handlePaymentSuccess(PaymentSuccessResponse response) async {
    setState(() => _isLoading = true);
    try {
      if (_pendingPropertyData != null) {
        _pendingPropertyData!['razorpay_payment_id'] = response.paymentId;
        _pendingPropertyData!['expiry_date'] = DateTime.now().add(const Duration(days: 30)).toIso8601String();
        
        await Supabase.instance.client.from('property_sales').insert(_pendingPropertyData!);
        await _triggerNotifications(_pendingPropertyData!);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Property Listed Successfully!'), backgroundColor: Colors.green));
          Navigator.pop(context);
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving after payment: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Text('Sell / Rent Property', style: GoogleFonts.outfit(color: Colors.black)),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: _gold))
        : Theme(
            data: Theme.of(context).copyWith(
              colorScheme: ColorScheme.light(primary: _gold),
            ),
            child: Stepper(
              type: StepperType.vertical,
              physics: const ClampingScrollPhysics(),
              currentStep: _currentStep,
              onStepContinue: () {
                if (_currentStep < 7) {
                  setState(() => _currentStep += 1);
                } else {
                  _submitListing();
                }
              },
              onStepCancel: () {
                if (_currentStep > 0) {
                  setState(() => _currentStep -= 1);
                }
              },
              steps: [
                Step(
                  title: Text('Purpose & Type', style: GoogleFonts.outfit(color: Colors.black)),
                  content: _buildStep1(),
                  isActive: _currentStep >= 0,
                ),
                Step(
                  title: Text('Location', style: GoogleFonts.outfit(color: Colors.black)),
                  content: _buildStep2(),
                  isActive: _currentStep >= 1,
                ),
                Step(
                  title: Text('Property Details', style: GoogleFonts.outfit(color: Colors.black)),
                  content: _buildStep3(),
                  isActive: _currentStep >= 2,
                ),
                Step(
                  title: Text('Amenities & Features', style: GoogleFonts.outfit(color: Colors.black)),
                  content: _buildStep4(),
                  isActive: _currentStep >= 3,
                ),
                Step(
                  title: Text('Photos & Videos', style: GoogleFonts.outfit(color: Colors.black)),
                  content: _buildStep5(),
                  isActive: _currentStep >= 4,
                ),
                Step(
                  title: Text('Documents', style: GoogleFonts.outfit(color: Colors.black)),
                  content: _buildStep6(),
                  isActive: _currentStep >= 5,
                ),
                Step(
                  title: Text('Contact Info', style: GoogleFonts.outfit(color: Colors.black)),
                  content: _buildStep7(),
                  isActive: _currentStep >= 6,
                ),
                Step(
                  title: Text('Preview & Submit', style: GoogleFonts.outfit(color: Colors.black)),
                  content: _buildStep8(),
                  isActive: _currentStep >= 7,
                ),
              ],
            ),
          ),
    );
  }

  Future<void> _triggerNotifications(Map<String, dynamic> propertyData) async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        // In-App Notification
        await Supabase.instance.client.from('notifications').insert({
          'user_id': user.id,
          'title': 'Property Listed',
          'body': 'Your property in ${propertyData['locality']}, ${propertyData['city']} has been successfully listed!',
          'type': 'property',
        });
      }
      
      // Push Notification
      await OneSignalService.sendPushNotification(
        title: 'New Property Listed!',
        message: 'A new property is available in ${propertyData['locality']}, ${propertyData['city']} for ₹${propertyData['expected_price']}.',
      );
    } catch (e) {
      debugPrint('Notification error: $e');
    }
  }

  Widget _buildStep1() {
    return Column(
      children: [
        DropdownButtonFormField<String>(
          value: _purpose,
          decoration: _inputDecoration('Listing Purpose'),
          items: ['Sell', 'Rent / Lease'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: (v) => setState(() => _purpose = v!),
        ),
        const SizedBox(height: 16),
        DropdownButtonFormField<String>(
          value: _category,
          decoration: _inputDecoration('Property Category'),
          items: _categories.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: (v) {
            if (v == 'Top Project (Verified Builders Only)') {
              context.push('/add-top-project');
            } else {
              setState(() => _category = v!);
            }
          },
        ),
      ],
    );
  }

  Widget _buildStep2() {
    return Form(
      key: _formKeys[1],
      child: Column(
        children: [
          DropdownButtonFormField<String>(
            value: _district,
            decoration: _inputDecoration('District'),
            items: TELANGANA_DISTRICTS.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
            onChanged: (v) => setState(() => _district = v!),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _mandalController,
            decoration: _inputDecoration('Mandal'),
            style: const TextStyle(color: Colors.black),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _villageController,
            decoration: _inputDecoration('Village / Municipality'),
            style: const TextStyle(color: Colors.black),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _localityController,
            decoration: _inputDecoration('Locality / Street'),
            style: const TextStyle(color: Colors.black),
          ),
        ],
      ),
    );
  }

  Widget _buildStep3() {
    return Form(
      key: _formKeys[2],
      child: Column(
        children: [
          TextFormField(
            controller: _titleController,
            decoration: _inputDecoration('Property Title'),
            style: const TextStyle(color: Colors.black),
            validator: (v) => v!.isEmpty ? 'Required' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _priceController,
            decoration: _inputDecoration('Price / Rent (₹)'),
            keyboardType: TextInputType.number,
            style: const TextStyle(color: Colors.black),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _descController,
            decoration: _inputDecoration('Property Description'),
            maxLines: 3,
            style: const TextStyle(color: Colors.black),
            validator: (v) => v!.isEmpty ? 'Description is required' : null,
          ),
          const SizedBox(height: 16),
          if (_category.contains('Plot') || _category.contains('Land') || _category.contains('House') || _category.contains('Villa')) ...[
            TextFormField(controller: _plotAreaController, decoration: _inputDecoration('Plot Area (Sq Yards)'), style: const TextStyle(color: Colors.black)),
            const SizedBox(height: 16),
          ],
          if (_category.contains('House') || _category.contains('Villa')) ...[
            TextFormField(controller: _totalFloorsController, decoration: _inputDecoration('Total Floors'), keyboardType: TextInputType.number, style: const TextStyle(color: Colors.black)),
            const SizedBox(height: 16),
          ],
          if (_category.contains('Flat')) ...[
            DropdownButtonFormField<String>(
              value: _bhk,
              decoration: _inputDecoration('BHK Type'),
              items: ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: (v) => setState(() => _bhk = v!),
            ),
            const SizedBox(height: 16),
            TextFormField(controller: _flatSizeController, decoration: _inputDecoration('Built-up Area (Sq Ft)'), style: const TextStyle(color: Colors.black)),
          ],
          if (_category.contains('Warehouse')) ...[
            TextFormField(controller: _ceilingHeightController, decoration: _inputDecoration('Ceiling Height'), style: const TextStyle(color: Colors.black)),
          ]
        ],
      ),
    );
  }

  Widget _buildStep4() {
    return Column(
      children: [
        SwitchListTile(
          title: const Text('Is Negotiable', style: TextStyle(color: Colors.black)),
          activeColor: _gold,
          value: _isNegotiable,
          onChanged: (v) => setState(() => _isNegotiable = v),
        ),
        if (_category.contains('Plot') || _category.contains('Land')) ...[
          SwitchListTile(title: const Text('Boundary Wall', style: TextStyle(color: Colors.black)), activeColor: _gold, value: _boundaryWall, onChanged: (v) => setState(() => _boundaryWall = v)),
          SwitchListTile(title: const Text('HMDA / DTCP Approved', style: TextStyle(color: Colors.black)), activeColor: _gold, value: _hmdaDtcp, onChanged: (v) => setState(() => _hmdaDtcp = v)),
        ],
        if (_category.contains('Flat') || _category.contains('House')) ...[
          SwitchListTile(title: const Text('Power Backup', style: TextStyle(color: Colors.black)), activeColor: _gold, value: _powerBackup, onChanged: (v) => setState(() => _powerBackup = v)),
        ],
        if (_category.contains('Commercial') || _category.contains('Warehouse')) ...[
          SwitchListTile(title: const Text('Truck Access', style: TextStyle(color: Colors.black)), activeColor: _gold, value: _truckAccess, onChanged: (v) => setState(() => _truckAccess = v)),
        ]
      ],
    );
  }

  Widget _buildStep5() {
    return Column(
      children: [
        ListTile(
          title: const Text('Cover Image', style: TextStyle(color: Colors.black)),
          subtitle: Text(_coverImage != null ? 'Selected' : 'Tap to select', style: const TextStyle(color: Colors.grey)),
          trailing: const Icon(Icons.image, color: _gold),
          onTap: _pickCoverImage,
        ),
        ListTile(
          title: const Text('Gallery Images', style: TextStyle(color: Colors.black)),
          subtitle: Text('${_gallery.length} images selected', style: const TextStyle(color: Colors.grey)),
          trailing: const Icon(Icons.photo_library, color: _gold),
          onTap: _pickGalleryImages,
        ),
        ListTile(
          title: const Text('Property Video (Max 50MB)', style: TextStyle(color: Colors.black)),
          subtitle: Text(_selectedVideo != null ? 'Video selected' : 'Tap to select', style: const TextStyle(color: Colors.grey)),
          trailing: const Icon(Icons.videocam, color: _gold),
          onTap: _pickVideo,
        ),
      ],
    );
  }

  Widget _buildStep6() {
    return Column(
      children: [
        ListTile(
          title: const Text('Property Documents (Optional)', style: TextStyle(color: Colors.black)),
          subtitle: Text(_documentFile != null ? 'Document Selected' : 'Upload PDF/DOC (Title deed, EC, etc.)', style: const TextStyle(color: Colors.grey)),
          trailing: const Icon(Icons.picture_as_pdf, color: _gold),
          onTap: _pickDocument,
        ),
        SwitchListTile(title: const Text('Title Clear', style: TextStyle(color: Colors.black)), activeColor: _gold, value: _titleClear, onChanged: (v) => setState(() => _titleClear = v)),
        SwitchListTile(title: const Text('EC Available', style: TextStyle(color: Colors.black)), activeColor: _gold, value: _ecAvailable, onChanged: (v) => setState(() => _ecAvailable = v)),
        SwitchListTile(title: const Text('Bank Loan Available', style: TextStyle(color: Colors.black)), activeColor: _gold, value: _bankLoan, onChanged: (v) => setState(() => _bankLoan = v)),
      ],
    );
  }

  Widget _buildStep7() {
    return Form(
      key: _formKeys[6],
      child: Column(
        children: [
          TextFormField(controller: _mobileController, decoration: _inputDecoration('Mobile Number'), keyboardType: TextInputType.phone, style: const TextStyle(color: Colors.black)),
          const SizedBox(height: 16),
          TextFormField(controller: _emailController, decoration: _inputDecoration('Email Address'), style: const TextStyle(color: Colors.black)),
        ],
      ),
    );
  }

  Widget _buildStep8() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Preview Your Listing', style: GoogleFonts.outfit(color: _gold, fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 10),
        Text('Title: ${_titleController.text}', style: const TextStyle(color: Colors.black)),
        Text('Category: $_category', style: const TextStyle(color: Colors.black)),
        Text('Price: ₹${_priceController.text}', style: const TextStyle(color: Colors.black)),
        Text('Location: ${_district}', style: const TextStyle(color: Colors.black)),
        const SizedBox(height: 20),
        CheckboxListTile(
          title: const Text('I agree to the terms and conditions', style: TextStyle(color: Colors.black)),
          activeColor: _gold,
          value: _agreeTerms,
          onChanged: (v) => setState(() => _agreeTerms = v!),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.grey),
      filled: true,
      fillColor: Colors.grey.shade100,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: _gold),
      ),
    );
  }
}
