import sys

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace("await geocoding.placemarkFromCoordinates", "await geocoding.Geocoding().placemarkFromCoordinates")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

fix_file('lib/screens/build/build_hub_screen.dart')
fix_file('lib/screens/build/add_build_listing_screen.dart')
