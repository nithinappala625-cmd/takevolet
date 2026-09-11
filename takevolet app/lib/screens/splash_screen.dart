import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/onesignal_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 3));
    if (!mounted) return;

    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      try {
        final user = session.user;
        OneSignalService.login(user.id);
        if (user.email != null && user.email!.isNotEmpty) {
          await Supabase.instance.client.from('profiles').update({
            'email': user.email,
          }).eq('id', user.id);
        }
      } catch (e) {
        debugPrint('[SplashScreen] Profile email sync error: $e');
      }
      context.go('/home');
    } else {
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF030712), // Deep dark blue/black
      body: Stack(
        children: [
          // Background subtle stars/particles effect
          Positioned.fill(
            child: Opacity(
              opacity: 0.3,
              child: Image.network(
                'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
                fit: BoxFit.cover,
              ),
            ),
          ),
          
          // Bottom City Skyline with Wave
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            height: MediaQuery.of(context).size.height * 0.45,
            child: Stack(
              children: [
                ClipPath(
                  clipper: WaveClipper(),
                  child: Container(
                    decoration: BoxDecoration(
                      image: DecorationImage(
                        image: const NetworkImage('https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80'),
                        fit: BoxFit.cover,
                        colorFilter: ColorFilter.mode(const Color(0xFF030712).withOpacity(0.6), BlendMode.darken),
                      ),
                    ),
                  ),
                ),
                // Purple glowing edge on the wave
                ClipPath(
                  clipper: WaveEdgeClipper(),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF7B3AEC).withOpacity(0.85),
                          const Color(0xFF9333EA).withOpacity(0.2),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Main Content
          SafeArea(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.15),
                  // App Logo (Transparent)
                  Container(
                    width: 130,
                    height: 130,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF7B3AEC).withOpacity(0.4),
                          blurRadius: 35,
                          spreadRadius: 3,
                        ),
                        BoxShadow(
                          color: Colors.black.withOpacity(0.4),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Image.asset(
                      'assets/images/app_logo_circle.png',
                      fit: BoxFit.contain,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // App Name
                  Text(
                    'Takevolet',
                    style: GoogleFonts.inter(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF7B3AEC), // Electric Purple
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  // Subtitle
                  Text(
                    'Find Your Perfect Home',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.grey.shade400,
                      letterSpacing: 0.5,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 60),

                  // Loading Indicator
                  const CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF7B3AEC)),
                    strokeWidth: 3,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Loading...',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: Colors.grey.shade500,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class WaveClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    var path = Path();
    path.moveTo(0, size.height * 0.3);
    path.quadraticBezierTo(size.width * 0.25, size.height * 0.4, size.width * 0.5, size.height * 0.25);
    path.quadraticBezierTo(size.width * 0.75, size.height * 0.1, size.width, size.height * 0.2);
    path.lineTo(size.width, size.height);
    path.lineTo(0, size.height);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}

class WaveEdgeClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    var path = Path();
    path.moveTo(0, size.height * 0.3);
    path.quadraticBezierTo(size.width * 0.25, size.height * 0.4, size.width * 0.5, size.height * 0.25);
    path.quadraticBezierTo(size.width * 0.75, size.height * 0.1, size.width, size.height * 0.2);
    
    // Create a thin band for the stroke
    path.lineTo(size.width, size.height * 0.2 + 8);
    path.quadraticBezierTo(size.width * 0.75, size.height * 0.1 + 8, size.width * 0.5, size.height * 0.25 + 8);
    path.quadraticBezierTo(size.width * 0.25, size.height * 0.4 + 8, 0, size.height * 0.3 + 8);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}
