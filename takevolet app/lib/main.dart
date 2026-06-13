import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';

import 'services/onesignal_service.dart';

import 'screens/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/otp_verification_screen.dart';
import 'screens/main_shell.dart';
import 'screens/home/home_screen.dart';
import 'screens/rooms/rooms_screen.dart';
import 'screens/flatmates/flatmates_screen.dart';
import 'screens/marketplace/marketplace_screen.dart';
import 'screens/profile/profile_dashboard_screen.dart';
import 'screens/profile/user_dashboard_screen.dart';
import 'screens/admin/admin_dashboard_screen.dart';
import 'screens/profile/earnings_screen.dart';
import 'screens/profile/refer_screen.dart';
import 'screens/profile/pricing_screen.dart';
import 'screens/profile/profile_complete_screen.dart';
import 'screens/profile/profile_edit_screen.dart';
import 'screens/profile/unlock_history_screen.dart';
import 'screens/info/static_screens.dart';
import 'screens/rooms/room_detail_screen.dart';
import 'screens/flatmates/flatmate_detail_screen.dart';
import 'screens/marketplace/item_detail_screen.dart';
import 'screens/add_room/add_room_screen.dart';
import 'screens/add_flatmate/add_flatmate_screen.dart';
import 'screens/add_item/add_item_screen.dart';

// Supabase Configuration
const supabaseUrl = 'https://vwcqovrbvhztpkultqjl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3Y3FvdnJidmh6dHBrdWx0cWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MjA2MDgsImV4cCI6MjA5MzM5NjYwOH0.YeBYsG0MRwwLT3fKbV2oDaugyW86PS6YfIirLEvc2R8';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  );

  runApp(
    const ProviderScope(
      child: TakevoletApp(),
    ),
  );
}

final supabase = Supabase.instance.client;

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

final _router = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(
      path: '/otp_verification',
      builder: (context, state) => OtpVerificationScreen(phoneNumber: state.extra as String),
    ),
    GoRoute(path: '/admin', builder: (context, state) => const AdminDashboardScreen()),
    GoRoute(path: '/user-dashboard', builder: (context, state) => const UserDashboardScreen()),
    GoRoute(path: '/earnings', builder: (context, state) => const EarningsScreen()),
    GoRoute(path: '/refer', builder: (context, state) => const ReferScreen()),
    GoRoute(path: '/pricing', builder: (context, state) => const PricingScreen()),
    GoRoute(path: '/profile-complete', builder: (context, state) => const ProfileCompleteScreen()),
    GoRoute(path: '/profile-edit', builder: (context, state) => const ProfileEditScreen()),
    GoRoute(path: '/unlock-history', builder: (context, state) => const UnlockHistoryScreen()),
    GoRoute(path: '/about', builder: (context, state) => const AboutScreen()),
    GoRoute(path: '/articles', builder: (context, state) => const ArticlesScreen()),
    GoRoute(path: '/partners', builder: (context, state) => const PartnersScreen()),
    GoRoute(path: '/contact', builder: (context, state) => const ContactScreen()),
    GoRoute(path: '/privacy', builder: (context, state) => const PrivacyScreen()),
    GoRoute(path: '/terms', builder: (context, state) => const TermsScreen()),
    GoRoute(path: '/refund-policy', builder: (context, state) => const RefundScreen()),
    GoRoute(
      path: '/room/:id',
      builder: (context, state) => RoomDetailScreen(id: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/flatmate/:id',
      builder: (context, state) => FlatmateDetailScreen(id: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/item/:id',
      builder: (context, state) => ItemDetailScreen(id: state.pathParameters['id']!),
    ),
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
        GoRoute(path: '/rooms', builder: (context, state) => const RoomsScreen()),
        GoRoute(path: '/flatmates', builder: (context, state) => const FlatmatesScreen()),
        GoRoute(path: '/marketplace', builder: (context, state) => const MarketplaceScreen()),
        GoRoute(path: '/profile', builder: (context, state) => const ProfileDashboardScreen()),
      ],
    ),
    GoRoute(path: '/add-room', builder: (context, state) => const AddRoomScreen()),
    GoRoute(path: '/add-flatmate', builder: (context, state) => const AddFlatmateScreen()),
    GoRoute(path: '/add-item', builder: (context, state) => const AddItemScreen()),
  ],
);

class TakevoletApp extends StatefulWidget {
  const TakevoletApp({super.key});

  @override
  State<TakevoletApp> createState() => _TakevoletAppState();
}

class _TakevoletAppState extends State<TakevoletApp> {
  @override
  void initState() {
    super.initState();
    OneSignalService.initialize(rootNavigatorKey);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Takevolet',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFD4AF37),
          primary: const Color(0xFFD4AF37),
          surface: Colors.white,
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: Colors.white,
        textTheme: GoogleFonts.outfitTextTheme(Theme.of(context).textTheme),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
          centerTitle: true,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            elevation: 8,
            shadowColor: const Color(0xFFD4AF37).withOpacity(0.5),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFD4AF37),
          primary: const Color(0xFFD4AF37),
          brightness: Brightness.dark,
        ),
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme),
        useMaterial3: true,
      ),
      themeMode: ThemeMode.system,
      routerConfig: _router,
      debugShowCheckedModeBanner: false,
    );
  }
}
