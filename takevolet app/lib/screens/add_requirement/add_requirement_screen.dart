import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../services/onesignal_service.dart';
import '../../services/r2_storage_service.dart';

class AddRequirementScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;
  const AddRequirementScreen({super.key, this.initialData});

  @override
  State<AddRequirementScreen> createState() => _AddRequirementScreenState();
}

class _AddRequirementScreenState extends State<AddRequirementScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _locationsController = TextEditingController();
  final TextEditingController _budgetController = TextEditingController();
  final TextEditingController _contactController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  
  String _furnishedType = 'Any';
  final List<String> _furnishedOptions = ['Furnished', 'Semi-Furnished', 'Unfurnished', 'Any'];

  String _roomType = 'Room';
  final List<String> _roomOptions = ['Room', 'Flat/Apartment', 'Independent House', 'Open Plot', 'Commercial', 'Cook', 'Legal Cell', 'Any'];

  File? _profileImage;
  final _picker = ImagePicker();

  Future<void> _pickImage() async {
    final pickedFile = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (pickedFile != null) {
      setState(() {
        _profileImage = File(pickedFile.path);
      });
    }
  }

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      final data = widget.initialData!;
      _nameController.text = data['name']?.toString() ?? '';
      _locationsController.text = data['preferred_locations']?.toString() ?? '';
      _budgetController.text = data['budget']?.toString() ?? '';
      _contactController.text = data['contact_number']?.toString() ?? '';
      _descriptionController.text = data['description']?.toString() ?? '';
      
      _furnishedType = data['furnished_type']?.toString() ?? 'Any';
      if (!_furnishedOptions.contains(_furnishedType)) _furnishedType = 'Any';
      
      _roomType = data['room_type']?.toString() ?? 'Any';
      if (!_roomOptions.contains(_roomType)) _roomType = 'Any';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _locationsController.dispose();
    _budgetController.dispose();
    _contactController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submitPost() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please log in first')));
        return;
      }

      final profileResponse = await Supabase.instance.client
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

      final userMetadataAvatar = user.userMetadata?['avatar_url'];
      if (_profileImage == null && 
          (profileResponse?['avatar_url'] == null || profileResponse!['avatar_url'].toString().isEmpty) && 
          (userMetadataAvatar == null || userMetadataAvatar.toString().isEmpty)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile picture is mandatory to post!'), backgroundColor: Colors.red),
        );
        setState(() => _isLoading = false);
        return;
      }

      final String name = _nameController.text.trim();
      final String email = profileResponse?['email'] ?? user.email ?? 'Unknown';

      String? uploadedAvatarUrl = profileResponse?['avatar_url'] ?? user.userMetadata?['avatar_url'];
      if (_profileImage != null) {
        final fileName = 'avatars/${user.id}-${DateTime.now().millisecondsSinceEpoch}.jpg';
        uploadedAvatarUrl = await R2StorageService.uploadFile(_profileImage!, fileName);
      }

      // Update the global profile so it reflects everywhere
      if (uploadedAvatarUrl != null) {
        if (profileResponse == null) {
          await Supabase.instance.client.from('profiles').insert({
            'id': user.id, 
            'avatar_url': uploadedAvatarUrl,
            'email': user.email,
            'full_name': user.userMetadata?['full_name'] ?? name,
          });
        } else {
          await Supabase.instance.client.from('profiles').update({'avatar_url': uploadedAvatarUrl}).eq('id', user.id);
        }
      }

      final requirementData = {
        'user_id': user.id,
        'name': name,
        'email': email,
        'preferred_locations': _locationsController.text.trim(),
        'budget': _budgetController.text.trim(),
        'contact_number': _contactController.text.trim(),
        'room_type': _roomType,
        'furnished_type': _furnishedType,
        'description': _descriptionController.text.trim(),
      };

      if (widget.initialData != null) {
        await Supabase.instance.client.from('requirements').update(requirementData).eq('id', widget.initialData!['id']);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Requirement updated successfully!'), backgroundColor: Colors.green));
      } else {
        await Supabase.instance.client.from('requirements').insert(requirementData);
        try {
          await OneSignalService.sendPushNotification(
            title: 'New Tenant Requirement',
            message: '$name is looking for a $_roomType in ${_locationsController.text.trim()}. Budget: ₹${_budgetController.text.trim()}/mo.',
          );
        } catch (e) {
          debugPrint('Push Notification error: $e');
        }

        await OneSignalService.broadcastInAppNotification(
          title: 'New Tenant Requirement',
          body: '$name is looking for a $_roomType in ${_locationsController.text.trim()}. Budget: ₹${_budgetController.text.trim()}/mo.',
          type: 'feed',
        );
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Requirement posted successfully!'), backgroundColor: Colors.green));
      }

      if (mounted) {
        if(context.canPop()) context.pop();
      }
    } catch (e) {
      debugPrint('Error posting requirement: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error posting requirement: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Post Your Requirement', style: TextStyle(fontWeight: FontWeight.bold)),
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'What are you looking for?',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Fill in the details so owners can contact you directly.',
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 24),

                  Center(
                    child: GestureDetector(
                      onTap: _pickImage,
                      child: CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.grey.shade200,
                        backgroundImage: _profileImage != null ? FileImage(_profileImage!) : null,
                        child: _profileImage == null
                            ? const Icon(Icons.add_a_photo, size: 30, color: Colors.grey)
                            : null,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Center(child: Text('Add Profile Picture', style: TextStyle(fontSize: 12, color: Colors.grey))),
                  const SizedBox(height: 24),

                  _buildTextField(
                    controller: _nameController,
                    label: 'Your Name (Mandatory)',
                    icon: Icons.person_outline,
                    validator: (v) => v == null || v.isEmpty ? 'Name is required' : null,
                  ),
                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _locationsController,
                    label: 'Preferred Locations (e.g., Madhapur, Gachibowli)',
                    icon: Icons.location_on_outlined,
                    validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),

                  _buildTextField(
                    controller: _budgetController,
                    label: 'Budget (e.g., 10k - 15k)',
                    icon: Icons.currency_rupee_outlined,
                    validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 24),

                  _buildTextField(
                    controller: _contactController,
                    label: 'Contact Number',
                    icon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                    validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 24),

                  const Text('Requirement Type', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _roomOptions.map((type) {
                      final isSelected = _roomType == type;
                      return ChoiceChip(
                        label: Text(type),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) setState(() => _roomType = type);
                        },
                        selectedColor: const Color(0xFFD4AF37).withOpacity(0.2),
                        labelStyle: TextStyle(
                          color: isSelected ? const Color(0xFFB8860B) : Colors.black87,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  const Text('Furnishing Preference', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _furnishedOptions.map((type) {
                      final isSelected = _furnishedType == type;
                      return ChoiceChip(
                        label: Text(type),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) setState(() => _furnishedType = type);
                        },
                        selectedColor: const Color(0xFFD4AF37).withOpacity(0.2),
                        labelStyle: TextStyle(
                          color: isSelected ? const Color(0xFFB8860B) : Colors.black87,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  _buildTextField(
                    controller: _descriptionController,
                    label: 'Description (Any other requirements?)',
                    icon: Icons.description_outlined,
                    maxLines: 4,
                  ),
                  
                  const SizedBox(height: 40),
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _submitPost,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD4AF37),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 2,
                      ),
                      child: const Text('Post Your Requirements', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: maxLines == 1 ? Icon(icon, color: Colors.grey.shade500) : null,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFD4AF37), width: 2),
        ),
        filled: true,
        fillColor: Colors.grey.shade50,
      ),
    );
  }
}
