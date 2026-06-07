import 'package:flutter/material.dart';

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
        child: Text(
          content,
          style: const TextStyle(fontSize: 16, height: 1.5),
        ),
      ),
    );
  }
}

// ─── Individual Screens ────────────────────────────────────────────────────────

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaticScreen(
        title: 'Privacy Policy',
        content: 'Your privacy is critically important to us. Takevolet respects your privacy regarding any information we may collect while operating our application.\n\n1. Information Collection\nWe only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means.\n\n2. Security\nWe protect your data using Supabase Row Level Security.',
      );
}

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaticScreen(
        title: 'Terms of Service',
        content: 'By accessing or using the Takevolet platform, you agree to be bound by these Terms.\n\n1. Usage\nYou must not misuse our services.\n\n2. Payments\nAll contact unlock payments (₹500) are final and subject to our refund policy.\n\n3. Termination\nWe may suspend your account if you violate these terms.',
      );
}

class RefundScreen extends StatelessWidget {
  const RefundScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaticScreen(
        title: 'Refund Policy',
        content: 'Takevolet Refund Policy:\n\nIf you pay to unlock a contact and the property was already rented out prior to your payment, you are eligible for a 100% refund of your ₹500.\n\nPlease contact our support team within 48 hours to initiate a refund request.',
      );
}

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaticScreen(
        title: 'About Us',
        content: 'Takevolet (RoomRelay) is the ultimate platform to find rooms, flatmates, and buy/sell items.\n\nBuilt by Nithin Pappala, our mission is to eliminate middleman brokers and connect seekers directly with current tenants/owners using a secure escrow reward system.',
      );
}

class ArticlesScreen extends StatelessWidget {
  const ArticlesScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Articles & Blog')),
        body: const Center(child: Text('Coming Soon: Real Estate Insights & Tips!')),
      );
}

class PartnersScreen extends StatelessWidget {
  const PartnersScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Our Partners')),
        body: const Center(child: Text('Takevolet Partner Network\n\nContact us to become a verified broker or partner agency.')),
      );
}

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Contact Us')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const Text('Get in Touch', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          const TextField(decoration: InputDecoration(labelText: 'Name', border: OutlineInputBorder())),
          const SizedBox(height: 16),
          const TextField(decoration: InputDecoration(labelText: 'Email', border: OutlineInputBorder())),
          const SizedBox(height: 16),
          const TextField(
            decoration: InputDecoration(labelText: 'Message', border: OutlineInputBorder()),
            maxLines: 4,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Message Sent!')));
            },
            child: const Text('Send Message'),
          )
        ],
      ),
    );
  }
}
