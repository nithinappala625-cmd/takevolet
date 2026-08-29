import 'dart:io';
import 'package:flutter/services.dart';
import 'package:image/image.dart' as img;

class WatermarkService {
  static img.Image? _logoCache;

  static Future<img.Image> _getLogo() async {
    if (_logoCache != null) return _logoCache!;
    final byteData = await rootBundle.load('assets/images/app_logo.png');
    final bytes = byteData.buffer.asUint8List();
    _logoCache = img.decodeImage(bytes);
    return _logoCache!;
  }

  static Future<File> addWatermark(File originalFile) async {
    try {
      final bytes = await originalFile.readAsBytes();
      final image = img.decodeImage(bytes);
      
      if (image == null) return originalFile;

      // Draw "Takevolet" text watermark at bottom right
      final font = img.arial48; // Built-in font in image package
      final text = "Takevolet";
      // To make it semi-transparent, we can use a color with alpha. However, image package v4 color format differs.
      // We will draw it in white with some transparency if possible, or just a solid color.
      // Assuming white color:
      img.drawString(image, text, font: font, x: image.width - 250, y: image.height - 70, color: img.ColorRgb8(255, 255, 255));

      final watermarkedBytes = img.encodeJpg(image, quality: 85);
      final newPath = originalFile.path.replaceAll(RegExp(r'\.(jpg|jpeg|png)$', caseSensitive: false), '_watermarked.jpg');
      final newFile = File(newPath);
      await newFile.writeAsBytes(watermarkedBytes);
      return newFile;
    } catch (e) {
      print('Watermark error: $e');
      return originalFile;
    }
  }
}
