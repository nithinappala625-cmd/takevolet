import 'dart:io';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;

class ShareUtils {
  static Future<void> shareListing({
    required BuildContext context,
    required String title,
    required String description,
    required String? imageUrl,
  }) async {
    final box = context.findRenderObject() as RenderBox?;
    final String shareText = "$title\n\n$description\n\nCheck it out on the Takevolet App!";
    
    // Show a loading indicator if image takes a second
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Preparing share...'), duration: Duration(seconds: 1)),
    );
    
    if (imageUrl != null && imageUrl.isNotEmpty) {
      try {
        final response = await http.get(Uri.parse(imageUrl));
        if (response.statusCode == 200) {
          final dir = await getTemporaryDirectory();
          final path = '${dir.path}/shared_image_${DateTime.now().millisecondsSinceEpoch}.jpg';
          final file = File(path);
          await file.writeAsBytes(response.bodyBytes);
          
          await Share.shareXFiles(
            [XFile(path)],
            text: shareText,
            sharePositionOrigin: box!.localToGlobal(Offset.zero) & box.size,
          );
          return;
        }
      } catch (e) {
        debugPrint('Error sharing image: $e');
      }
    }
    
    // Fallback to text only
    await Share.share(
      shareText,
      sharePositionOrigin: box!.localToGlobal(Offset.zero) & box.size,
    );
  }
}
