import re

def update_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# The new Dialog widget code
new_dialog_code = """        showDialog(
          context: context,
          builder: (ctx) => Dialog(
            backgroundColor: Colors.white,
            surfaceTintColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 10),
                  // Checkmark in Gold Circle
                  Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFFD4AF37), width: 2),
                    ),
                    child: const Center(
                      child: Icon(Icons.check, color: Color(0xFFD4AF37), size: 32),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Title
                  const Text('Booking Confirmed! 🎉', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87)),
                  const SizedBox(height: 16),
                  // Subtitle
                  Text(
                    'Your booking has been placed\\nwith Cash on Delivery.\\nThe provider will contact you shortly.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade800, height: 1.5),
                  ),
                  const SizedBox(height: 24),
                  // Safe & Secure Card
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4), // Light green
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.security_outlined, color: Color(0xFF166534), size: 24),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Safe & Secure', style: TextStyle(color: Color(0xFF166534), fontWeight: FontWeight.bold, fontSize: 13)),
                            Text('Zero brokers involved', style: TextStyle(color: const Color(0xFF166534).withOpacity(0.8), fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Got it Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFD4AF37),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: const Text('Got it', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          )
        );"""

replacements = [
    (
        r"showDialog\([\s\S]*?actions: \[\n\s*TextButton\(onPressed: \(\) => Navigator\.pop\(ctx\), child: const Text\('OK', style: TextStyle\(color: \nColors\.black\)\)\)\n\s*\],\n\s*\)\n\s*\);",
        new_dialog_code
    ),
    (
        r"showDialog\([\s\S]*?actions: \[\n\s*TextButton\(onPressed: \(\) => Navigator\.pop\(ctx\), child: const Text\('OK', style: TextStyle\(color: Colors\.black\)\)\)\n\s*\],\n\s*\)\n\s*\);",
        new_dialog_code
    )
]

update_file("takevolet app/lib/screens/build/build_detail_screen.dart", replacements)
