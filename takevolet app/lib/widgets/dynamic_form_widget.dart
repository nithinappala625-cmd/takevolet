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
      if (field['type'] == 'text' || field['type'] == 'long_text' || field['type'] == 'number') {
        final String key = (field['name'] ?? field['key'] ?? '').toString();
        _controllers[key] = TextEditingController(
          text: _formData[key]?.toString() ?? '',
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

  bool _isFieldVisible(Map<String, dynamic> field) {
    final bool defaultVisible = field['visible'] ?? true;
    final List<dynamic>? rules = field['visibility_rules'];

    if (rules == null || rules.isEmpty) return defaultVisible;

    // Evaluate rules (simplified: ALL must match)
    for (var rule in rules) {
      if (rule is Map<String, dynamic>) {
        final targetField = rule['field'];
        final targetValue = rule['value'];
        final operator = rule['operator'] ?? '==';

        final currentValue = _formData[targetField];

        if (operator == '==') {
          if (currentValue != targetValue) return false;
        } else if (operator == '!=') {
          if (currentValue == targetValue) return false;
        }
      }
    }

    return true;
  }

  @override
  Widget build(BuildContext context) {
    if (widget.schema.isEmpty) return const SizedBox.shrink();

    // Filter visible fields
    final visibleFields = widget.schema.where(_isFieldVisible).toList();

    if (visibleFields.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 20),
        const Text(
          'Additional Details',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        ...visibleFields.map((field) {
          final String type = field['type'] ?? 'text';
          final String key = (field['name'] ?? field['key'] ?? '').toString();
          final String label = field['label'] ?? '';
          final bool required = field['required'] ?? false;
          final List<dynamic>? options = field['options'];

          Widget fieldWidget;

          if ((type == 'dropdown' || type == 'radio') && options != null) {
            fieldWidget = DropdownButtonFormField<String>(
              value: _formData[key]?.toString().isNotEmpty == true 
                  ? _formData[key].toString() 
                  : null,
              decoration: InputDecoration(
                labelText: '$label${required ? ' *' : ''}',
                border: const OutlineInputBorder(),
              ),
              items: options.map((opt) {
                // Support both old simple string list and new map list
                final String optLabel = opt is Map ? (opt['label'] ?? opt['value']).toString() : opt.toString();
                final String optValue = opt is Map ? (opt['value'] ?? opt['label']).toString() : opt.toString();

                return DropdownMenuItem<String>(
                  value: optValue,
                  child: Text(optLabel),
                );
              }).toList(),
              onChanged: (val) {
                if (val != null) _updateField(key, val);
              },
              validator: required ? (v) => v == null || v.isEmpty ? 'Required' : null : null,
            );
          } else if (type == 'checkbox') {
            fieldWidget = CheckboxListTile(
              title: Text('$label${required ? ' *' : ''}'),
              value: _formData[key] == true || _formData[key] == 'true',
              onChanged: (val) {
                if (val != null) _updateField(key, val);
              },
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
            );
          } else {
            // Text, Long Text, or Number
            fieldWidget = TextFormField(
              controller: _controllers[key],
              decoration: InputDecoration(
                labelText: '$label${required ? ' *' : ''}',
                hintText: field['placeholder'],
                border: const OutlineInputBorder(),
              ),
              maxLines: type == 'long_text' ? 3 : 1,
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
