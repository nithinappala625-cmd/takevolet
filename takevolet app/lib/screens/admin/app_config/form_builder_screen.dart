import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import 'field_options_screen.dart';

class FormBuilderScreen extends StatefulWidget {
  final Map<String, dynamic>? formDefinition;

  const FormBuilderScreen({Key? key, this.formDefinition}) : super(key: key);

  @override
  State<FormBuilderScreen> createState() => _FormBuilderScreenState();
}

class _FormBuilderScreenState extends State<FormBuilderScreen> {
  final _supabase = Supabase.instance.client;
  bool _isLoading = true;
  List<Map<String, dynamic>> _fields = [];
  Map<String, dynamic>? _formDef;

  @override
  void initState() {
    super.initState();
    _formDef = widget.formDefinition;
    if (_formDef != null) {
      _loadFields();
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadFields() async {
    setState(() => _isLoading = true);
    try {
      final data = await _supabase
          .from('form_fields')
          .select()
          .eq('form_id', _formDef!['id'])
          .order('sort_order', ascending: true);
      setState(() {
        _fields = List<Map<String, dynamic>>.from(data);
      });
    } catch (e) {
      debugPrint('Error loading fields: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _reorderFields(int oldIndex, int newIndex) async {
    if (newIndex > oldIndex) newIndex -= 1;
    setState(() {
      final item = _fields.removeAt(oldIndex);
      _fields.insert(newIndex, item);
    });

    for (int i = 0; i < _fields.length; i++) {
      _fields[i]['sort_order'] = i;
    }

    try {
      final updates = _fields.map((f) => {
        'id': f['id'],
        'sort_order': f['sort_order'],
      }).toList();
      
      await _supabase.from('form_fields').upsert(updates);
    } catch (e) {
      debugPrint('Error updating sort order: $e');
      _loadFields(); // Revert on failure
    }
  }

  void _showAddFieldModal({Map<String, dynamic>? existingField}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _FieldEditorModal(
        formId: _formDef!['id'],
        existingField: existingField,
        onSaved: () {
          Navigator.pop(ctx);
          _loadFields();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_formDef == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('New Form Definition')),
        body: const Center(child: Text('Please save the form definition first before adding fields.')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('${_formDef!['name']} - Builder'),
        actions: [
          IconButton(
            icon: const Icon(Icons.preview),
            tooltip: 'Preview Form',
            onPressed: () {
              // TODO: Mobile Preview
            },
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _fields.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('No fields configured yet.'),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add),
                        label: const Text('Add First Field'),
                        onPressed: () => _showAddFieldModal(),
                      )
                    ],
                  ),
                )
              : ReorderableListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _fields.length,
                  onReorder: _reorderFields,
                  itemBuilder: (context, index) {
                    final field = _fields[index];
                    return Card(
                      key: ValueKey(field['id']),
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: const Icon(Icons.drag_handle, color: Colors.grey),
                        title: Text('${field['label']} (${field['field_key']})'),
                        subtitle: Text('Type: ${field['field_type']} | Required: ${field['is_required']} | Visible: ${field['is_visible']}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (field['field_type'] == 'dropdown' || field['field_type'] == 'radio')
                              IconButton(
                                icon: const Icon(Icons.list),
                                tooltip: 'Manage Options',
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(builder: (_) => FieldOptionsScreen(field: field)),
                                  );
                                },
                              ),
                            IconButton(
                              icon: const Icon(Icons.edit),
                              onPressed: () => _showAddFieldModal(existingField: field),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddFieldModal(),
        icon: const Icon(Icons.add),
        label: const Text('Add Field'),
      ),
    );
  }
}

class _FieldEditorModal extends StatefulWidget {
  final String formId;
  final Map<String, dynamic>? existingField;
  final VoidCallback onSaved;

  const _FieldEditorModal({required this.formId, this.existingField, required this.onSaved});

  @override
  State<_FieldEditorModal> createState() => _FieldEditorModalState();
}

class _FieldEditorModalState extends State<_FieldEditorModal> {
  final _formKey = GlobalKey<FormState>();
  final _supabase = Supabase.instance.client;

  late TextEditingController _labelController;
  late TextEditingController _keyController;
  late TextEditingController _placeholderController;
  String _fieldType = 'text';
  bool _isRequired = false;
  bool _isVisible = true;

  @override
  void initState() {
    super.initState();
    _labelController = TextEditingController(text: widget.existingField?['label'] ?? '');
    _keyController = TextEditingController(text: widget.existingField?['field_key'] ?? '');
    _placeholderController = TextEditingController(text: widget.existingField?['placeholder'] ?? '');
    _fieldType = widget.existingField?['field_type'] ?? 'text';
    _isRequired = widget.existingField?['is_required'] ?? false;
    _isVisible = widget.existingField?['is_visible'] ?? true;
  }

  Future<void> _saveField() async {
    if (!_formKey.currentState!.validate()) return;
    
    final payload = {
      'form_id': widget.formId,
      'field_key': _keyController.text,
      'label': _labelController.text,
      'field_type': _fieldType,
      'placeholder': _placeholderController.text,
      'is_required': _isRequired,
      'is_visible': _isVisible,
    };

    try {
      if (widget.existingField != null) {
        await _supabase.from('form_fields').update(payload).eq('id', widget.existingField!['id']);
      } else {
        await _supabase.from('form_fields').insert(payload);
      }
      widget.onSaved();
    } catch (e) {
      debugPrint('Save field error: $e');
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 24, right: 24, top: 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(widget.existingField != null ? 'Edit Field' : 'Add Field', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextFormField(
                controller: _labelController,
                decoration: const InputDecoration(labelText: 'Field Label (e.g., Road Width)'),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _keyController,
                decoration: const InputDecoration(labelText: 'Field Key (e.g., road_width)'),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _fieldType,
                decoration: const InputDecoration(labelText: 'Field Type'),
                items: const [
                  DropdownMenuItem(value: 'text', child: Text('Text')),
                  DropdownMenuItem(value: 'long_text', child: Text('Long Text')),
                  DropdownMenuItem(value: 'number', child: Text('Number')),
                  DropdownMenuItem(value: 'dropdown', child: Text('Dropdown')),
                  DropdownMenuItem(value: 'radio', child: Text('Radio Button')),
                  DropdownMenuItem(value: 'checkbox', child: Text('Checkbox')),
                ],
                onChanged: (v) => setState(() => _fieldType = v!),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _placeholderController,
                decoration: const InputDecoration(labelText: 'Placeholder Text'),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text('Required'),
                value: _isRequired,
                onChanged: (v) => setState(() => _isRequired = v),
              ),
              SwitchListTile(
                title: const Text('Visible by Default'),
                value: _isVisible,
                onChanged: (v) => setState(() => _isVisible = v),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _saveField,
                child: const Text('Save Field'),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
