import sys

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace("import 'package:geocoding/geocoding.dart';", "import 'package:geocoding/geocoding.dart' as geocoding;")
    content = content.replace("List<Placemark>", "List<geocoding.Placemark>")
    content = content.replace("await placemarkFromCoordinates", "await geocoding.placemarkFromCoordinates")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('lib/screens/build/build_hub_screen.dart')
fix_file('lib/screens/build/add_build_listing_screen.dart')
