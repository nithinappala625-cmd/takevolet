import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class SmartImage extends StatelessWidget {
  final String imageUrl;
  final BoxFit fit;

  const SmartImage({
    super.key,
    required this.imageUrl,
    this.fit = BoxFit.cover,
  });

  @override
  Widget build(BuildContext context) {
    if (imageUrl.startsWith('data:image/')) {
      // It's a base64 string from the website
      try {
        final base64String = imageUrl.split(',').last;
        final bytes = base64Decode(base64String);
        return Image.memory(
          bytes,
          fit: fit,
          errorBuilder: (context, error, stackTrace) => _buildErrorWidget(),
        );
      } catch (e) {
        return _buildErrorWidget();
      }
    } else if (imageUrl.startsWith('http')) {
      // It's a network URL
      return CachedNetworkImage(
        imageUrl: imageUrl,
        fit: fit,
        placeholder: (context, url) => Container(color: Colors.grey[200]),
        errorWidget: (context, url, error) => _buildErrorWidget(),
      );
    } else {
      return _buildErrorWidget();
    }
  }

  Widget _buildErrorWidget() {
    return Container(
      color: const Color(0xFFF5EFD0),
      child: const Icon(Icons.image_not_supported_rounded, size: 56, color: Color(0xFFD4AF37)),
    );
  }
}
