import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../main.dart';

class AddRoomScreen extends StatefulWidget {
  const AddRoomScreen({super.key});

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
  final _locationController = TextEditingController();
  final _colonyController = TextEditingController(); // REQUIRED
  final _addressController = TextEditingController();
  final _leavingDateController = TextEditingController(); // REQUIRED
  final _commissionController = TextEditingController(); 
  final _membersController = TextEditingController(text: '1');
  
  String _tenantType = 'bachelor';
  String _genderPref = 'Any';
  String _furnishing = 'Semi-Furnished';
  String _parking = 'Bike Parking';

  final List<File> _selectedImages = [];
  final ImagePicker _picker = ImagePicker();

  Future<void> _pickImages() async {
    final List<XFile> images = await _picker.pickMultiImage();
    if (images.isNotEmpty) setState(() => _selectedImages.addAll(images.map((e) => File(e.path))));
  }

  Future<void> _submitRoom() async {
    setState(() => _isLoading = true);
    try {
      final user = supabase.auth.currentUser;
      if (user == null) throw Exception('You must be logged in to post.');

      List<String> uploadedUrls = [];
      
      try {
        if (_selectedImages.isNotEmpty) {
          for (var file in _selectedImages) {
            final fileName = '${DateTime.now().millisecondsSinceEpoch}_${file.path.split('/').last}';
            await supabase.storage.from('room-media').upload('Takevolet/rooms/$fileName', file);
            uploadedUrls.add(supabase.storage.from('room-media').getPublicUrl('Takevolet/rooms/$fileName'));
          }
        } else {
          uploadedUrls.add('https://images.unsplash.com/photo-1502690266266-ce3f2824cd16?w=800&q=80');
        }
      } catch (e) {
        uploadedUrls = ['https://images.unsplash.com/photo-1502690266266-ce3f2824cd16?w=800&q=80'];
      }

      await supabase.from('rooms').insert({
        'user_id': user.id,
        'title': _titleController.text.isNotEmpty ? _titleController.text : 'Premium Room',
        'description': _descController.text,
        'rent': int.tryParse(_rentController.text) ?? 5000,
        'advance': int.tryParse(_advanceController.text) ?? 10000,
        'location': _locationController.text.isNotEmpty ? _locationController.text : 'City Center',
        'colony': _colonyController.text.isNotEmpty ? _colonyController.text : 'Default Colony', // FIX FOR BUG
        'full_address': _addressController.text,
        'leaving_date': _leavingDateController.text.isNotEmpty ? _leavingDateController.text : DateTime.now().add(const Duration(days: 30)).toIso8601String(), // FIX
        'tenant_type': _tenantType,
        'gender_preference': _genderPref,
        'furnishing': _furnishing,
        'parking': _parking, // FIX
        'commission': int.tryParse(_commissionController.text) ?? 500, // FIX
        'members_allowed': int.tryParse(_membersController.text) ?? 1,
        'images': uploadedUrls,
        'is_available': true,
      });

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
    return Scaffold(
      appBar: AppBar(title: const Text('Post a Room')),
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
                        TextField(controller: _locationController, decoration: _inputDeco('City/Area', Icons.location_city)),
                        const SizedBox(height: 16),
                        TextField(controller: _colonyController, decoration: _inputDeco('Colony/Society (Required)', Icons.holiday_village)), // FIX
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
                          child: Container(
                            height: 150,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Theme.of(context).colorScheme.primary, width: 2, style: BorderStyle.solid),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.add_a_photo, size: 50, color: Theme.of(context).colorScheme.primary),
                                const SizedBox(height: 8),
                                Text('Select Images', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (_selectedImages.isNotEmpty) 
                          SizedBox(
                            height: 100,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _selectedImages.length,
                              itemBuilder: (context, index) => Padding(
                                padding: const EdgeInsets.only(right: 8.0),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.file(_selectedImages[index], width: 100, height: 100, fit: BoxFit.cover),
                                ),
                              ),
                            ),
                          )
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
