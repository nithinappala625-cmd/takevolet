import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';

class AppConfigDashboard extends StatefulWidget {
  const AppConfigDashboard({Key? key}) : super(key: key);

  @override
  State<AppConfigDashboard> createState() => _AppConfigDashboardState();
}

class _AppConfigDashboardState extends State<AppConfigDashboard> {
  final _supabase = Supabase.instance.client;
  bool _isLoading = true;
  List<Map<String, dynamic>> _forms = [];

  @override
  void initState() {
    super.initState();
    _loadForms();
  }

  Future<void> _loadForms() async {
    setState(() => _isLoading = true);
    try {
      final data = await _supabase.from('form_definitions').select().order('created_at');
      setState(() {
        _forms = List<Map<String, dynamic>>.from(data);
      });
    } catch (e) {
      debugPrint('Error loading forms: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('App Configuration'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Form Definitions',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add),
                        label: const Text('New Form'),
                        onPressed: () {
                          // TODO: Create new form definition and push to builder
                        },
                      )
                    ],
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: _forms.isEmpty
                        ? const Center(child: Text('No forms found. Create one!'))
                        : ListView.builder(
                            itemCount: _forms.length,
                            itemBuilder: (context, index) {
                              final form = _forms[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                child: ListTile(
                                  title: Text(form['name'] ?? 'Untitled'),
                                  subtitle: Text('Entity: ${form['entity_type']} | Status: ${form['status']}'),
                                  trailing: const Icon(Icons.edit),
                                  onTap: () {
                                    context.push('/admin/app-config/form-builder', extra: form);
                                  },
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            ),
    );
  }
}
