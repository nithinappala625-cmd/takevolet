import 'dart:io';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;

class ShareUtils {
  static const String baseUrl = 'https://takevolet.online';

  static Future<void> generateRoomShare(BuildContext context, Map<String, dynamic> room) async {
    final String title = room['title'] ?? 'Room for Rent';
    final String rent = room['rent']?.toString() ?? 'Contact for price';
    final String location = room['locality'] ?? 'Unknown location';
    final String roomId = room['id']?.toString() ?? '';
    
    final String shareText = "🏠 $title\n\n💰 Rent: ₹$rent/month\n📍 $location\n\nView this room on Takevolet:\n$baseUrl/room/$roomId";
    
    await _executeShare(context, shareText, room['image_urls']?.first);
  }

  static Future<void> generatePropertyShare(BuildContext context, Map<String, dynamic> property) async {
    final String title = property['title'] ?? 'Property for Sale';
    // Handle both 'price' and 'expected_price'
    final double priceVal = (property['price'] ?? property['expected_price'] ?? 0).toDouble();
    String formattedPrice = priceVal >= 10000000 ? '₹${(priceVal / 10000000).toStringAsFixed(2)} Cr' 
                          : priceVal >= 100000 ? '₹${(priceVal / 100000).toStringAsFixed(2)} L' 
                          : '₹${priceVal.toInt()}';
    
    final List<String> locationParts = [property['village'], property['locality'], property['area'], property['district'], property['city']]
      .where((e) => e != null && e.toString().trim().isNotEmpty).cast<String>().toList();
    final String location = locationParts.take(2).join(', ').trim();
    final String propertyId = property['id']?.toString() ?? '';

    final String shareText = "🏠 $title\n\n💰 Price: $formattedPrice\n📍 ${location.isNotEmpty ? location : 'India'}\n\nView this property on Takevolet:\n$baseUrl/property/$propertyId";
    
    await _executeShare(context, shareText, property['cover_image']);
  }

  static Future<void> generatePostShare(BuildContext context, Map<String, dynamic> post) async {
    final profiles = post['profiles'] ?? {};
    final String name = profiles['full_name'] ?? 'Someone';
    final String location = post['location_name'] ?? '';
    final String postId = post['id']?.toString() ?? '';

    final String shareText = "👤 $name on Takevolet Community\n\n📍 $location\n\nView this post on Takevolet:\n$baseUrl/feed/$postId";
    
    await _executeShare(context, shareText, post['image_url']);
  }

  static Future<void> generateServiceShare(BuildContext context, Map<String, dynamic> service, String serviceType) async {
    final String title = service['title'] ?? service['name'] ?? 'Construction Service';
    final String location = service['location'] ?? service['locality'] ?? '';
    final String serviceId = service['id']?.toString() ?? '';

    final String shareText = "🛠️ $title\n\n📍 $location\n\nView this on Takevolet:\n$baseUrl/$serviceType/$serviceId";
    
    await _executeShare(context, shareText, service['cover_image'] ?? service['image_url']);
  }

  static Future<void> generateTopProjectShare(BuildContext context, Map<String, dynamic> project) async {
    final String title = project['project_name'] ?? 'Premium Project';
    final String price = project['starting_price']?.toString() ?? 'Contact for price';
    final String location = project['locality'] ?? project['city'] ?? 'Unknown location';
    final String projectId = project['id']?.toString() ?? '';

    final String shareText = "🏢 $title\n\n💰 Starting Price: ₹$price\n📍 $location\n\nView this project on Takevolet:\n$baseUrl/property/$projectId";
    
    final List<dynamic> images = project['media_urls'] ?? [];
    await _executeShare(context, shareText, images.isNotEmpty ? images.first : null);
  }

  static Future<void> _executeShare(BuildContext context, String shareText, String? imageUrl) async {
    final box = context.findRenderObject() as RenderBox?;
    
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Preparing share...'), duration: Duration(seconds: 2)),
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
            sharePositionOrigin: box != null ? box.localToGlobal(Offset.zero) & box.size : null,
          );
          return;
        }
      } catch (e) {
        debugPrint('Error sharing image: $e');
      }
    }

    await Share.share(
      shareText,
      sharePositionOrigin: box != null ? box.localToGlobal(Offset.zero) & box.size : null,
    );
  }
}
