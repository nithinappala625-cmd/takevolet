import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AdminJsonEditorScreen extends StatefulWidget {
  final String tableName;
  final Map<String, dynamic> item;

  const AdminJsonEditorScreen({
    super.key,
    required this.tableName,
    required this.item,
  });

  @override
  State<AdminJsonEditorScreen> createState() => _AdminJsonEditorScreenState();
}

class _AdminJsonEditorScreenState extends State<AdminJsonEditorScreen> {
  bool _isLoading = false;
  late Map<String, dynamic> _metadata;
  late Map<String, dynamic> _rootData;
  
  // Controllers for metadata entries
  final Map<String, TextEditingController> _metadataControllers = {};

  @override
  void initState() {
    super.initState();
    _metadata = Map<String, dynamic>.from(widget.item['metadata'] ?? {});
    _rootData = Map<String, dynamic>.from(widget.item);
    _rootData.remove('metadata');
    
    // Initialize controllers
    _metadata.forEach((key, value) {
      _metadataControllers[key] = TextEditingController(text: value?.toString() ?? '');
    });
  }

  @override
  void dispose() {
    for (var controller in _metadataControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _addNewField() {
    final keyController = TextEditingController();
    final valController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add New Field'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: keyController,
              decoration: const InputDecoration(labelText: 'Field Key (e.g. max_guests)'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: valController,
              decoration: const InputDecoration(labelText: 'Field Value (e.g. 4)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              final key = keyController.text.trim();
              final val = valController.text.trim();
              if (key.isNotEmpty) {
                setState(() {
                  _metadata[key] = val;
                  _metadataControllers[key] = TextEditingController(text: val);
                });
                Navigator.pop(ctx);
              }
            },
            child: const Text('Add'),
          )
        ],
      ),
    );
  }

  Future<void> _saveChanges() async {
    setState(() => _isLoading = true);
    
    try {
      // Update metadata with current controller values
      _metadataControllers.forEach((key, controller) {
        _metadata[key] = controller.text;
      });

      await Supabase.instance.client
          .from(widget.tableName)
          .update({'metadata': _metadata})
          .eq('id', widget.item['id']);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Changes saved successfully!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context, true); // true indicates refresh needed
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Dynamic Editor: ${widget.tableName}'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Add new dynamic field',
            onPressed: _addNewField,
          ),
          IconButton(
            icon: const Icon(Icons.save),
            tooltip: 'Save Changes',
            onPressed: _isLoading ? null : _saveChanges,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.withOpacity(0.3)),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.blue),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          "Any field added here will automatically appear on the item's detail screen in the app without requiring an update!",
                          style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'Dynamic Fields (Metadata)',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                if (_metadata.isEmpty)
                  const Text('No dynamic fields found. Tap + to add one.', style: TextStyle(color: Colors.grey)),
                ..._metadata.keys.map((key) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _metadataControllers[key],
                            decoration: InputDecoration(
                              labelText: key,
                              border: const OutlineInputBorder(),
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () {
                            setState(() {
                              _metadata.remove(key);
                              _metadataControllers[key]?.dispose();
                              _metadataControllers.remove(key);
                            });
                          },
                        ),
                      ],
                    ),
                  );
                }),
                
                const SizedBox(height: 32),
                const Divider(),
                const SizedBox(height: 16),
                const Text(
                  'Root Database Values (Read-Only)',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text('To edit these core values, use the standard edit form or migrate them to dynamic fields.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 16),
                ..._rootData.entries.where((e) => e.key != 'images' && e.key != 'full_address').map((e) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(width: 120, child: Text(e.key, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey))),
                        Expanded(child: Text(e.value?.toString() ?? 'null')),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 100),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addNewField,
        icon: const Icon(Icons.add),
        label: const Text('Add Field'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
    );
  }
}
