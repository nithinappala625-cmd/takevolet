import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'legal_feed_screen.dart';

class LegalHubScreen extends StatelessWidget {
  const LegalHubScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final List<Map<String, dynamic>> legalCategories = [
      {'name': 'Property Lawyer', 'icon': Icons.gavel},
      {'name': 'Licensed Deed Writer', 'icon': Icons.draw},
      {'name': 'Registration Consultant', 'icon': Icons.how_to_reg},
      {'name': 'MeeSeva Center', 'icon': Icons.storefront},
      {'name': 'Tax Consultant', 'icon': Icons.account_balance},
      {'name': 'Home Loan Consultant', 'icon': Icons.home_work},
      {'name': 'Notary Public', 'icon': Icons.verified_user},
      {'name': 'RERA Consultant', 'icon': Icons.apartment},
    ];

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.black),
          onPressed: () => context.canPop() ? context.pop() : null,
        ),
        title: const Text(
          'Legal Cell',
          style: TextStyle(color: Color(0xFF7B3AEC), fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Select a Legal Service',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.grey[800]),
            ),
            const SizedBox(height: 8),
            Text(
              'Find certified professionals for all your legal property needs.',
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  childAspectRatio: 0.85,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: legalCategories.length,
                itemBuilder: (context, index) {
                  final item = legalCategories[index];
                  return InkWell(
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => LegalFeedScreen(category: item['name'] as String)));
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF7B3AEC).withOpacity(0.1),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(item['icon'] as IconData, color: const Color(0xFF7B3AEC), size: 28),
                          ),
                          const SizedBox(height: 12),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4.0),
                            child: Text(
                              item['name'] as String,
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black87),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
