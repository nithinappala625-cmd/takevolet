import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../main.dart';
import '../../data/locations.dart';

class AddItemScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;
  const AddItemScreen({super.key, this.initialData});

  @override
  State<AddItemScreen> createState() => _AddItemScreenState();
}

class _AddItemScreenState extends State<AddItemScreen> {
  static const _gold = Color(0xFFD4AF37);
  final _formKey = GlobalKey<FormState>();

  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();

  String _condition = 'Good';
  String _category = 'Furniture';
  String _selectedCity = 'Hyderabad';
  String _location = HYDERABAD_AREAS.first;
  List<File> _images = [];
  bool _isLoading = false;

  final _conditions = ['New', 'Like New', 'Good', 'Fair', 'Needs Repair'];
  final _categories = ['Furniture', 'Electronics', 'Appliances', 'Kitchenware', 'Bedding & Mattress', 'Others'];

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      final data = widget.initialData!;
      _titleController.text = data['title']?.toString() ?? '';
      _descriptionController.text = data['description']?.toString() ?? '';
      _priceController.text = data['price']?.toString() ?? '';
      
      if (_conditions.contains(data['condition'])) {
        _condition = data['condition'];
      }
      if (_categories.contains(data['category'])) {
        _category = data['category'];
      }
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
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final picked = await picker.pickMultiImage(imageQuality: 75, maxWidth: 1200);
    if (picked.isNotEmpty) {
      setState(() {
        _images.addAll(picked.map((x) => File(x.path)));
        if (_images.length > 5) _images = _images.sublist(0, 5);
      });
    }
  }

  Future<String?> _uploadImage(File file) async {
    try {
      final userId = supabase.auth.currentUser!.id;
      final ext = file.path.split('.').last;
      final path = 'items/$userId/${DateTime.now().millisecondsSinceEpoch}.$ext';
      await supabase.storage.from('listings').upload(path, file);
      return supabase.storage.from('listings').getPublicUrl(path);
    } catch (_) {
      return null;
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      final user = supabase.auth.currentUser;
      if (user == null) throw Exception('You must be logged in.');

      String? imageUrl;
      if (_images.isNotEmpty) {
        imageUrl = await _uploadImage(_images.first);
      } else if (widget.initialData != null && widget.initialData!['image'] != null) {
        imageUrl = widget.initialData!['image'];
      }

      final itemData = {
        'user_id': user.id,
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'price': int.tryParse(_priceController.text) ?? 0,
        'condition': _condition,
        'category': _category,
        'location': _location,
        'image': imageUrl,
        'is_available': true,
        'city': _selectedCity,
      };

      if (widget.initialData != null) {
        await supabase.from('items').update(itemData).eq('id', widget.initialData!['id']);
      } else {
        await supabase.from('items').insert(itemData);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('✅ Item posted successfully!'),
          backgroundColor: Colors.green,
        ));
        context.go('/marketplace');
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
    final areas = _selectedCity == 'Bangalore' ? BANGALORE_AREAS : HYDERABAD_AREAS;

    return Scaffold(
      appBar: AppBar(title: Text(widget.initialData != null ? 'Edit Item' : 'Sell an Item', style: const TextStyle(fontWeight: FontWeight.bold))),
      body: _isLoading
          ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
              const CircularProgressIndicator(color: _gold),
              const SizedBox(height: 16),
              Text(_images.isNotEmpty ? 'Uploading image...' : 'Posting...', style: TextStyle(color: Colors.grey[600])),
            ]))
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Photo
                  _buildSectionCard(
                    title: 'Item Photo',
                    icon: Icons.photo_camera,
                    children: [
                      if (_images.isNotEmpty)
                        Container(
                          height: 160, width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            image: DecorationImage(image: FileImage(_images.first), fit: BoxFit.cover),
                          ),
                          child: Align(
                            alignment: Alignment.topRight,
                            child: GestureDetector(
                              onTap: () => setState(() => _images.clear()),
                              child: Container(
                                margin: const EdgeInsets.all(8),
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(shape: BoxShape.circle, color: Colors.red),
                                child: const Icon(Icons.close, color: Colors.white, size: 16),
                              ),
                            ),
                          ),
                        ),
                      OutlinedButton.icon(
                        onPressed: _pickImages,
                        icon: const Icon(Icons.add_a_photo),
                        label: Text(_images.isEmpty ? 'Add Photo' : 'Change Photo'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: _gold,
                          side: BorderSide(color: _gold.withOpacity(0.5)),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),

                  // Details
                  _buildSectionCard(
                    title: 'Item Details',
                    icon: Icons.shopping_bag,
                    children: [
                      TextFormField(
                        controller: _titleController,
                        decoration: _inputDeco('Item Name *', Icons.title),
                        validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _descriptionController,
                        decoration: _inputDeco('Description', Icons.description).copyWith(hintText: 'Describe the item...'),
                        maxLines: 3,
                      ),
                      const SizedBox(height: 14),
                      TextFormField(
                        controller: _priceController,
                        decoration: _inputDeco('Price (₹) *', Icons.currency_rupee),
                        keyboardType: TextInputType.number,
                        validator: (v) => (v == null || v.isEmpty) ? 'Price is required' : null,
                      ),
                    ],
                  ),

                  // Category & Condition
                  _buildSectionCard(
                    title: 'Category & Condition',
                    icon: Icons.category,
                    children: [
                      DropdownButtonFormField<String>(
                        value: _category,
                        decoration: _inputDeco('Category', Icons.list),
                        items: _categories.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                        onChanged: (v) => setState(() => _category = v!),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _condition,
                        decoration: _inputDeco('Condition', Icons.star),
                        items: _conditions.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                        onChanged: (v) => setState(() => _condition = v!),
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
                        decoration: _inputDeco('City', Icons.location_city),
                        isExpanded: true,
                        items: ['Hyderabad', 'Bangalore'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                        onChanged: (v) => setState(() { 
                          _selectedCity = v!; 
                          _location = _selectedCity == 'Bangalore' ? BANGALORE_AREAS.first : HYDERABAD_AREAS.first;
                        }),
                      ),
                      const SizedBox(height: 14),
                      DropdownButtonFormField<String>(
                        value: _location,
                        decoration: _inputDeco('Area', Icons.map),
                        isExpanded: true,
                        items: areas.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                        onChanged: (v) => setState(() => _location = v!),
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
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 6,
                        shadowColor: _gold.withOpacity(0.4),
                      ),
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.sell, size: 22),
                        const SizedBox(width: 10),
                        Text(widget.initialData != null ? 'Save Changes' : 'Post Item', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
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
