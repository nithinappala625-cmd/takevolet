import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../main.dart';
import '../../data/locations.dart';

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
  
  String _tenantType = 'bachelor';
  String _genderPref = 'Any';
  String _furnishing = 'Semi-Furnished';
  String _parking = 'Bike Parking';
  String _selectedCity = 'Hyderabad';
  String _location = HYDERABAD_AREAS.first;
  String? _colony;

  final List<File> _selectedImages = [];
  final ImagePicker _picker = ImagePicker();

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
      _commissionController.text = data['commission']?.toString() ?? '';
      _membersController.text = data['members_allowed']?.toString() ?? '1';
      
      _tenantType = data['tenant_type']?.toString() ?? 'bachelor';
      _genderPref = data['gender_preference']?.toString() ?? 'Any';
      _furnishing = data['furnishing']?.toString() ?? 'Semi-Furnished';
      _parking = data['parking']?.toString() ?? 'Bike Parking';
      
      if (data['city'] == 'Bangalore') {
        _selectedCity = 'Bangalore';
        if (BANGALORE_AREAS.contains(data['location'])) {
          _location = data['location'];
        } else {
          _location = BANGALORE_AREAS.first;
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

  Future<void> _pickImages() async {
    final List<XFile> images = await _picker.pickMultiImage(
      imageQuality: 70,
      maxWidth: 1280,
      maxHeight: 1280,
    );
    if (images.isNotEmpty) {
      final availableSlots = 6 - _selectedImages.length;
      if (availableSlots > 0) {
        setState(() => _selectedImages.addAll(images.take(availableSlots).map((e) => File(e.path))));
      }
    }
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
        } else if (widget.initialData != null && widget.initialData!['images'] != null) {
          uploadedUrls = (widget.initialData!['images'] as List).cast<String>();
        } else {
          uploadedUrls.add('https://images.unsplash.com/photo-1502690266266-ce3f2824cd16?w=800&q=80');
        }
      } catch (e) {
        if (widget.initialData != null && widget.initialData!['images'] != null) {
          uploadedUrls = (widget.initialData!['images'] as List).cast<String>();
        } else {
          uploadedUrls = ['https://images.unsplash.com/photo-1502690266266-ce3f2824cd16?w=800&q=80'];
        }
      }

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
        'tenant_type': _tenantType,
        'gender_preference': _genderPref,
        'furnishing': _furnishing,
        'parking': _parking,
        'commission': int.tryParse(_commissionController.text) ?? 500,
        'members_allowed': int.tryParse(_membersController.text) ?? 1,
        'images': uploadedUrls,
        'is_available': true,
        'city': _selectedCity,
      };

      if (widget.initialData != null) {
        await supabase.from('rooms').update(roomData).eq('id', widget.initialData!['id']);
      } else {
        await supabase.from('rooms').insert(roomData);
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
    final areas = _selectedCity == 'Bangalore' ? BANGALORE_AREAS : HYDERABAD_AREAS;

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
                          items: ['Hyderabad', 'Bangalore'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (v) => setState(() { 
                            _selectedCity = v!; 
                            _location = _selectedCity == 'Bangalore' ? BANGALORE_AREAS.first : HYDERABAD_AREAS.first;
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
                                Text('Select Images (up to 6)', style: TextStyle(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
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
