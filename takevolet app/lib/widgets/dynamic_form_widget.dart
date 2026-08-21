import 'package:flutter/material.dart';

class DynamicFormWidget extends StatefulWidget {
  final List<Map<String, dynamic>> schema;
  final Map<String, dynamic> initialData;
  final Function(Map<String, dynamic>) onDataChanged;

  const DynamicFormWidget({
    Key? key,
    required this.schema,
    required this.initialData,
    required this.onDataChanged,
  }) : super(key: key);

  @override
  _DynamicFormWidgetState createState() => _DynamicFormWidgetState();
}

class _DynamicFormWidgetState extends State<DynamicFormWidget> {
  late Map<String, dynamic> _formData;
  final Map<String, TextEditingController> _controllers = {};

  @override
  void initState() {
    super.initState();
    _formData = Map<String, dynamic>.from(widget.initialData);
    
    // Initialize controllers for text/number fields
    for (var field in widget.schema) {
      if (field['type'] == 'text' || field['type'] == 'number') {
        _controllers[field['key']] = TextEditingController(
          text: _formData[field['key']]?.toString() ?? '',
        );
      }
    }
  }

  @override
  void dispose() {
    for (var controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _updateField(String key, dynamic value) {
    setState(() {
      _formData[key] = value;
    });
    widget.onDataChanged(_formData);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.schema.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        const Text(
          'Additional Details',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        ...widget.schema.map((field) {
          final String type = field['type'] ?? 'text';
          final String key = field['key'] ?? '';
          final String label = field['label'] ?? '';
          final bool required = field['required'] ?? false;
          final List<dynamic>? options = field['options'];

          Widget fieldWidget;

          if (type == 'dropdown' && options != null) {
            fieldWidget = DropdownButtonFormField<String>(
              value: _formData[key]?.toString().isNotEmpty == true 
                  ? _formData[key].toString() 
                  : null,
              decoration: InputDecoration(
                labelText: '$label${required ? ' *' : ''}',
                border: const OutlineInputBorder(),
              ),
              items: options.map((opt) {
                return DropdownMenuItem<String>(
                  value: opt.toString(),
                  child: Text(opt.toString()),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) _updateField(key, val);
              },
              validator: required ? (v) => v == null || v.isEmpty ? 'Required' : null : null,
            );
          } else {
            // Text or Number
            fieldWidget = TextFormField(
              controller: _controllers[key],
              decoration: InputDecoration(
                labelText: '$label${required ? ' *' : ''}',
                hintText: field['placeholder'],
                border: const OutlineInputBorder(),
              ),
              keyboardType: type == 'number' ? TextInputType.number : TextInputType.text,
              onChanged: (val) {
                _updateField(key, val);
              },
              validator: required ? (v) => v == null || v.trim().isEmpty ? 'Required' : null : null,
            );
          }

          return Padding(
            padding: const EdgeInsets.only(bottom: 15.0),
            child: fieldWidget,
          );
        }).toList(),
      ],
    );
  }
}
