import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../main.dart';

class AddFlatmateScreen extends StatefulWidget {
  const AddFlatmateScreen({super.key});

  @override
  State<AddFlatmateScreen> createState() => _AddFlatmateScreenState();
}

class _AddFlatmateScreenState extends State<AddFlatmateScreen> {
  final _titleController = TextEditingController();
  final _rentController = TextEditingController();
  final _vacancyController = TextEditingController(text: '1');
  final _locationController = TextEditingController();
  
  String _genderPref = 'Any';
  bool _isLoading = false;

  Future<void> _submit() async {
    setState(() => _isLoading = true);
    try {
      final user = supabase.auth.currentUser;
      if (user == null) throw Exception('You must be logged in.');

      await supabase.from('flatmates').insert({
        'user_id': user.id,
        'title': _titleController.text.isNotEmpty ? _titleController.text : 'Looking for Flatmate',
        'rent_share': int.tryParse(_rentController.text) ?? 0,
        'vacancy_count': int.tryParse(_vacancyController.text) ?? 1,
        'gender_pref': _genderPref,
        'location': _locationController.text,
        'is_available': true,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Flatmate posted successfully!')));
        context.go('/flatmates');
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
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
      appBar: AppBar(title: const Text('Find a Flatmate')),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : ListView(
          padding: const EdgeInsets.all(24),
          children: [
            const Text('Post a vacancy for your flat', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            TextField(controller: _titleController, decoration: _inputDeco('Title', Icons.title)),
            const SizedBox(height: 16),
            TextField(controller: _locationController, decoration: _inputDeco('Location / Area', Icons.location_on)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: TextField(controller: _rentController, decoration: _inputDeco('Rent Share (₹)', Icons.currency_rupee), keyboardType: TextInputType.number)),
                const SizedBox(width: 16),
                Expanded(child: TextField(controller: _vacancyController, decoration: _inputDeco('Vacancies', Icons.person_add), keyboardType: TextInputType.number)),
              ],
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _genderPref,
              decoration: _inputDeco('Gender Preference', Icons.wc),
              items: ['Any', 'Male', 'Female'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: (val) => setState(() => _genderPref = val!),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _submit,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Post Flatmate Vacancy', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            )
          ],
        ),
    );
  }
}
