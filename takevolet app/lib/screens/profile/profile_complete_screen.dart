import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import '../../main.dart';
import '../../data/locations.dart';

class ProfileCompleteScreen extends StatefulWidget {
  const ProfileCompleteScreen({super.key});

  @override
  State<ProfileCompleteScreen> createState() => _ProfileCompleteScreenState();
}

class _ProfileCompleteScreenState extends State<ProfileCompleteScreen> {
  // ── Constants ──────────────────────────────────────────────────────────
  static const _gold = Color(0xFFD4AF37);
  static const _goldLight = Color(0xFFF5E6B8);
  static const _goldDark = Color(0xFFB8960C);
  static const _surfaceDark = Color(0xFF1A1A2E);
  static const _cardDark = Color(0xFF16213E);

  static const _professions = [
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
  ];

  // ── Form ───────────────────────────────────────────────────────────────
  final _formKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();

  // Controllers
  final _fullNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _whatsappCtrl = TextEditingController();
  final _ownerNameCtrl = TextEditingController();
  final _ownerPhoneCtrl = TextEditingController();
  final _houseNoCtrl = TextEditingController();

  // Values
  DateTime? _dob;
  String? _gender;
  String? _profession;
  String? _location;
  String? _colony;
  int _membersCount = 1;
  XFile? _aadhaarImage;
  String? _aadhaarPath;

  // State
  bool _isLoading = false;
  bool _isUploadingImage = false;
  int _currentStep = 0;

  final _stepLabels = const [
    'Personal',
    'Contact',
    'Location',
    'KYC',
  ];

  @override
  void initState() {
    super.initState();
    _prefillUserData();
  }

