import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../main.dart';
import '../../data/locations.dart';

class ProfileEditScreen extends StatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  static const _gold = Color(0xFFD4AF37);

  final _formKey = GlobalKey<FormState>();
  bool _isLoading = true;
  bool _isSaving = false;

  // Controllers
  final _fullNameController = TextEditingController();
  final _dobController = TextEditingController();
  final _phoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _professionController = TextEditingController();
  final _ownerNameController = TextEditingController();
  final _ownerPhoneController = TextEditingController();
  final _membersController = TextEditingController();
  final _colonyController = TextEditingController();
  final _houseNoController = TextEditingController();

  String _gender = 'Male';
  String _location = HYDERABAD_AREAS.first;
  String? _aadhaarUrl;

  final List<String> _genderOptions = ['Male', 'Female', 'Other'];

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _dobController.dispose();
    _phoneController.dispose();
    _whatsappController.dispose();
    _professionController.dispose();
    _ownerNameController.dispose();
    _ownerPhoneController.dispose();
    _membersController.dispose();
    _colonyController.dispose();
    _houseNoController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    try {
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) {
        if (mounted) context.go('/login');
        return;
      }

      final profile = await supabase
          .from('profiles')
          .select()
          .eq('id', userId)
          .single();

      _fullNameController.text = profile['full_name'] ?? '';
      _dobController.text = profile['dob'] ?? '';
      _phoneController.text = profile['phone'] ?? '';
      _whatsappController.text = profile['whatsapp'] ?? '';
      _professionController.text = profile['profession'] ?? '';
      _ownerNameController.text = profile['owner_name'] ?? '';
      _ownerPhoneController.text = profile['owner_phone'] ?? '';
      _membersController.text = (profile['members_count'] ?? '').toString();
      _colonyController.text = profile['colony'] ?? '';
      _houseNoController.text = profile['house_no'] ?? '';

      final gender = profile['gender'] ?? '';
      if (_genderOptions.contains(gender)) {
        _gender = gender;
      }

      final loc = profile['location'] ?? '';
      if (HYDERABAD_AREAS.contains(loc)) {
        _location = loc;
      }

      _aadhaarUrl = profile['aadhaar_url'];
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load profile: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Future<void> _pickDOB() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000, 1, 1),
      firstDate: DateTime(1950),
      lastDate: now,
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: Theme.of(context).colorScheme.copyWith(primary: _gold),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      _dobController.text =
          '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) throw Exception('Not authenticated');

      await supabase.from('profiles').update({
        'full_name': _fullNameController.text.trim(),
        'dob': _dobController.text.trim(),
        'phone': _phoneController.text.trim(),
        'whatsapp': _whatsappController.text.trim(),
        'gender': _gender,
        'profession': _professionController.text.trim(),
        'owner_name': _ownerNameController.text.trim(),
        'owner_phone': _ownerPhoneController.text.trim(),
        'members_count': int.tryParse(_membersController.text.trim()) ?? 1,
        'location': _location,
        'colony': _colonyController.text.trim(),
        'house_no': _houseNoController.text.trim(),
        'updated_at': DateTime.now().toIso8601String(),
      }).eq('id', userId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Text('Profile updated successfully!'),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  InputDecoration _inputDeco(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: _gold),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: _gold, width: 2),
      ),
      filled: true,
      fillColor: Colors.grey[50],
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Card(
      elevation: 2,
      shadowColor: _gold.withOpacity(0.15),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _gold.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: _gold, size: 20),
                ),
                const SizedBox(width: 12),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Edit Profile',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new),
          onPressed: () => context.pop(),
        ),
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CircularProgressIndicator(color: _gold),
                  const SizedBox(height: 16),
                  Text(
                    'Loading your profile...',
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
                  // Header
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [_gold, _gold.withOpacity(0.7)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: _gold.withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: Colors.white.withOpacity(0.3),
                          child: Text(
                            _fullNameController.text.isNotEmpty
                                ? _fullNameController.text[0].toUpperCase()
                                : 'U',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Update Your Profile',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Keep your information up to date',
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.85),
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          Icons.edit_note,
                          color: Colors.white.withOpacity(0.8),
                          size: 32,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Personal Information
                  _buildSectionCard(
                    title: 'Personal Information',
                    icon: Icons.person,
                    children: [
                      TextFormField(
                        controller: _fullNameController,
                        decoration: _inputDeco('Full Name', Icons.person_outline),
                        validator: (v) =>
                            (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _dobController,
                        decoration: _inputDeco('Date of Birth', Icons.cake).copyWith(
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.calendar_today, color: _gold),
                            onPressed: _pickDOB,
                          ),
                        ),
                        readOnly: true,
                        onTap: _pickDOB,
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _gender,
                        decoration: _inputDeco('Gender', Icons.wc),
                        items: _genderOptions
                            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                            .toList(),
                        onChanged: (v) => setState(() => _gender = v!),
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _professionController,
                        decoration: _inputDeco('Profession', Icons.work_outline),
                      ),
                    ],
                  ),

                  // Contact Details
                  _buildSectionCard(
                    title: 'Contact Details',
                    icon: Icons.phone,
                    children: [
                      TextFormField(
                        controller: _phoneController,
                        decoration: _inputDeco('Phone Number', Icons.phone_outlined),
                        keyboardType: TextInputType.phone,
                        validator: (v) =>
                            (v == null || v.trim().isEmpty) ? 'Phone is required' : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _whatsappController,
                        decoration: _inputDeco('WhatsApp Number', Icons.chat),
                        keyboardType: TextInputType.phone,
                      ),
                    ],
                  ),

                  // Owner Details
                  _buildSectionCard(
                    title: 'Owner Details',
                    icon: Icons.home_work,
                    children: [
                      TextFormField(
                        controller: _ownerNameController,
                        decoration: _inputDeco('Owner Name', Icons.person_pin),
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _ownerPhoneController,
                        decoration: _inputDeco('Owner Phone', Icons.phone_in_talk),
                        keyboardType: TextInputType.phone,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _membersController,
                        decoration: _inputDeco('Members Count', Icons.group),
                        keyboardType: TextInputType.number,
                      ),
                    ],
                  ),

                  // Location Details
                  _buildSectionCard(
                    title: 'Location',
                    icon: Icons.location_on,
                    children: [
                      DropdownButtonFormField<String>(
                        value: _location,
                        decoration: _inputDeco('Area / Location', Icons.location_city),
                        isExpanded: true,
                        items: HYDERABAD_AREAS
                            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                            .toList(),
                        onChanged: (v) => setState(() => _location = v!),
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _colonyController,
                        decoration: _inputDeco('Colony / Society', Icons.holiday_village),
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _houseNoController,
                        decoration: _inputDeco('House / Flat No', Icons.door_front_door),
                      ),
                    ],
                  ),

                  // Aadhaar Image
                  if (_aadhaarUrl != null && _aadhaarUrl!.isNotEmpty)
                    _buildSectionCard(
                      title: 'Aadhaar Verification',
                      icon: Icons.verified_user,
                      children: [
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.green[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.green[300]!),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.check_circle, color: Colors.green[700], size: 20),
                              const SizedBox(width: 10),
                              const Expanded(
                                child: Text(
                                  'Aadhaar document uploaded',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: Colors.green,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            _aadhaarUrl!,
                            height: 180,
                            width: double.infinity,
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              height: 120,
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.broken_image, color: Colors.grey, size: 36),
                                    SizedBox(height: 4),
                                    Text('Could not load image',
                                        style: TextStyle(color: Colors.grey, fontSize: 12)),
                                  ],
                                ),
                              ),
                            ),
                            loadingBuilder: (_, child, loadingProgress) {
                              if (loadingProgress == null) return child;
                              return Container(
                                height: 180,
                                decoration: BoxDecoration(
                                  color: Colors.grey[100],
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Center(
                                  child: CircularProgressIndicator(color: _gold),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),

                  const SizedBox(height: 8),

                  // Save Button
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _gold,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 6,
                        shadowColor: _gold.withOpacity(0.4),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2.5,
                              ),
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.save_rounded, size: 22),
                                SizedBox(width: 10),
                                Text(
                                  'Save Changes',
                                  style: TextStyle(
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
