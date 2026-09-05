import re

with open("takevolet app/lib/screens/build/add_build_listing_screen.dart", "r", encoding="utf-8") as f:
    c = f.read()

# Remove hardcoded price_unit logic
c = c.replace("'price_unit': _mainCategory == 'transport' ? 'per hour/day' : (_mainCategory == 'material' ? 'per unit' : 'contract/fixed'),", "")

# Add OneSignal Push Notification on save
old_save_end = """        if (widget.initialData == null) {
          await _supabase.from('build_listings').insert(data);
        } else {
          await _supabase.from('build_listings').update(data).eq('id', widget.initialData!['id']);
        }"""
new_save_end = """        if (widget.initialData == null) {
          await _supabase.from('build_listings').insert(data);
          // Broadcast new listing
          try {
             await OneSignalService.sendPushNotification(
               title: 'New Service Listed!',
               message: 'A new ${_subCategory ?? 'service'} is available in $extractedLocation.',
             );
          } catch (_) {}
        } else {
          await _supabase.from('build_listings').update(data).eq('id', widget.initialData!['id']);
        }"""
c = c.replace(old_save_end, new_save_end)

if "import '../../services/onesignal_service.dart';" not in c:
    c = c.replace("import '../../services/r2_storage_service.dart';", "import '../../services/r2_storage_service.dart';\nimport '../../services/onesignal_service.dart';")

with open("takevolet app/lib/screens/build/add_build_listing_screen.dart", "w", encoding="utf-8") as f:
    f.write(c)

print("Updated add_build_listing_screen.dart")
