import 'package:supabase_flutter/supabase_flutter.dart';

class DynamicFormsService {
  final _supabase = Supabase.instance.client;

  /// Fetches the dynamic schema for a given category (e.g. 'properties', 'marketplace')
  Future<List<Map<String, dynamic>>> getFormSchema(String category) async {
    try {
      // 1. Get the published form definition ID for the category
      final formDef = await _supabase
          .from('form_definitions')
          .select('id')
          .eq('slug', category)
          .eq('status', 'published')
          .eq('is_active', true)
          .maybeSingle();

      if (formDef == null) {
        // Fallback to old behavior if no relational definition exists
        final oldResponse = await _supabase
            .from('dynamic_forms')
            .select('fields_schema')
            .eq('category', category)
            .maybeSingle();

        if (oldResponse != null && oldResponse['fields_schema'] != null) {
          return List<Map<String, dynamic>>.from(oldResponse['fields_schema']);
        }
        return [];
      }

      // 2. Fetch the relational fields and their options
      final fieldsData = await _supabase
          .from('form_fields')
          .select('*, field_options(*)')
          .eq('form_id', formDef['id'])
          .order('sort_order', ascending: true);

      // 3. Map it to the schema format the widget expects
      return (fieldsData as List).map((field) {
        // Sort options by sort_order
        final optionsList = (field['field_options'] as List?) ?? [];
        optionsList.sort((a, b) => (a['sort_order'] as int? ?? 0).compareTo(b['sort_order'] as int? ?? 0));

        return {
          'key': field['field_key'],
          'label': field['label'],
          'type': field['field_type'],
          'placeholder': field['placeholder'],
          'required': field['is_required'],
          'visible': field['is_visible'],
          'visibility_rules': field['visibility_rules'],
          'options': optionsList.map((o) => {
            'label': o['label'], 
            'value': o['value']
          }).toList(),
        };
      }).toList();
      
    } catch (e) {
      print('Error fetching dynamic forms schema for $category: $e');
      return [];
    }
  }
}
