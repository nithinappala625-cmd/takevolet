import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class FieldOptionsScreen extends StatefulWidget {
  final Map<String, dynamic> field;

  const FieldOptionsScreen({Key? key, required this.field}) : super(key: key);

  @override
  State<FieldOptionsScreen> createState() => _FieldOptionsScreenState();
}

class _FieldOptionsScreenState extends State<FieldOptionsScreen> {
  final _supabase = Supabase.instance.client;
  bool _isLoading = true;
  List<Map<String, dynamic>> _options = [];

  @override
  void initState() {
    super.initState();
    _loadOptions();
  }

  Future<void> _loadOptions() async {
    setState(() => _isLoading = true);
    try {
      final data = await _supabase
          .from('field_options')
          .select()
          .eq('field_id', widget.field['id'])
          .order('sort_order', ascending: true);
      setState(() {
        _options = List<Map<String, dynamic>>.from(data);
      });
    } catch (e) {
      debugPrint('Error loading options: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _reorderOptions(int oldIndex, int newIndex) async {
    if (newIndex > oldIndex) newIndex -= 1;
    setState(() {
      final item = _options.removeAt(oldIndex);
      _options.insert(newIndex, item);
    });

    for (int i = 0; i < _options.length; i++) {
      _options[i]['sort_order'] = i;
    }

    try {
      final updates = _options.map((o) => {
        'id': o['id'],
        'sort_order': o['sort_order'],
      }).toList();
      
      await _supabase.from('field_options').upsert(updates);
    } catch (e) {
      debugPrint('Error updating sort order: $e');
      _loadOptions();
    }
  }

  void _showAddOptionModal({Map<String, dynamic>? existingOption}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _OptionEditorModal(
        fieldId: widget.field['id'],
        existingOption: existingOption,
        onSaved: () {
          Navigator.pop(ctx);
          _loadOptions();
        },
      ),
    );
  }

  Future<void> _deleteOption(String id) async {
    try {
      await _supabase.from('field_options').delete().eq('id', id);
      _loadOptions();
    } catch (e) {
      debugPrint('Error deleting option: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Options for ${widget.field['label']}'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _options.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('No options added yet.'),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add),
                        label: const Text('Add Option'),
                        onPressed: () => _showAddOptionModal(),
                      )
                    ],
                  ),
                )
              : ReorderableListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _options.length,
                  onReorder: _reorderOptions,
                  itemBuilder: (context, index) {
                    final option = _options[index];
                    return Card(
                      key: ValueKey(option['id']),
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: const Icon(Icons.drag_handle, color: Colors.grey),
                        title: Text(option['label']),
                        subtitle: Text('Value: ${option['value']}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.edit, color: Colors.blue),
                              onPressed: () => _showAddOptionModal(existingOption: option),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _deleteOption(option['id']),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddOptionModal(),
        icon: const Icon(Icons.add),
        label: const Text('Add Option'),
      ),
    );
  }
}

class _OptionEditorModal extends StatefulWidget {
  final String fieldId;
  final Map<String, dynamic>? existingOption;
  final VoidCallback onSaved;

  const _OptionEditorModal({required this.fieldId, this.existingOption, required this.onSaved});

  @override
  State<_OptionEditorModal> createState() => _OptionEditorModalState();
}

class _OptionEditorModalState extends State<_OptionEditorModal> {
  final _formKey = GlobalKey<FormState>();
  final _supabase = Supabase.instance.client;

  late TextEditingController _labelController;
  late TextEditingController _valueController;
  bool _isActive = true;

  @override
  void initState() {
    super.initState();
    _labelController = TextEditingController(text: widget.existingOption?['label'] ?? '');
    _valueController = TextEditingController(text: widget.existingOption?['value'] ?? '');
    _isActive = widget.existingOption?['is_active'] ?? true;
  }

  Future<void> _saveOption() async {
    if (!_formKey.currentState!.validate()) return;
    
    final payload = {
      'field_id': widget.fieldId,
      'label': _labelController.text,
      'value': _valueController.text,
      'is_active': _isActive,
    };

    try {
      if (widget.existingOption != null) {
        await _supabase.from('field_options').update(payload).eq('id', widget.existingOption!['id']);
      } else {
        await _supabase.from('field_options').insert(payload);
      }
      widget.onSaved();
    } catch (e) {
      debugPrint('Save option error: $e');
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
              Text(widget.existingOption != null ? 'Edit Option' : 'Add Option', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 16),
              TextFormField(
                controller: _labelController,
                decoration: const InputDecoration(labelText: 'Display Label (e.g., East Facing)'),
                validator: (v) => v!.isEmpty ? 'Required' : null,
                onChanged: (val) {
                  if (widget.existingOption == null && _valueController.text.isEmpty) {
                    _valueController.text = val.toLowerCase().replaceAll(' ', '_');
                  }
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _valueController,
                decoration: const InputDecoration(labelText: 'Internal Value (e.g., east_facing)'),
                validator: (v) => v!.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                title: const Text('Active'),
                value: _isActive,
                onChanged: (v) => setState(() => _isActive = v),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _saveOption,
                child: const Text('Save Option'),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
