import 'dart:convert';

class ImageUtils {
  /// We are reverting compression as Supabase free tier doesn't support the render endpoint.
  /// This just returns the original URL.
  static String compressUrl(String url, {int width = 400, int quality = 70}) {
    return url;
  }

  static String thumbnailUrl(String url) => url;
  static String detailUrl(String url) => url;

  /// Safely extracts a list of image URLs from a dynamic field.
  static List<String> parseImages(dynamic field) {
    if (field == null) return [];

    if (field is List) {
      return field.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
    }

    if (field is String) {
      if (field.trim().isEmpty) return [];
      if (field.trim().startsWith('[')) {
        try {
          final decoded = jsonDecode(field);
          if (decoded is List) {
            return decoded.map((e) => e.toString()).where((s) => s.isNotEmpty).toList();
          }
        } catch (_) {}
      }
      if (field.trim().isNotEmpty) return [field.trim()];
    }

    return [];
  }

  /// Extracts the first image URL.
  static String? getThumbnail(Map<String, dynamic> data) {
    // Check single-image fields (used by items table)
    for (final key in ['image', 'image_url']) {
      if (data.containsKey(key)) {
        final img = data[key];
        if (img is String && img.trim().isNotEmpty) {
          final url = img.trim().startsWith('[')
              ? (parseImages(img).isNotEmpty ? parseImages(img).first : null)
              : img.trim();
          if (url != null && url.isNotEmpty) return url;
        } else if (img is List && img.isNotEmpty) {
          return img.first.toString();
        }
      }
    }

    // Check array image fields (used by rooms/flatmates tables)
    if (data.containsKey('images')) {
      final images = parseImages(data['images']);
      if (images.isNotEmpty) return images.first;
    }

    return null;
  }

  /// Gets all images from a record.
  static List<String> getAllImages(Map<String, dynamic> data) {
    for (final key in ['images', 'image', 'image_url']) {
      if (data.containsKey(key)) {
        final parsed = parseImages(data[key]);
        if (parsed.isNotEmpty) return parsed;
      }
    }
    return [];
  }
}