  void _prefillUserData() {
    final user = supabase.auth.currentUser;
    if (user != null) {
      _emailCtrl.text = user.email ?? '';
      final meta = user.userMetadata;
      if (meta != null) {
        _fullNameCtrl.text = meta['full_name'] as String? ??
            meta['name'] as String? ??
            '';
      }
    }
  }

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _whatsappCtrl.dispose();
    _ownerNameCtrl.dispose();
    _ownerPhoneCtrl.dispose();
    _houseNoCtrl.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(now.year - 22),
      firstDate: DateTime(1950),
      lastDate: DateTime(now.year - 16, now.month, now.day),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.dark(
            primary: _gold,
            onPrimary: Colors.black,
            surface: _cardDark,
            onSurface: Colors.white,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _dob = picked);
  }

  Future<void> _pickAadhaarImage() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: _cardDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white24,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Select Aadhaar Photo',
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 20),
              ListTile(
                leading: const Icon(Icons.camera_alt_rounded, color: _gold),
                title: Text('Camera',
                    style: GoogleFonts.outfit(color: Colors.white)),
                onTap: () => Navigator.pop(context, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_rounded, color: _gold),
                title: Text('Gallery',
                    style: GoogleFonts.outfit(color: Colors.white)),
                onTap: () => Navigator.pop(context, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );
    if (source == null) return;

    final image = await picker.pickImage(
      source: source,
      maxWidth: 1200,
      maxHeight: 1200,
      imageQuality: 80,
    );
    if (image != null) {
      setState(() => _aadhaarImage = image);
      await _uploadAadhaarImage(image);
    }
  }

  Future<void> _uploadAadhaarImage(XFile image) async {
    if (_fullNameCtrl.text.trim().isEmpty || _dob == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please fill your Full Name and Date of Birth first before uploading Aadhaar.',
              style: GoogleFonts.outfit()),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
        ),
      );
      setState(() => _aadhaarImage = null);
      return;
    }

    setState(() => _isUploadingImage = true);
    try {
      final inputImage = InputImage.fromFilePath(image.path);
      final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
      final RecognizedText recognizedText = await textRecognizer.processImage(inputImage);
      final String text = recognizedText.text.toLowerCase();
      
      final bool hasAadhaarNumber = RegExp(r'\d{4}\s?\d{4}\s?\d{4}').hasMatch(text);
      final String dobYear = _dob!.year.toString();
      final bool hasDob = text.contains(dobYear);

      textRecognizer.close();

      if (!hasAadhaarNumber || !hasDob) {
        throw Exception('Rejected: Document does not appear to be a valid Aadhaar. Ensure the photo is clear and contains your Aadhaar Number and Date of Birth.');
      }

      final userId = supabase.auth.currentUser!.id;
      final ext = image.path.split('.').last;
      final filePath = '$userId/aadhaar_${DateTime.now().millisecondsSinceEpoch}.$ext';

      await supabase.storage.from('kyc-docs').upload(
            filePath,
            File(image.path),
          );

      setState(() => _aadhaarPath = filePath);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Aadhaar verified and uploaded successfully',
                style: GoogleFonts.outfit()),
            backgroundColor: Colors.green.shade700,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      setState(() => _aadhaarImage = null);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', ''),
                style: GoogleFonts.outfit()),
            backgroundColor: Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploadingImage = false);
    }
  }

  String _formatDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  // ── Submit ─────────────────────────────────────────────────────────────

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please fill all required fields',
              style: GoogleFonts.outfit()),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }
    if (_dob == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please select your date of birth',
              style: GoogleFonts.outfit()),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      await supabase.from('profiles').upsert({
        'id': supabase.auth.currentUser!.id,
        'full_name': _fullNameCtrl.text.trim(),
        'email': supabase.auth.currentUser!.email,
        'dob': _dob!.toIso8601String().split('T').first,
        'phone': _phoneCtrl.text.trim(),
        'whatsapp': _whatsappCtrl.text.trim(),
        'gender': _gender,
        'profession': _profession,
        'owner_name': _ownerNameCtrl.text.trim(),
        'owner_phone': _ownerPhoneCtrl.text.trim(),
        'members_count': _membersCount,
        'location': _location,
        'colony': _colony,
        'house_no': _houseNoCtrl.text.trim(),
        'aadhaar_url': _aadhaarPath,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 12),
                Text('Profile saved successfully!',
                    style: GoogleFonts.outfit(fontWeight: FontWeight.w500)),
              ],
            ),
            backgroundColor: Colors.green.shade700,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            duration: const Duration(seconds: 3),
          ),
        );
        context.go('/profile');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Something went wrong. Please try again.\n${e.toString()}',
                style: GoogleFonts.outfit()),
            backgroundColor: Colors.red.shade700,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _surfaceDark,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(),
            _buildStepIndicator(),
            Expanded(
              child: Form(
                key: _formKey,
                child: ListView(
                  controller: _scrollController,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  children: [
                    _buildSectionCard(
                      index: 0,
                      icon: Icons.person_rounded,
                      title: 'Personal Information',
                      children: _personalFields(),
                    ),
                    const SizedBox(height: 16),
                    _buildSectionCard(
                      index: 1,
                      icon: Icons.phone_rounded,
                      title: 'Contact Details',
                      children: _contactFields(),
                    ),
                    const SizedBox(height: 16),
                    _buildSectionCard(
                      index: 2,
                      icon: Icons.location_on_rounded,
                      title: 'Location & Housing',
                      children: _locationFields(),
                    ),
                    const SizedBox(height: 16),
                    _buildSectionCard(
                      index: 3,
                      icon: Icons.verified_user_rounded,
                      title: 'KYC Verification',
                      children: _kycFields(),
                    ),
                    const SizedBox(height: 24),
                    _buildSubmitButton(),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── App Bar ────────────────────────────────────────────────────────────

  Widget _buildAppBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          InkWell(
            onTap: () => context.pop(),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white10),
              ),
              child: const Icon(Icons.arrow_back_ios_new_rounded,
                  color: Colors.white, size: 20),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Complete Your Profile',
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Fill in the details to get started',
                  style: GoogleFonts.outfit(
                    color: Colors.white54,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: _gold.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _gold.withOpacity(0.3)),
            ),
            child: Text(
              '${_currentStep + 1}/4',
              style: GoogleFonts.outfit(
                color: _gold,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Step Indicator ─────────────────────────────────────────────────────

  Widget _buildStepIndicator() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
      decoration: BoxDecoration(
        color: _cardDark,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _gold.withOpacity(0.15)),
      ),
      child: Row(
        children: List.generate(_stepLabels.length, (i) {
          final isActive = i <= _currentStep;
          final isComplete = i < _currentStep;
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _currentStep = i),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      if (i > 0)
                        Expanded(
                          child: Container(
                            height: 2,
                            color: isActive
                                ? _gold
                                : Colors.white.withOpacity(0.1),
                          ),
                        ),
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isComplete
                              ? _gold
                              : isActive
                                  ? _gold.withOpacity(0.2)
                                  : Colors.white.withOpacity(0.05),
                          border: Border.all(
                            color: isActive ? _gold : Colors.white12,
                            width: 2,
                          ),
                        ),
                        child: Center(
                          child: isComplete
                              ? const Icon(Icons.check_rounded,
                                  color: Colors.black, size: 16)
                              : Text(
                                  '${i + 1}',
                                  style: GoogleFonts.outfit(
                                    color:
                                        isActive ? _gold : Colors.white38,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                        ),
                      ),
                      if (i < _stepLabels.length - 1)
                        Expanded(
                          child: Container(
                            height: 2,
                            color: i < _currentStep
                                ? _gold
                                : Colors.white.withOpacity(0.1),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _stepLabels[i],
                    style: GoogleFonts.outfit(
                      color: isActive ? _gold : Colors.white38,
                      fontSize: 10,
                      fontWeight:
                          isActive ? FontWeight.w600 : FontWeight.w400,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  // ── Section Card ───────────────────────────────────────────────────────

  Widget _buildSectionCard({
    required int index,
    required IconData icon,
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: _cardDark,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: _currentStep == index
              ? _gold.withOpacity(0.4)
              : Colors.white.withOpacity(0.05),
        ),
        boxShadow: [
          BoxShadow(
            color: _currentStep == index
                ? _gold.withOpacity(0.06)
                : Colors.black26,
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          InkWell(
            onTap: () => setState(() => _currentStep = index),
            borderRadius:
                const BorderRadius.vertical(top: Radius.circular(20)),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: _currentStep == index
                    ? LinearGradient(
                        colors: [
                          _gold.withOpacity(0.12),
                          _gold.withOpacity(0.03),
                        ],
                      )
                    : null,
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _gold.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: _gold, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      title,
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Icon(
                    _currentStep == index
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    color: Colors.white38,
                  ),
                ],
              ),
            ),
          ),
          // Body
          AnimatedCrossFade(
            firstChild: Padding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: children,
              ),
            ),
            secondChild: const SizedBox.shrink(),
            crossFadeState: _currentStep == index
                ? CrossFadeState.showFirst
                : CrossFadeState.showSecond,
            duration: const Duration(milliseconds: 300),
          ),
        ],
      ),
    );
  }

  // ── Personal Fields ────────────────────────────────────────────────────

  List<Widget> _personalFields() => [
        const SizedBox(height: 4),
        _buildTextField(
          controller: _fullNameCtrl,
          label: 'Full Name',
          icon: Icons.badge_rounded,
          required: true,
          validator: (v) =>
              (v == null || v.trim().isEmpty) ? 'Name is required' : null,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _emailCtrl,
          label: 'Email Address',
          icon: Icons.email_rounded,
          enabled: false,
        ),
        const SizedBox(height: 16),
        _buildDateField(),
        const SizedBox(height: 16),
        _buildDropdownField(
          value: _gender,
          label: 'Gender',
          icon: Icons.wc_rounded,
          required: true,
          items: ['Male', 'Female', 'Other'],
          onChanged: (v) => setState(() => _gender = v),
          validator: (v) => v == null ? 'Select gender' : null,
        ),
        const SizedBox(height: 16),
        _buildDropdownField(
          value: _profession,
          label: 'Profession',
          icon: Icons.work_rounded,
          required: true,
          items: _professions,
          onChanged: (v) => setState(() => _profession = v),
          validator: (v) => v == null ? 'Select profession' : null,
        ),
      ];

  // ── Contact Fields ─────────────────────────────────────────────────────

  List<Widget> _contactFields() => [
        const SizedBox(height: 4),
        _buildTextField(
          controller: _phoneCtrl,
          label: 'Phone Number',
          icon: Icons.phone_rounded,
          required: true,
          keyboardType: TextInputType.phone,
          validator: (v) {
            if (v == null || v.trim().isEmpty) return 'Phone is required';
            if (v.trim().length < 10) return 'Enter a valid phone number';
            return null;
          },
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _whatsappCtrl,
          label: 'WhatsApp Number',
          icon: Icons.chat_rounded,
          hint: 'Same as phone if empty',
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _ownerNameCtrl,
          label: 'Owner / Landlord Name',
          icon: Icons.person_outline_rounded,
          required: true,
          validator: (v) =>
              (v == null || v.trim().isEmpty) ? 'Owner name is required' : null,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _ownerPhoneCtrl,
          label: 'Owner Phone',
          icon: Icons.phone_callback_rounded,
          required: true,
          keyboardType: TextInputType.phone,
          validator: (v) {
            if (v == null || v.trim().isEmpty) return 'Owner phone is required';
            if (v.trim().length < 10) return 'Enter a valid phone number';
            return null;
          },
        ),
        const SizedBox(height: 16),
        _buildMembersSelector(),
      ];

  // ── Location Fields ────────────────────────────────────────────────────

  List<Widget> _locationFields() => [
        const SizedBox(height: 4),
        _buildDropdownField(
          value: _location,
          label: 'Location / Area',
          icon: Icons.location_city_rounded,
          required: true,
          items: HYDERABAD_AREAS,
          onChanged: (v) => setState(() {
            _location = v;
            _colony = null; // reset colony on location change
          }),
          validator: (v) => v == null ? 'Select a location' : null,
          searchable: true,
        ),
        const SizedBox(height: 16),
        _buildDropdownField(
          value: _colony,
          label: 'Colony / Sector',
          icon: Icons.holiday_village_rounded,
          required: true,
          items: _location != null ? getColonies(_location!) : [],
          onChanged: (v) => setState(() => _colony = v),
          validator: (v) => v == null ? 'Select a colony' : null,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _houseNoCtrl,
          label: 'House / Flat Number',
          icon: Icons.home_rounded,
          hint: 'e.g. Flat 302, Block A',
          suffixWidget: Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              'PRIVATE',
              style: GoogleFonts.outfit(
                color: Colors.orange,
                fontSize: 9,
                fontWeight: FontWeight.w700,
                letterSpacing: 1,
              ),
            ),
          ),
        ),
      ];

  // ── KYC Fields ─────────────────────────────────────────────────────────

  List<Widget> _kycFields() => [
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: _gold.withOpacity(0.06),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _gold.withOpacity(0.15)),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline_rounded,
                  color: _gold.withOpacity(0.7), size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Upload your Aadhaar photo for identity verification. This is kept secure and private.',
                  style: GoogleFonts.outfit(
                    color: Colors.white60,
                    fontSize: 12,
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: _isUploadingImage ? null : _pickAadhaarImage,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: double.infinity,
            height: 180,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.03),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _aadhaarImage != null
                    ? _gold.withOpacity(0.5)
                    : Colors.white.withOpacity(0.1),
                width: _aadhaarImage != null ? 2 : 1,
              ),
            ),
            child: _isUploadingImage
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 36,
                          height: 36,
                          child: CircularProgressIndicator(
                            strokeWidth: 3,
                            color: _gold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Uploading...',
                          style: GoogleFonts.outfit(
                              color: Colors.white54, fontSize: 13),
                        ),
                      ],
                    ),
                  )
                : _aadhaarImage != null
                    ? Stack(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(15),
                            child: Image.file(
                              File(_aadhaarImage!.path),
                              width: double.infinity,
                              height: 180,
                              fit: BoxFit.cover,
                            ),
                          ),
                          Positioned(
                            top: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.green.shade700,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.check_rounded,
                                  color: Colors.white, size: 16),
                            ),
                          ),
                          Positioned(
                            bottom: 8,
                            left: 8,
                            right: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.black54,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'Tap to change photo',
                                style: GoogleFonts.outfit(
                                    color: Colors.white70, fontSize: 12),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                        ],
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: _gold.withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.cloud_upload_rounded,
                                color: _gold, size: 32),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Upload Aadhaar Card',
                            style: GoogleFonts.outfit(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Tap to capture or select from gallery',
                            style: GoogleFonts.outfit(
                              color: Colors.white38,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
          ),
        ),
      ];

  // ── Members Selector ───────────────────────────────────────────────────

  Widget _buildMembersSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.group_rounded, color: _gold.withOpacity(0.7), size: 20),
            const SizedBox(width: 8),
            Text(
              'Members Count',
              style: GoogleFonts.outfit(
                color: Colors.white70,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: _gold.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                '$_membersCount member${_membersCount > 1 ? 's' : ''}',
                style: GoogleFonts.outfit(
                  color: _gold,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: List.generate(6, (i) {
            final count = i + 1;
            final isSelected = _membersCount == count;
            return GestureDetector(
              onTap: () => setState(() => _membersCount = count),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isSelected ? _gold : Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color:
                        isSelected ? _goldDark : Colors.white.withOpacity(0.1),
                    width: isSelected ? 2 : 1,
                  ),
                  boxShadow: isSelected
                      ? [
                          BoxShadow(
                              color: _gold.withOpacity(0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4))
                        ]
                      : null,
                ),
                child: Center(
                  child: Text(
                    '$count',
                    style: GoogleFonts.outfit(
                      color: isSelected ? Colors.black : Colors.white60,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }

  // ── Submit Button ──────────────────────────────────────────────────────

  Widget _buildSubmitButton() {
    return GestureDetector(
      onTap: _isLoading ? null : _submit,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          gradient: _isLoading
              ? LinearGradient(
                  colors: [_gold.withOpacity(0.4), _goldDark.withOpacity(0.4)])
              : const LinearGradient(colors: [_gold, _goldDark]),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
                color: _gold.withOpacity(0.3),
                blurRadius: 16,
                offset: const Offset(0, 6)),
          ],
        ),
        child: Center(
          child: _isLoading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: Colors.black,
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.check_circle_rounded,
                        color: Colors.black, size: 22),
                    const SizedBox(width: 10),
                    Text(
                      'Save Profile',
                      style: GoogleFonts.outfit(
                        color: Colors.black,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  // ── Reusable Form Widgets ──────────────────────────────────────────────

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool required = false,
    bool enabled = true,
    String? hint,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    Widget? suffixWidget,
  }) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      keyboardType: keyboardType,
      validator: validator,
      style: GoogleFonts.outfit(color: Colors.white, fontSize: 15),
      decoration: InputDecoration(
        labelText: '$label${required ? ' *' : ''}',
        labelStyle: GoogleFonts.outfit(color: Colors.white54, fontSize: 14),
        hintText: hint,
        hintStyle: GoogleFonts.outfit(color: Colors.white24, fontSize: 13),
        prefixIcon: Icon(icon, color: _gold.withOpacity(0.7), size: 20),
        suffixIcon: suffixWidget,
        filled: true,
        fillColor: Colors.white.withOpacity(enabled ? 0.04 : 0.02),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: _gold, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.red.shade400),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.red.shade400, width: 1.5),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.04)),
        ),
        errorStyle: GoogleFonts.outfit(
            color: Colors.red.shade300, fontSize: 11),
      ),
    );
  }

  Widget _buildDateField() {
    return GestureDetector(
      onTap: _pickDob,
      child: AbsorbPointer(
        child: TextFormField(
          readOnly: true,
          style: GoogleFonts.outfit(color: Colors.white, fontSize: 15),
          controller: TextEditingController(
              text: _dob != null ? _formatDate(_dob!) : ''),
          decoration: InputDecoration(
            labelText: 'Date of Birth *',
            labelStyle:
                GoogleFonts.outfit(color: Colors.white54, fontSize: 14),
            hintText: 'DD/MM/YYYY',
            hintStyle:
                GoogleFonts.outfit(color: Colors.white24, fontSize: 13),
            prefixIcon: Icon(Icons.calendar_today_rounded,
                color: _gold.withOpacity(0.7), size: 20),
            suffixIcon: const Icon(Icons.arrow_drop_down_rounded,
                color: Colors.white38),
            filled: true,
            fillColor: Colors.white.withOpacity(0.04),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: _gold, width: 1.5),
            ),
          ),
          validator: (_) => _dob == null ? 'Select your date of birth' : null,
        ),
      ),
    );
  }

  Widget _buildDropdownField({
    required String? value,
    required String label,
    required IconData icon,
    bool required = false,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    String? Function(String?)? validator,
    bool searchable = false,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      validator: validator,
      isExpanded: true,
      dropdownColor: _cardDark,
      icon: const Icon(Icons.arrow_drop_down_rounded, color: Colors.white38),
      style: GoogleFonts.outfit(color: Colors.white, fontSize: 15),
      decoration: InputDecoration(
        labelText: '$label${required ? ' *' : ''}',
        labelStyle: GoogleFonts.outfit(color: Colors.white54, fontSize: 14),
        prefixIcon: Icon(icon, color: _gold.withOpacity(0.7), size: 20),
        filled: true,
        fillColor: Colors.white.withOpacity(0.04),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: _gold, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.red.shade400),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.red.shade400, width: 1.5),
        ),
        errorStyle: GoogleFonts.outfit(
            color: Colors.red.shade300, fontSize: 11),
      ),
      items: items
          .map((e) => DropdownMenuItem(
                value: e,
                child: Text(e,
                    style: GoogleFonts.outfit(
                        color: Colors.white, fontSize: 14)),
              ))
          .toList(),
      onChanged: onChanged,
    );
  }
}
