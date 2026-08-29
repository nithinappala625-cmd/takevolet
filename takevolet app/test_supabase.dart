import 'package:supabase/supabase.dart';

Future<void> main() async {
  final supabaseUrl = 'https://gfhmdpzmhakznuqhstrn.supabase.co';
  final supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG1kcHptaGFrem51cWhzdHJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMjc3MTMsImV4cCI6MjEwMjgwMzcxM30.AnwbTfZNxU64QntSJVIsJoEqflIuOPqSSWs9CUb8-TE';
  
  final client = SupabaseClient(supabaseUrl, supabaseAnonKey);
  
  print('Testing bookings...');
  try {
    final data = await client.from('bookings').select().limit(1);
    print('Bookings success: $data');
  } catch (e) {
    print('Bookings error: $e');
  }

  print('Testing build_listings...');
  try {
    final data = await client.from('build_listings').select().limit(1);
    print('Build listings success: $data');
  } catch (e) {
    print('Build listings error: $e');
  }
}
