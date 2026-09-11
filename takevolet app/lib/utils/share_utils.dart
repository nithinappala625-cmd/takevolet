import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';

class ShareUtils {
  static const String baseUrl = 'https://takevolet.online';

  static String? _extractFirstImage(Map<String, dynamic> item) {
    if (item['images'] is List && (item['images'] as List).isNotEmpty) {
      return (item['images'] as List).first.toString();
    }
    if (item['image_urls'] is List && (item['image_urls'] as List).isNotEmpty) {
      return (item['image_urls'] as List).first.toString();
    }
    if (item['cover_image'] != null && item['cover_image'].toString().isNotEmpty) {
      return item['cover_image'].toString();
    }
    if (item['image_url'] != null && item['image_url'].toString().isNotEmpty) {
      return item['image_url'].toString();
    }
    return null;
  }

  static Future<void> generateRoomShare(BuildContext context, Map<String, dynamic> room) async {
    final String title = room['title'] ?? 'Room for Rent';
    final String rent = room['rent']?.toString() ?? 'Contact for price';
    final String location = room['locality'] ?? room['city'] ?? 'Hyderabad';
    final String roomId = room['id']?.toString() ?? '';
    final String shareUrl = '$baseUrl/room/$roomId';
    
    final String shareText = "🏠 $title\n💰 Rent: ₹$rent/month\n📍 $location\n\n$shareUrl";
    
    await _executeShare(context, shareText, shareUrl, _extractFirstImage(room));
  }

  static Future<void> generateFlatmateShare(BuildContext context, Map<String, dynamic> flatmate) async {
    final String title = flatmate['title'] ?? 'Flatmate Required';
    final String rent = flatmate['rent_share']?.toString() ?? 'Contact for price';
    final String location = flatmate['location'] ?? flatmate['city'] ?? 'Hyderabad';
    final String flatmateId = flatmate['id']?.toString() ?? '';
    final String shareUrl = '$baseUrl/flatmate/$flatmateId';
    
    final String shareText = "👥 $title\n💰 Rent Share: ₹$rent/month\n📍 $location\n\n$shareUrl";
    
    await _executeShare(context, shareText, shareUrl, _extractFirstImage(flatmate));
  }

  static Future<void> generatePropertyShare(BuildContext context, Map<String, dynamic> property) async {
    final String title = property['title'] ?? 'Property for Sale';
    final double priceVal = (property['price'] ?? property['expected_price'] ?? 0).toDouble();
    String formattedPrice = priceVal >= 10000000 ? '₹${(priceVal / 10000000).toStringAsFixed(2)} Cr' 
                          : priceVal >= 100000 ? '₹${(priceVal / 100000).toStringAsFixed(2)} L' 
                          : '₹${priceVal.toInt()}';
    
    final List<String> locationParts = [property['village'], property['locality'], property['area'], property['district'], property['city']]
      .where((e) => e != null && e.toString().trim().isNotEmpty).cast<String>().toList();
    final String location = locationParts.take(2).join(', ').trim();
    final String propertyId = property['id']?.toString() ?? '';
    final String shareUrl = '$baseUrl/property/$propertyId';

    final String shareText = "Check out this property on Takevolet:\n\n$title\n💰 Price: $formattedPrice\n📍 ${location.isNotEmpty ? location : 'Hyderabad'}\n\n$shareUrl";
    
    await _executeShare(context, shareText, shareUrl, _extractFirstImage(property));
  }

  static Future<void> generatePostShare(BuildContext context, Map<String, dynamic> post) async {
    final profiles = post['profiles'] ?? {};
    final String name = profiles['full_name'] ?? 'Someone';
    final String location = post['location_name'] ?? '';
    final String postId = post['id']?.toString() ?? '';
    final String shareUrl = '$baseUrl/feed/$postId';

    final String shareText = "👤 $name on Takevolet Community\n📍 $location\n\n$shareUrl";
    
    await _executeShare(context, shareText, shareUrl, _extractFirstImage(post));
  }

  static Future<void> generateServiceShare(BuildContext context, Map<String, dynamic> service, String serviceType) async {
    final String title = service['title'] ?? service['name'] ?? 'Construction Service';
    final String location = service['location'] ?? service['locality'] ?? '';
    final String serviceId = service['id']?.toString() ?? '';
    final String shareUrl = '$baseUrl/$serviceType/$serviceId';

    final String shareText = "🛠️ $title\n📍 $location\n\n$shareUrl";
    
    await _executeShare(context, shareText, shareUrl, _extractFirstImage(service));
  }

  static Future<void> generateTopProjectShare(BuildContext context, Map<String, dynamic> project) async {
    final String title = project['project_name'] ?? 'Premium Project';
    final String price = project['starting_price']?.toString() ?? 'Contact for price';
    final String location = project['locality'] ?? project['city'] ?? 'Hyderabad';
    final String projectId = project['id']?.toString() ?? '';
    final String shareUrl = '$baseUrl/project/$projectId';

    final String shareText = "🏢 $title\n💰 Starting Price: ₹$price\n📍 $location\n\n$shareUrl";
    
    await _executeShare(context, shareText, shareUrl, _extractFirstImage(project));
  }

  static Future<void> _executeShare(BuildContext context, String shareText, String shareUrl, String? imageUrl) async {
    final box = context.findRenderObject() as RenderBox?;
    
    // 1. Immediately copy link to clipboard
    try {
      await Clipboard.setData(ClipboardData(text: shareUrl));
    } catch (_) {}

    // 2. Display instant confirmation SnackBar
    if (context.mounted) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: const [
              Icon(Icons.link_rounded, color: Colors.white, size: 20),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Link copied to clipboard! Opening share options...',
                  style: TextStyle(fontWeight: FontWeight.w600, color: Colors.white),
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF7B3AEC),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 2),
        ),
      );
    }

    // 3. Share rich text with URL (guarantees WhatsApp/Telegram/SMS render link)
    await Share.share(
      shareText,
      subject: 'Shared via Takevolet',
      sharePositionOrigin: box != null ? box.localToGlobal(Offset.zero) & box.size : null,
    );
  }
}
