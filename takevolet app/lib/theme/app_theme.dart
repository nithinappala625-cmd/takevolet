import 'package:flutter/material.dart';

class AppTheme {
  // Primary Reference Color sampled from user image: #7B3AEC (RGB 123, 58, 236)
  static const Color primary = Color(0xFF7B3AEC);
  static const Color primaryDark = Color(0xFF5B21B6);
  static const Color primaryLight = Color(0xFF8B5CF6);
  
  // Surface / Accent Tints (replacing gold/amber tints)
  static const Color surfaceLight = Color(0xFFF5F3FF); // Lightest lavender/violet
  static const Color borderLight = Color(0xFFDDD6FE);  // Soft violet border
  static const Color accentDark = Color(0xFF6D28D9);   // Deep violet text / icons
  
  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF7B3AEC), Color(0xFF5B21B6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF0F172A), Color(0xFF7B3AEC), Color(0xFF6D28D9)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient badgeGradient = LinearGradient(
    colors: [Color(0xFF7B3AEC), Color(0xFF9333EA)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Modern Box Shadows
  static List<BoxShadow> primaryShadow({
    double opacity = 0.28,
    double blurRadius = 14,
    Offset offset = const Offset(0, 6),
  }) {
    return [
      BoxShadow(
        color: primary.withOpacity(opacity),
        blurRadius: blurRadius,
        offset: offset,
      ),
    ];
  }

  static List<BoxShadow> softShadow = [
    BoxShadow(
      color: Colors.black.withOpacity(0.04),
      blurRadius: 10,
      offset: const Offset(0, 4),
    ),
  ];
}
