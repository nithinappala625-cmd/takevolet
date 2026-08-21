import 'package:supabase_flutter/supabase_flutter.dart';

class DynamicFormsService {
  final _supabase = Supabase.instance.client;

  /// Fetches the dynamic schema for a given category (e.g. 'properties', 'marketplace')
  Future<List<Map<String, dynamic>>> getFormSchema(String category) async {
    try {
      final response = await _supabase
          .from('dynamic_forms')
          .select('fields_schema')
          .eq('category', category)
          .maybeSingle();

      if (response != null && response['fields_schema'] != null) {
        return List<Map<String, dynamic>>.from(response['fields_schema']);
      }
      return [];
    } catch (e) {
      print('Error fetching dynamic forms schema for $category: $e');
      return [];
    }
  }
}
