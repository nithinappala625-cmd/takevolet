import 'package:flutter/material.dart';
import '../../main.dart';

import 'package:flutter_markdown/flutter_markdown.dart';

/// A simple static text renderer.
class StaticScreen extends StatelessWidget {
  final String title;
  final String content;

  const StaticScreen({super.key, required this.title, required this.content});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: MarkdownBody(
          data: content,
          styleSheet: MarkdownStyleSheet(
            p: const TextStyle(fontSize: 16, height: 1.6),
            h1: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87),
            h2: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87),
            h3: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
            listBullet: const TextStyle(fontSize: 16, height: 1.6),
          ),
        ),
      ),
    );
  }
}

/// Fetches page content from Supabase `pages` table by slug.
/// Falls back to [fallbackTitle] and [fallbackContent] if no record found.
class DynamicPageScreen extends StatelessWidget {
  final String slug;
  final String fallbackTitle;
  final String fallbackContent;

  const DynamicPageScreen({
    super.key,
    required this.slug,
    required this.fallbackTitle,
    required this.fallbackContent,
  });

  Future<Map<String, dynamic>?> _fetchPage() async {
    try {
      final res = await supabase
          .from('pages')
          .select()
          .eq('slug', slug)
          .maybeSingle();
      return res;
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Map<String, dynamic>?>(
      future: _fetchPage(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(
            appBar: AppBar(title: Text(fallbackTitle)),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        final page = snapshot.data;
        final title = page?['title'] ?? fallbackTitle;
        final content = page?['content'] ?? fallbackContent;
        return StaticScreen(title: title, content: content);
      },
    );
  }
}

// ─── Individual Screens ────────────────────────────────────────────────────────

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});
  @override
  Widget build(BuildContext context) => const DynamicPageScreen(
        slug: 'privacy-policy',
        fallbackTitle: 'Privacy Policy',
        fallbackContent: 'Your privacy is critically important to us. Takevolet respects your privacy regarding any information we may collect while operating our application.\n\n1. Information Collection\nWe only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means.\n\n2. Data Usage\nWe use the information we collect to provide, maintain, and improve our services. We never sell your personal data to third parties.\n\n3. Security\nWe protect your data using Supabase Row Level Security and industry-standard encryption. Your Aadhaar documents are stored in private, encrypted storage buckets.\n\n4. Cookies & Analytics\nOur website uses cookies for authentication and analytics purposes only.\n\n5. Your Rights\nYou can request deletion of your account and all associated data at any time by contacting our support team.\n\n6. Contact\nFor privacy concerns, email us at privacy@takevolet.online',
      );
}

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});
  @override
  Widget build(BuildContext context) => const DynamicPageScreen(
        slug: 'terms-of-service',
        fallbackTitle: 'Terms of Service',
        fallbackContent: 'By accessing or using the Takevolet platform, you agree to be bound by these Terms.\n\n1. Eligibility\nYou must be at least 18 years old to use our services.\n\n2. Usage\nYou must not misuse our services. Post only genuine room listings with accurate information and real photographs.\n\n3. Payments\nAll contact unlock payments (₹15) are processed via Razorpay and are subject to our refund policy. Handover commission (₹1,000) is paid to the room poster upon successful handover confirmation.\n\n4. Verification\nUsers must complete KYC verification (Aadhaar upload) to post rooms and earn commissions.\n\n5. Prohibited Activities\nPosting fake listings, impersonating other users, or attempting to bypass the payment system is strictly prohibited.\n\n6. Termination\nWe may suspend your account if you violate these terms.\n\n7. Limitation of Liability\nTakevolet acts as a marketplace and does not guarantee the condition of any listed property.\n\n8. Contact\nFor questions about these terms, contact us at support@takevolet.online',
      );
}

class RefundScreen extends StatelessWidget {
  const RefundScreen({super.key});
  @override
  Widget build(BuildContext context) => const DynamicPageScreen(
        slug: 'refund-policy',
        fallbackTitle: 'Refund Policy',
        fallbackContent: 'Takevolet Refund Policy:\n\n1. Contact Unlock Fee (₹15)\nIf you pay to unlock a contact and the property was already rented out prior to your payment, you are eligible for a 100% refund.\n\n2. Eligibility\nRefund requests must be submitted within 48 hours of the payment.\n\n3. Processing Time\nApproved refunds are processed within 5-7 business days to your original payment method.\n\n4. Non-Refundable\nIf the room is still available at the time of unlock, the fee is non-refundable as the service was successfully delivered.\n\n5. Handover Commissions\nCommissions are earned by posters and are non-refundable once the handover is confirmed by the seeker.\n\n6. How to Request\nContact our support team at support@takevolet.online with your payment ID and reason for refund.',
      );
}

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});
  @override
  Widget build(BuildContext context) => const DynamicPageScreen(
        slug: 'about-us',
        fallbackTitle: 'About Us',
        fallbackContent: 'Takevolet (RoomRelay) is the ultimate platform to find rooms, flatmates, and buy/sell items — all without paying brokerage.\n\nOur Mission\nEliminate middleman brokers and connect seekers directly with current tenants/owners using a secure escrow reward system.\n\nHow It Works\n• Posters list their rooms with real photos, rent details, and amenities\n• Seekers browse listings and pay a small fee (₹15) to unlock contact details\n• After a successful room handover, the poster earns a ₹1,000 commission\n\nWhy Takevolet?\n• Zero brokerage — no middlemen\n• Direct contact between seekers and posters\n• Verified listings with real photographs\n• Transparent pricing and amenities\n• Serving 15+ areas in Hyderabad\n\nBuilt by Nithin Pappala, proudly made in Hyderabad, India.\n\nContact: support@takevolet.online\nPhone: +91 79819 94870',
      );
}

class ArticlesScreen extends StatelessWidget {
  const ArticlesScreen({super.key});
  @override
  Widget build(BuildContext context) => const DynamicPageScreen(
        slug: 'articles',
        fallbackTitle: 'Articles & Blog',
        fallbackContent: 'Coming Soon: Real Estate Insights & Tips!\n\nWe are working on bringing you valuable content about:\n\n• How to find the best bachelor rooms in Hyderabad\n• Tips for negotiating rent without a broker\n• Area guides: Madhapur, Gachibowli, Kondapur & more\n• Roommate etiquette and living tips\n• Moving checklist for IT professionals\n\nStay tuned for updates!',
      );
}

class PartnersScreen extends StatelessWidget {
  const PartnersScreen({super.key});
  @override
  Widget build(BuildContext context) => const DynamicPageScreen(
        slug: 'partners',
        fallbackTitle: 'Our Partners',
        fallbackContent: 'Takevolet Partner Network\n\nWe work with verified brokers and partner agencies to bring you more genuine listings.\n\nBenefits of becoming a partner:\n• Priority listing visibility\n• Dedicated account manager\n• Bulk listing tools\n• Analytics dashboard\n• Partner badge on listings\n\nInterested in becoming a verified broker or partner agency? Contact us at partners@takevolet.online or call +91 79819 94870.',
      );
}

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});
  @override
  Widget build(BuildContext context) => const DynamicPageScreen(
        slug: 'contact-us',
        fallbackTitle: 'Contact Us',
        fallbackContent: 'Get in Touch\n\nWe would love to hear from you!\n\nEmail: support@takevolet.online\nPhone: +91 79819 94870\nLocation: Hyderabad, Telangana, India',
      );
}
