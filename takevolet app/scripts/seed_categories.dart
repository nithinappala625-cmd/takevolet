import 'package:supabase/supabase.dart';

void main() async {
  final supabase = SupabaseClient(
    'https://gfhmdpzmhakznuqhstrn.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG1kcHptaGFrem51cWhzdHJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMjc3MTMsImV4cCI6MjEwMjgwMzcxM30.AnwbTfZNxU64QntSJVIsJoEqflIuOPqSSWs9CUb8-TE'
  );

  print('Deleting existing...');
  try {
    await supabase.from('build_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  } catch(e) {
    print('Delete failed, proceeding anyway... \$e');
  }

  final categories = [
    { 'main_category': 'service', 'sub_category': 'Architect', 'icon_name': 'architecture' },
    { 'main_category': 'service', 'sub_category': 'Civil Engineer', 'icon_name': 'engineering' },
    { 'main_category': 'service', 'sub_category': 'Contractor', 'icon_name': 'handyman' },
    { 'main_category': 'service', 'sub_category': 'Builder', 'icon_name': 'foundation' },
    { 'main_category': 'service', 'sub_category': 'Site Engineer', 'icon_name': 'architecture' },
    { 'main_category': 'service', 'sub_category': 'Mason', 'icon_name': 'handyman' },
    { 'main_category': 'service', 'sub_category': 'Electrician', 'icon_name': 'electrical_services' },
    { 'main_category': 'service', 'sub_category': 'Plumber', 'icon_name': 'plumbing' },
    { 'main_category': 'service', 'sub_category': 'Carpenter', 'icon_name': 'carpenter' },
    { 'main_category': 'service', 'sub_category': 'Painter', 'icon_name': 'format_paint' },
    { 'main_category': 'service', 'sub_category': 'Interior Designer', 'icon_name': 'chair' },
    { 'main_category': 'service', 'sub_category': 'Vasthu Checker', 'icon_name': 'explore' },
    { 'main_category': 'service', 'sub_category': 'Surveyor', 'icon_name': 'square_foot' },
    { 'main_category': 'service', 'sub_category': 'Borewell Operator', 'icon_name': 'water_drop' },
    { 'main_category': 'service', 'sub_category': 'Site Supervisor', 'icon_name': 'engineering' },
    
    { 'main_category': 'material', 'sub_category': 'Cement Supplier', 'icon_name': 'category' },
    { 'main_category': 'material', 'sub_category': 'Steel Supplier', 'icon_name': 'category' },
    { 'main_category': 'material', 'sub_category': 'Bricks Supplier', 'icon_name': 'category' },
    { 'main_category': 'material', 'sub_category': 'Sand & Aggregates', 'icon_name': 'category' },
    { 'main_category': 'material', 'sub_category': 'Electrical Supplier', 'icon_name': 'category' },
    { 'main_category': 'material', 'sub_category': 'Plumbing Material', 'icon_name': 'category' },
    { 'main_category': 'material', 'sub_category': 'Tiles & Flooring', 'icon_name': 'category' },
    { 'main_category': 'material', 'sub_category': 'Paint Supplier', 'icon_name': 'category' },
    { 'main_category': 'material', 'sub_category': 'Wood & Glass Supplier', 'icon_name': 'category' },
    
    { 'main_category': 'transport', 'sub_category': 'JCB', 'icon_name': 'local_shipping' },
    { 'main_category': 'transport', 'sub_category': 'Bulldozer', 'icon_name': 'local_shipping' },
    { 'main_category': 'transport', 'sub_category': 'Crane', 'icon_name': 'local_shipping' },
    { 'main_category': 'transport', 'sub_category': 'Borewell Rig', 'icon_name': 'local_shipping' },
    { 'main_category': 'transport', 'sub_category': 'Lorry', 'icon_name': 'local_shipping' },
    { 'main_category': 'transport', 'sub_category': 'Tractor', 'icon_name': 'agriculture' },
    { 'main_category': 'transport', 'sub_category': 'Tipper', 'icon_name': 'local_shipping' },
    { 'main_category': 'transport', 'sub_category': 'Concrete Mixer', 'icon_name': 'local_shipping' },
    { 'main_category': 'transport', 'sub_category': 'Scaffolding', 'icon_name': 'category' },
    { 'main_category': 'transport', 'sub_category': 'Lifting Equipment', 'icon_name': 'category' },
    
    { 'main_category': 'project', 'sub_category': 'Residential', 'icon_name': 'house' },
    { 'main_category': 'project', 'sub_category': 'Commercial', 'icon_name': 'storefront' },
    { 'main_category': 'project', 'sub_category': 'Apartment', 'icon_name': 'apartment' },
    { 'main_category': 'project', 'sub_category': 'Villa', 'icon_name': 'villa' }
  ];

  for (var c in categories) {
    try {
      await supabase.from('build_categories').insert(c);
      print('Inserted ' + c['sub_category'].toString());
    } catch (e) {
      print('Error inserting ' + c['sub_category'].toString() + ': \$e');
    }
  }
  print('Done seeding!');
}
