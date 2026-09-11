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
  Widget build(BuildContext context) => const StaticScreen(
        title: 'Privacy Policy',
        content: '''# Privacy Policy – Takevolet

Effective Date: June 2026

Welcome to Takevolet. Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your information when you use the Takevolet website and mobile application.

## 1. About Takevolet
Takevolet is a bachelor-focused accommodation platform that helps users find rooms, flatmates, room vacancies, and accommodation opportunities.

## 2. Information We Collect
### Personal Information
When you create an account or use our services, we may collect:
* Full Name
* Mobile Number
* Email Address
* Profile Information
* Location Information
* Gender (if provided)
* Room Preferences
* Flatmate Preferences

### Property Information
When posting room listings:
* Room Details
* Property Photos
* Location Information
* Rent Information
* Owner Contact Information

### KYC Information
For verification purposes, we may collect:
* Aadhaar Card Images
* Identity Verification Documents

### Device Information
We may automatically collect:
* Device Type
* Operating System
* App Version
* IP Address
* Usage Analytics

## 3. How We Use Your Information
We use collected information to:
* Create and manage user accounts
* Match users with suitable rooms and flatmates
* Display room listings
* Process payments
* Improve platform functionality
* Prevent fraud and misuse
* Provide customer support
* Send important notifications

## 4. Payments
Payments on Takevolet are processed through trusted third-party payment providers such as Razorpay.
Takevolet does not store your card details, banking credentials, or UPI PINs.

## 5. Location Access
If permission is granted, we may access your location to:
* Show nearby rooms
* Improve room recommendations
* Provide location-based services

You can disable location access anytime through device settings.

## 6. Storage of Information
User information may be stored securely using trusted cloud infrastructure and database providers.
We take reasonable measures to protect data from unauthorized access, disclosure, or misuse.

## 7. Sharing of Information
We do not sell user data.
Information may be shared only:
* Between room seekers and room owners when necessary
* With payment providers
* With legal authorities when required by law
* With service providers supporting platform operations

## 8. Notifications
Takevolet may send:
* Account Notifications
* Room Match Alerts
* Flatmate Match Alerts
* Listing Updates
* Service Announcements

Users may manage notification preferences through device settings.

## 9. User Responsibilities
Users are responsible for:
* Providing accurate information
* Maintaining account security
* Using the platform legally
* Respecting other users' privacy

## 10. Data Deletion
Users may request account deletion by contacting us.
Upon request, we will make reasonable efforts to remove personal information except where retention is required by law or for legitimate business purposes.

## 11. Children's Privacy
Takevolet is intended for users aged 18 years and above.
We do not knowingly collect information from children.

## 12. Third-Party Services
Takevolet may use third-party services including:
* Supabase
* Razorpay
* OneSignal
* Google Services

These providers may process information according to their own privacy policies.

## 13. Changes to Privacy Policy
We may update this Privacy Policy from time to time.
Updated versions will be posted on our website and application.

## 14. Contact Us
For privacy-related questions or requests:

**Takevolet**
Founder: Nithin Patel
Website: https://takevolet.online
Email: support@takevolet.online
Phone: +91 79819 94870

By using Takevolet, you agree to this Privacy Policy.''',
      );
}

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaticScreen(
        title: 'Terms of Service',
        content: '''# Terms and Conditions

Effective Date: June 2026

Welcome to Takevolet. By accessing or using the Takevolet website and mobile application, you agree to comply with these Terms and Conditions.

## 1. Service Overview
Takevolet is a platform that helps users discover rooms, flatmates, room vacancies, and accommodation opportunities.
Takevolet acts as a technology platform and does not own, lease, rent, or manage properties listed on the platform.

## 2. User Eligibility
Users must be at least 18 years old.
By using Takevolet, you confirm that all information provided is accurate and truthful.

## 3. User Accounts
Users are responsible for maintaining the confidentiality of their accounts.
Takevolet reserves the right to suspend or terminate accounts involved in fraud, abuse, spam, or misuse.

## 4. Room Listings
Users posting room listings must provide accurate information.
Takevolet does not guarantee the availability, quality, legality, safety, or suitability of any listed accommodation.

## 5. Payments
Certain services may require payment.
All pricing, fees, and charges are displayed before purchase.
Payments are processed through authorized third-party payment providers.

## 6. Verification
Takevolet may verify users, room listings, and documents.
Verification does not guarantee the accuracy or legitimacy of all information provided by users.

## 7. User Conduct
Users agree not to:
* Submit false information
* Post illegal content
* Harass other users
* Misuse contact information
* Attempt unauthorized access to systems

## 8. Intellectual Property
All content, branding, logos, and software related to Takevolet remain the property of Takevolet.

## 9. Limitation of Liability
Takevolet shall not be liable for:
* Property disputes
* Rental agreements
* Financial losses
* Room quality issues
* Actions of third parties

Users are responsible for independently verifying accommodation details.

## 10. Changes to Services
Takevolet may modify, suspend, or discontinue services at any time without prior notice.

## 11. Governing Law
These Terms shall be governed by the laws of India.

## 12. Contact
Website: https://takevolet.online
Email: support@takevolet.online
Phone: +91 79819 94870''',
      );
}

class RefundScreen extends StatelessWidget {
  const RefundScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaticScreen(
        title: 'Refund Policy',
        content: '''# Refund and Cancellation Policy

Effective Date: June 2026

At Takevolet, we strive to provide quality room discovery and accommodation support services.

## 1. Subscription and Service Fees
Payments made for room lead access, premium features, and room assistance services may be subject to specific refund conditions.

## 2. General Room Hunt Services
Fees paid for accessing room leads, contact information, or room discovery services are generally non-refundable once the service has been delivered.

## 3. Personal Room Hunt Services
Where applicable, refund eligibility will be determined based on the specific service plan selected.
If a refund guarantee is explicitly stated for a service plan, the refund will be processed according to that plan's conditions.

## 4. Duplicate Payments
Duplicate transactions caused by technical errors may be refunded after verification.

## 5. Failed Transactions
If payment is deducted but service is not activated, users may contact support for resolution.

## 6. Cancellation
Users may stop using the service at any time.
Cancellation does not automatically entitle users to a refund.

## 7. Processing Time
Approved refunds may take 5–10 business days to appear in the original payment method.

## 8. Contact
Email: support@takevolet.online
Phone: +91 79819 94870''',
      );
}

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaticScreen(
        title: 'Contact Us',
        content: '''# Contact Us

Thank you for contacting Takevolet.

For support, room-related assistance, payment issues, account help, or business inquiries, please reach out to us.

## General Support
Website: https://takevolet.online
Email: support@takevolet.online
Phone: +91 79819 94870

## Business Hours
Monday – Saturday
10:00 AM – 7:00 PM IST

## About Takevolet
Takevolet is a bachelor-focused accommodation platform helping users discover:
* Bachelor Rooms
* Flatmates
* Replacement Flatmates
* Room Vacancies
* PG Accommodation
* Furnished Rooms
* Couple-Friendly Rooms

Currently serving Hyderabad, Bangalore, Pune, Mumbai, Delhi, and Chennai with plans for future expansion.

Founder: Nithin Patel''',
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
