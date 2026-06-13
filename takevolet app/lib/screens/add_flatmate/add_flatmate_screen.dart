import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../main.dart';
import '../../data/locations.dart';

class AddFlatmateScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;
  const AddFlatmateScreen({super.key, this.initialData});

  @override
  State<AddFlatmateScreen> createState() => _AddFlatmateScreenState();
}

class _AddFlatmateScreenState extends State<AddFlatmateScreen> {
  static const _gold = Color(0xFFD4AF37);
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _rentController = TextEditingController();
  final _advanceController = TextEditingController();
  final _vacancyController = TextEditingController(text: '1');

  String _genderPref = 'Any';
  String _selectedCity = 'Hyderabad';
  String _location = HYDERABAD_AREAS.first;
  String? _colony;
  String? _professionPref;
  List<String> _lifestyleHabits = [];
  List<File> _images = [];
  bool _isLoading = false;

  final _genderOptions = ['Any', 'Male', 'Female'];
  final _professions = [
    'Software Engineer', 'IT Professional', 'Student', 'Doctor',
    'Pharmacist', 'Architect', 'CA/Finance', 'Banker',
    'Teacher/Lecturer', 'Business Owner', 'Marketing/Sales',
    'Designer', 'Data Analyst', 'Other', 'No Preference',
  ];
  final _lifestyleOptions = [
    'Non-Smoker', 'Non-Drinker', 'Vegetarian', 'Non-Vegetarian',
    'Early Bird', 'Night Owl', 'Pet Friendly', 'Fitness Enthusiast',
    'Neat & Clean', 'Introvert', 'Extrovert', 'WFH Professional',
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

      _genderPref = data['gender_pref']?.toString() ?? 'Any';
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
      _professionPref = data['profession_pref']?.toString() != '' ? data['profession_pref']?.toString() : null;
      if (data['lifestyle_habits'] != null) {
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
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage(imageQuality: 70, maxWidth: 1280, maxHeight: 1280);
    if (picked.isNotEmpty) {
      setState(() {
        _images.addAll(picked.map((x) => File(x.path)));
        if (_images.length > 6) _images = _images.sublist(0, 6);
      });
    }
  }

  Future<List<String>> _uploadImages() async {
    final userId = supabase.auth.currentUser!.id;
    final List<String> urls = [];

    for (int i = 0; i < _images.length; i++) {
      final file = _images[i];
      final ext = file.path.split('.').last;
      final path = 'flatmates/$userId/${DateTime.now().millisecondsSinceEpoch}_$i.$ext';

      await supabase.storage.from('listings').upload(path, file);
      final url = supabase.storage.from('listings').getPublicUrl(path);
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
      } else if (widget.initialData != null && widget.initialData!['images'] != null) {
        imageUrls = (widget.initialData!['images'] as List).cast<String>();
      }

      final flatmateData = {
        'user_id': user.id,
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'rent_share': int.tryParse(_rentController.text) ?? 0,
        'advance_share': int.tryParse(_advanceController.text) ?? 0,
        'vacancy_count': int.tryParse(_vacancyController.text) ?? 1,
        'gender_pref': _genderPref,
        'location': _location,
        'colony': _colony ?? '',
        'profession_pref': _professionPref ?? '',
        'lifestyle_habits': _lifestyleHabits,
        'images': imageUrls,
        'is_available': true,
        'city': _selectedCity,
      };

      if (widget.initialData != null) {
        await supabase.from('flatmates').update(flatmateData).eq('id', widget.initialData!['id']);
      } else {
        await supabase.from('flatmates').insert(flatmateData);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('✅ Flatmate vacancy posted!'),
          backgroundColor: Colors.green,
        ));
        context.go('/flatmates');
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  InputDecoration _inputDeco(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: _gold),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _gold, width: 2)),
      filled: true,
      fillColor: Colors.grey[50],
    );
  }

  Widget _buildSectionCard({required String title, required IconData icon, required List<Widget> children}) {
    return Card(
      elevation: 2,
      shadowColor: _gold.withOpacity(0.15),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: _gold.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: _gold, size: 20),
            ),
            const SizedBox(width: 12),
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 16),
          ...children,
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colonies = getColonies(_location, city: _selectedCity);
    final areas = _selectedCity == 'Bangalore' ? BANGALORE_AREAS : HYDERABAD_AREAS;

    return Scaffold(
      appBar: AppBar(title: Text(widget.initialData != null ? 'Edit Flatmate Vacancy' : 'Post Flatmate Vacancy', style: const TextStyle(fontWeight: FontWeight.bold))),
      body: _isLoading
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              const CircularProgressIndicator(color: _gold),
              const SizedBox(height: 16),
              Text(_images.isNotEmpty ? 'Uploading images...' : 'Posting...', style: TextStyle(color: Colors.grey[600])),
            ]))
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
                            itemBuilder: (_, i) => Stack(children: [
                              Container(
                                margin: const EdgeInsets.only(right: 8),
                                width: 100, height: 100,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  image: DecorationImage(image: FileImage(_images[i]), fit: BoxFit.cover),
                                ),
                              ),
                              Positioned(top: 2, right: 10, child: GestureDetector(
                                onTap: () => setState(() => _images.removeAt(i)),
                                child: Container(
                                  padding: const EdgeInsets.all(2),
                                  decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.red),
                                  child: const Icon(Icons.close, color: Colors.white, size: 14),
                                ),
                              )),
                            ]),
                          ),
                        ),
                      if (_images.isNotEmpty) const SizedBox(height: 12),
                      OutlinedButton.icon(
                        onPressed: _images.length < 6 ? _pickImages : null,
                        icon: const Icon(Icons.add_a_photo),
                        label: Text(_images.isEmpty ? 'Add Photos (up to 6)' : 'Add More (${_images.length}/6)'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: _gold,
                          side: BorderSide(color: _gold.withOpacity(0.5)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
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
                        validator: (v) => (v == null || v.trim().isEmpty) ? 'Title is required' : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _descriptionController,
                        decoration: _inputDeco('Description', Icons.description).copyWith(
                          hintText: 'Describe the room, amenities, and what you\'re looking for...',
                        ),
                        maxLines: 4,
                      ),
                    ],
                  ),

                  // Pricing
                  _buildSectionCard(
                    title: 'Pricing',
                    icon: Icons.currency_rupee,
                    children: [
                      Row(children: [
                        Expanded(child: TextFormField(
                          controller: _rentController,
                          decoration: _inputDeco('Rent Share (₹) *', Icons.currency_rupee),
                          keyboardType: TextInputType.number,
                          validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
                        )),
                        const SizedBox(width: 12),
                        Expanded(child: TextFormField(
                          controller: _advanceController,
                          decoration: _inputDeco('Advance (₹)', Icons.account_balance),
                          keyboardType: TextInputType.number,
                        )),
                      ]),
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
                        items: ['Hyderabad', 'Bangalore'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                        onChanged: (v) => setState(() { 
                          _selectedCity = v!; 
                          _location = _selectedCity == 'Bangalore' ? BANGALORE_AREAS.first : HYDERABAD_AREAS.first;
                          _colony = null; 
                        }),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _location,
                        decoration: _inputDeco('Area *', Icons.map),
                        isExpanded: true,
                        items: areas.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                        onChanged: (v) => setState(() { _location = v!; _colony = null; }),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _colony,
                        decoration: _inputDeco('Colony', Icons.holiday_village),
                        isExpanded: true,
                        items: colonies.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                        onChanged: (v) => setState(() => _colony = v),
                      ),
                    ],
                  ),

                  // Preferences
                  _buildSectionCard(
                    title: 'Preferences',
                    icon: Icons.tune,
                    children: [
                      DropdownButtonFormField<String>(
                        value: _genderPref,
                        decoration: _inputDeco('Gender Preference', Icons.wc),
                        items: _genderOptions.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                        onChanged: (v) => setState(() => _genderPref = v!),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _professionPref,
                        decoration: _inputDeco('Profession Preference', Icons.work),
                        isExpanded: true,
                        items: _professions.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                        onChanged: (v) => setState(() => _professionPref = v),
                      ),
                      const SizedBox(height: 14),
                      const Text('Lifestyle Preferences', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      const SizedBox(height: 8),
                      Wrap(spacing: 8, runSpacing: 8, children: _lifestyleOptions.map((h) {
                        final selected = _lifestyleHabits.contains(h);
                        return FilterChip(
                          label: Text(h, style: TextStyle(fontSize: 12, color: selected ? Colors.white : Colors.black87)),
                          selected: selected,
                          onSelected: (v) => setState(() => v ? _lifestyleHabits.add(h) : _lifestyleHabits.remove(h)),
                          selectedColor: _gold,
                          backgroundColor: Colors.grey[100],
                          checkmarkColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        );
                      }).toList()),
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
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 6,
                        shadowColor: _gold.withOpacity(0.4),
                      ),
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.publish, size: 22),
                        const SizedBox(width: 10),
                        Text(widget.initialData != null ? 'Save Changes' : 'Post Flatmate Vacancy', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      ]),
                    ),
                  ),

                  const SizedBox(height: 32),
                ],
              ),
            ),
    );
  }
}
