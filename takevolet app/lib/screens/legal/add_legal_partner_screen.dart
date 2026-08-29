import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:io';
import '../../services/r2_storage_service.dart';
import '../../services/payment_service.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:go_router/go_router.dart';
import 'legal_constants.dart';

class AddLegalPartnerScreen extends StatefulWidget {
  const AddLegalPartnerScreen({super.key});
  @override
  State<AddLegalPartnerScreen> createState() => _AddLegalPartnerScreenState();
}

class _AddLegalPartnerScreenState extends State<AddLegalPartnerScreen> {
  static const Color _gold = Color(0xFFD4AF37);
  int _currentStep = 0;
  bool _isLoading = false;

  final _formKey = GlobalKey<FormState>();
  
  // Basic Info
  final _businessNameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _experienceController = TextEditingController();
  final _gstController = TextEditingController();
  final _licenseController = TextEditingController();
  String? _selectedCategory;
  File? _logoImage;
  File? _coverImage;

  // Contact Info
  final _contactPersonController = TextEditingController();
  final _mobileController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _districtController = TextEditingController();
  final _cityController = TextEditingController();
  final _googleMapsController = TextEditingController();
  
  // Specific Details (Dynamic based on Category)
  final Map<String, TextEditingController> _specificTextControllers = {};
  final Map<String, bool> _specificCheckboxes = {};

  // Pricing & Availability
  final _serviceAreasController = TextEditingController();
  final _workingDaysController = TextEditingController();
  final _workingHoursController = TextEditingController();
  bool _emergencyService = false;
  bool _homeVisit = false;
  bool _onlineConsultation = false;
  final _consultationFeeController = TextEditingController();
  final _startingChargesController = TextEditingController();
  final _homeVisitChargesController = TextEditingController();
  bool _freeConsultation = false;

  // Trust & Media
  final _languagesController = TextEditingController();
  final _clientsServedController = TextEditingController();
  List<File> _officePhotos = [];
  List<File> _certificates = [];

  final _picker = ImagePicker();

  void _onCategoryChanged(String? val) {
    setState(() {
      _selectedCategory = val;
      _specificTextControllers.clear();
      _specificCheckboxes.clear();
      
      if (val != null) {
        for (var label in LegalConstants.specificTextInputs[val] ?? []) {
          _specificTextControllers[label] = TextEditingController();
        }
        for (var label in LegalConstants.specificCheckboxes[val] ?? []) {
          _specificCheckboxes[label] = false;
        }
      }
    });
  }

  Future<void> _pickImages(List<File> list) async {
    final picked = await _picker.pickMultiImage(imageQuality: 70);
    if (picked.isNotEmpty) {
      setState(() => list.addAll(picked.map((x) => File(x.path))));
    }
  }

