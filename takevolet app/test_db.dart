import 'package:supabase/supabase.dart';

void main() async {
  final supabase = SupabaseClient(
    'https://vwcqovrbvhztpkultqjl.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Y3FvdnJidmh6dHBrdWx0cWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MjA2MDgsImV4cCI6MjA5MzM5NjYwOH0.YeBYsG0MRwwLT3fKbV2oDaugyW86PS6YfIirLEvc2R8',
  );

  try {
    print('Testing SELECT from notifications...');
    final response = await supabase.from('notifications').select().limit(5);
    print('Success: $response');
  } catch (e) {
    print('Error on SELECT: $e');
  }

  try {
    print('Testing INSERT into notifications...');
    final response = await supabase.from('notifications').insert({
      'title': 'Test Title',
      'message': 'Test Message',
      'type': 'test'
    }).select();
    print('Success: $response');
  } catch (e) {
    print('Error on INSERT: $e');
  }
}
