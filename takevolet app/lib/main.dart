import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'screens/profile/client_dashboard_screen.dart';
import 'screens/profile/user_bookings_screen.dart';
import 'screens/profile/wishlist_screen.dart';

import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_analytics/firebase_analytics.dart';

import 'services/onesignal_service.dart';

import 'screens/build/build_hub_screen.dart';
import 'screens/build/add_build_listing_screen.dart';
import 'screens/build/build_category_screen.dart';
import 'screens/build/build_subcategories_screen.dart';
import 'screens/build/build_detail_screen.dart';
import 'screens/add_sale/add_property_sale_screen.dart';

import 'screens/flats/flats_hub_screen.dart';
import 'screens/flats/flats_feed_screen.dart';
import 'screens/flats/flat_detail_screen.dart';
import 'screens/flats/builder_profile_screen.dart';
import 'screens/top_projects/add_top_project_screen.dart';
import 'screens/top_projects/top_project_detail_screen.dart';
import 'screens/admin/admin_sponsored_banners_screen.dart';
import 'screens/legal/add_legal_partner_screen.dart';
import 'screens/legal/legal_hub_screen.dart';
import 'screens/legal/legal_feed_screen.dart';

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
import 'screens/admin/app_config/app_config_dashboard.dart';
import 'screens/admin/app_config/form_builder_screen.dart';
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
import 'screens/feed/feed_screen.dart';
import 'screens/add_requirement/add_requirement_screen.dart';

// Supabase Configuration
const supabaseUrl = 'https://gfhmdpzmhakznuqhstrn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaG1kcHptaGFrem51cWhzdHJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMjc3MTMsImV4cCI6MjEwMjgwMzcxM30.AnwbTfZNxU64QntSJVIsJoEqflIuOPqSSWs9CUb8-TE';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ── Firebase init ──────────────────────────────────────────
  try {
    await Firebase.initializeApp();

    // Crashlytics: catch all Flutter framework errors
    FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;

    // Crashlytics: catch async/platform errors outside Flutter framework
    PlatformDispatcher.instance.onError = (error, stack) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
      return true;
    };

    // Enable Crashlytics collection in release mode only
    await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(!kDebugMode);
  } catch (e) {
    debugPrint('Firebase init failed (no google-services.json?): $e');
  }

  // ── Supabase init ─────────────────────────────────────────
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

// Global Firebase Analytics instance
FirebaseAnalytics get analytics => FirebaseAnalytics.instance;

// Helper: log event safely (won't crash if Firebase not initialized)
void logEvent(String name, {Map<String, Object>? params}) {
  try {
    FirebaseAnalytics.instance.logEvent(name: name, parameters: params);
  } catch (_) {}
}

final supabase = Supabase.instance.client;

final GlobalKey<NavigatorState> rootNavigatorKey = GlobalKey<NavigatorState>();

final _router = GoRouter(
  navigatorKey: rootNavigatorKey,
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
        GoRoute(path: '/client-dashboard', builder: (context, state) => const ClientDashboardScreen()),
    GoRoute(path: '/my-bookings', builder: (context, state) => const UserBookingsScreen()),
    GoRoute(path: '/my-wishlist', builder: (context, state) => const WishlistScreen()),
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(
      path: '/otp_verification',
      builder: (context, state) => OtpVerificationScreen(phoneNumber: state.extra as String),
    ),
    GoRoute(path: '/admin', builder: (context, state) => const AdminDashboardScreen()),
    GoRoute(path: '/admin/banners', builder: (context, state) => const AdminSponsoredBannersScreen()),
    GoRoute(path: '/admin/app-config', builder: (context, state) => const AppConfigDashboard()),
    GoRoute(
      path: '/admin/app-config/form-builder', 
      builder: (context, state) => FormBuilderScreen(formDefinition: state.extra as Map<String, dynamic>?),
    ),
    GoRoute(path: '/user-dashboard', builder: (context, state) => const UserDashboardScreen()),
    GoRoute(path: '/add-legal-partner', builder: (context, state) => const AddLegalPartnerScreen()),
    GoRoute(path: '/legal-hub', builder: (context, state) => const LegalHubScreen()),
    GoRoute(
      path: '/legal-feed',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>? ?? {};
        return LegalFeedScreen(category: extra['category'] ?? 'All');
      },
    ),
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
      path: '/flat-sale/:id',
      builder: (context, state) => FlatDetailScreen(id: state.pathParameters['id']!),
    ),
    GoRoute(
      path: '/builder/:id',
      builder: (context, state) => BuilderProfileScreen(builderData: state.extra as Map<String, dynamic>),
    ),
    GoRoute(path: '/add-top-project', builder: (context, state) => const AddTopProjectScreen()),
    GoRoute(
      path: '/top-project/:id',
      builder: (context, state) => TopProjectDetailScreen(project: state.extra as Map<String, dynamic>),
    ),
    GoRoute(
      path: '/item/:id',
      builder: (context, state) => ItemDetailScreen(id: state.pathParameters['id']!),
    ),
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(path: '/home', builder: (context, state) => const HomeScreen()),
        GoRoute(path: '/rooms', builder: (context, state) => RoomsScreen(city: state.extra as String?)),
        GoRoute(path: '/flatmates', builder: (context, state) => FlatmatesScreen(city: state.extra as String?)),
        GoRoute(path: '/flats', builder: (context, state) => const FlatsHubScreen()),
        GoRoute(
          path: '/flats/list',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>? ?? {};
            return FlatsFeedScreen(category: extra['category'] ?? 'All');
          },
        ),
        GoRoute(path: '/build', builder: (context, state) => const BuildHubScreen()),
        GoRoute(
          path: '/build/subcategories',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>? ?? {};
            return BuildSubcategoriesScreen(categoryName: extra['categoryName'] ?? 'Category');
          },
        ),
        GoRoute(
          path: '/build/category',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>? ?? {};
            return BuildCategoryScreen(
              categoryName: extra['categoryName'] ?? 'Category',
              subCategory: extra['subCategory'],
            );
          },
        ),
        GoRoute(path: '/build/detail', builder: (context, state) => BuildDetailScreen(listing: state.extra as Map<String, dynamic>)),
        GoRoute(path: '/marketplace', builder: (context, state) => const MarketplaceScreen()),
        GoRoute(path: '/feed', builder: (context, state) => const FeedScreen()),
        GoRoute(path: '/profile', builder: (context, state) => const ProfileDashboardScreen()),
      ],
    ),
    GoRoute(path: '/add-room', builder: (context, state) => const AddRoomScreen()),
    GoRoute(path: '/add-flatmate', builder: (context, state) => const AddFlatmateScreen()),
    GoRoute(path: '/add-item', builder: (context, state) => const AddItemScreen()),
    GoRoute(path: '/add-requirement', builder: (context, state) => const AddRequirementScreen()),
    GoRoute(path: '/add-build-listing', builder: (context, state) => const AddBuildListingScreen()),
    GoRoute(path: '/add-sale', builder: (context, state) => const AddPropertySaleScreen()),
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