  Widget _buildStep1() {
    return Column(
      children: [
        DropdownButtonFormField<String>(
          decoration: const InputDecoration(labelText: 'Category *', border: OutlineInputBorder()),
          value: _selectedCategory,
          items: LegalConstants.categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
          onChanged: _onCategoryChanged,
          validator: (v) => v == null ? 'Select category' : null,
        ),
        const SizedBox(height: 16),
        TextFormField(controller: _businessNameController, decoration: const InputDecoration(labelText: 'Business/Firm Name *'), validator: (v) => v!.isEmpty ? 'Required' : null),
        const SizedBox(height: 16),
        TextFormField(controller: _descriptionController, decoration: const InputDecoration(labelText: 'Description *'), maxLines: 3, validator: (v) => v!.isEmpty ? 'Required' : null),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: TextFormField(controller: _experienceController, decoration: const InputDecoration(labelText: 'Years of Experience'), keyboardType: TextInputType.number)),
            const SizedBox(width: 16),
            Expanded(child: TextFormField(controller: _gstController, decoration: const InputDecoration(labelText: 'GST Number (Optional)'))),
          ],
        ),
        const SizedBox(height: 16),
        TextFormField(controller: _licenseController, decoration: const InputDecoration(labelText: 'General License/Registration No')),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            ElevatedButton(onPressed: () async {
              final p = await _picker.pickImage(source: ImageSource.gallery);
              if (p != null) setState(() => _logoImage = File(p.path));
            }, child: Text(_logoImage == null ? 'Upload Logo' : 'Logo Selected')),
            ElevatedButton(onPressed: () async {
              final p = await _picker.pickImage(source: ImageSource.gallery);
              if (p != null) setState(() => _coverImage = File(p.path));
            }, child: Text(_coverImage == null ? 'Upload Cover' : 'Cover Selected')),
          ],
        )
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      children: [
        TextFormField(controller: _contactPersonController, decoration: const InputDecoration(labelText: 'Contact Person Name *'), validator: (v) => v!.isEmpty ? 'Required' : null),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: TextFormField(controller: _mobileController, decoration: const InputDecoration(labelText: 'Mobile Number *'), keyboardType: TextInputType.phone, validator: (v) => v!.isEmpty ? 'Required' : null)),
            const SizedBox(width: 16),
            Expanded(child: TextFormField(controller: _whatsappController, decoration: const InputDecoration(labelText: 'WhatsApp Number'), keyboardType: TextInputType.phone)),
          ],
        ),
        const SizedBox(height: 16),
        TextFormField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email Address'), keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 16),
        TextFormField(controller: _addressController, decoration: const InputDecoration(labelText: 'Office Address *'), maxLines: 2, validator: (v) => v!.isEmpty ? 'Required' : null),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: TextFormField(controller: _districtController, decoration: const InputDecoration(labelText: 'District *'), validator: (v) => v!.isEmpty ? 'Required' : null)),
            const SizedBox(width: 16),
            Expanded(child: TextFormField(controller: _cityController, decoration: const InputDecoration(labelText: 'City/Town *'), validator: (v) => v!.isEmpty ? 'Required' : null)),
          ],
        ),
        const SizedBox(height: 16),
        TextFormField(controller: _googleMapsController, decoration: const InputDecoration(labelText: 'Google Maps Link')),
      ],
    );
  }

  Widget _buildStep3() {
    if (_selectedCategory == null) return const Text('Please select a category in Step 1 first.');
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Specific details for $_selectedCategory', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 16),
        ..._specificTextControllers.entries.map((e) => Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: TextFormField(controller: e.value, decoration: InputDecoration(labelText: e.key)),
        )),
        if (_specificCheckboxes.isNotEmpty) const Text('Services Offered:', style: TextStyle(fontWeight: FontWeight.bold)),
        ..._specificCheckboxes.entries.map((e) => CheckboxListTile(
          title: Text(e.key),
          value: e.value,
          onChanged: (val) => setState(() => _specificCheckboxes[e.key] = val ?? false),
          activeColor: _gold,
        )),
      ],
    );
  }

  Widget _buildStep4() {
    return Column(
      children: [
        TextFormField(controller: _serviceAreasController, decoration: const InputDecoration(labelText: 'Service Areas (Comma separated)')),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: TextFormField(controller: _workingDaysController, decoration: const InputDecoration(labelText: 'Working Days (e.g. Mon-Sat)'))),
            const SizedBox(width: 16),
            Expanded(child: TextFormField(controller: _workingHoursController, decoration: const InputDecoration(labelText: 'Working Hours (e.g. 10AM-6PM)'))),
          ],
        ),
        const SizedBox(height: 16),
        CheckboxListTile(title: const Text('Emergency Service Available'), value: _emergencyService, onChanged: (v) => setState(() => _emergencyService = v!), activeColor: _gold),
        CheckboxListTile(title: const Text('Home Visit Available'), value: _homeVisit, onChanged: (v) => setState(() => _homeVisit = v!), activeColor: _gold),
        CheckboxListTile(title: const Text('Online Consultation'), value: _onlineConsultation, onChanged: (v) => setState(() => _onlineConsultation = v!), activeColor: _gold),
        const Divider(),
        Row(
          children: [
            Expanded(child: TextFormField(controller: _consultationFeeController, decoration: const InputDecoration(labelText: 'Consultation Fee (₹)'), keyboardType: TextInputType.number)),
            const SizedBox(width: 16),
            Expanded(child: TextFormField(controller: _startingChargesController, decoration: const InputDecoration(labelText: 'Starting Charges (₹)'), keyboardType: TextInputType.number)),
          ],
        ),
        const SizedBox(height: 16),
        TextFormField(controller: _homeVisitChargesController, decoration: const InputDecoration(labelText: 'Home Visit Charges (₹)'), keyboardType: TextInputType.number),
        CheckboxListTile(title: const Text('Free Initial Consultation'), value: _freeConsultation, onChanged: (v) => setState(() => _freeConsultation = v!), activeColor: _gold),
      ],
    );
  }

  Widget _buildStep5() {
    return Column(
      children: [
        TextFormField(controller: _languagesController, decoration: const InputDecoration(labelText: 'Languages Known (Comma separated)')),
        const SizedBox(height: 16),
        TextFormField(controller: _clientsServedController, decoration: const InputDecoration(labelText: 'Total Clients Served'), keyboardType: TextInputType.number),
        const Divider(height: 32),
        ElevatedButton.icon(onPressed: () => _pickImages(_officePhotos), icon: const Icon(Icons.add_a_photo), label: Text('Add Office Photos (${_officePhotos.length})')),
        ElevatedButton.icon(onPressed: () => _pickImages(_certificates), icon: const Icon(Icons.description), label: Text('Add Certificates (${_certificates.length})')),
      ],
    );
  }

  Future<void> _submitProfile() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields.')));
      return;
    }
    
    setState(() => _isLoading = true);
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) throw Exception("User not logged in");

      String? logoUrl, coverUrl;
      List<String> officeUrls = [], certUrls = [];

      if (_logoImage != null) logoUrl = await R2StorageService.uploadFile(_logoImage!, 'legal/${DateTime.now().millisecondsSinceEpoch}_logo.jpg');
      if (_coverImage != null) coverUrl = await R2StorageService.uploadFile(_coverImage!, 'legal/${DateTime.now().millisecondsSinceEpoch}_cover.jpg');
      
      for (var f in _officePhotos) officeUrls.add(await R2StorageService.uploadFile(f, 'legal/${DateTime.now().millisecondsSinceEpoch}_office.jpg'));
      for (var f in _certificates) certUrls.add(await R2StorageService.uploadFile(f, 'legal/${DateTime.now().millisecondsSinceEpoch}_cert.jpg'));

      Map<String, dynamic> specificDetails = {};
      _specificTextControllers.forEach((k, v) => specificDetails[k] = v.text.trim());
      _specificCheckboxes.forEach((k, v) => specificDetails[k] = v);

      final data = {
        'user_id': user.id,
        'business_name': _businessNameController.text.trim(),
        'category': _selectedCategory,
        'description': _descriptionController.text.trim(),
        'years_experience': int.tryParse(_experienceController.text.trim()),
        'gst_number': _gstController.text.trim(),
        'license_number': _licenseController.text.trim(),
        'logo_url': logoUrl,
        'cover_photo_url': coverUrl,
        
        'contact_person': _contactPersonController.text.trim(),
        'mobile_number': _mobileController.text.trim(),
        'whatsapp_number': _whatsappController.text.trim(),
        'email': _emailController.text.trim(),
        'office_address': _addressController.text.trim(),
        'district': _districtController.text.trim(),
        'city_town': _cityController.text.trim(),
        'google_maps_url': _googleMapsController.text.trim(),
        
        'service_areas': _serviceAreasController.text.split(',').map((e) => e.trim()).toList(),
        'working_days': _workingDaysController.text.trim(),
        'working_hours': _workingHoursController.text.trim(),
        'emergency_service': _emergencyService,
        'home_visit_available': _homeVisit,
        'online_consultation': _onlineConsultation,
        'consultation_fee': int.tryParse(_consultationFeeController.text.trim()),
        'starting_charges': int.tryParse(_startingChargesController.text.trim()),
        'home_visit_charges': int.tryParse(_homeVisitChargesController.text.trim()),
        'free_consultation': _freeConsultation,
        
        'languages_known': _languagesController.text.split(',').map((e) => e.trim()).toList(),
        'total_clients_served': int.tryParse(_clientsServedController.text.trim()),
        'office_photos': officeUrls,
        'certificates': certUrls,
        'specific_details': specificDetails,
        
        'status': 'active',
        'expiry_date': DateTime.now().add(const Duration(days: 365)).toIso8601String(), // 1 year validity for free
      };

      data.removeWhere((key, value) => value == '' || value == null);

      await Supabase.instance.client.from('legal_partners').insert(data);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Legal Partner registered successfully!'), backgroundColor: Colors.green));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(backgroundColor: Colors.white, title: Text('Become Legal Partner', style: GoogleFonts.outfit(color: Colors.black)), iconTheme: const IconThemeData(color: Colors.black)),
      body: _isLoading ? const Center(child: CircularProgressIndicator(color: _gold)) : Form(
        key: _formKey,
        child: Stepper(
          currentStep: _currentStep,
          onStepContinue: () {
            if (_currentStep < 5) {
              setState(() => _currentStep += 1);
            } else {
              _submitProfile();
            }
          },
          onStepCancel: () {
            if (_currentStep > 0) setState(() => _currentStep--);
          },
          controlsBuilder: (ctx, details) => Padding(
            padding: const EdgeInsets.only(top: 16.0),
            child: Row(
              children: [
                Expanded(child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: _gold, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 14)),
                  onPressed: details.onStepContinue,
                  child: Text(_currentStep == 5 ? 'Submit Application' : 'Continue', style: const TextStyle(fontWeight: FontWeight.bold)),
                )),
                if (_currentStep > 0) ...[
                  const SizedBox(width: 12),
                  Expanded(child: OutlinedButton(
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.black, padding: const EdgeInsets.symmetric(vertical: 14)),
                    onPressed: details.onStepCancel,
                    child: const Text('Back'),
                  ))
                ]
              ],
            ),
          ),
          steps: [
            Step(title: const Text('Basic Info'), content: _buildStep1(), isActive: _currentStep >= 0),
            Step(title: const Text('Location & Contact'), content: _buildStep2(), isActive: _currentStep >= 1),
            Step(title: const Text('Specialization Details'), content: _buildStep3(), isActive: _currentStep >= 2),
            Step(title: const Text('Availability & Pricing'), content: _buildStep4(), isActive: _currentStep >= 3),
            Step(title: const Text('Trust & Media'), content: _buildStep5(), isActive: _currentStep >= 4),
            Step(title: const Text('Preview & Pay'), content: const Text('You will be charged ₹100 for 30 days of listing validity. Click below to proceed to Razorpay.', style: TextStyle(fontSize: 16)), isActive: _currentStep >= 5),
          ],
        ),
      ),
    );
  }
}
