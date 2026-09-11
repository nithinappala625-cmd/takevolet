import 'dart:io';
void main() {
  var dir = Directory('lib');
  for (var file in dir.listSync(recursive: true)) {
    if (file is File && file.path.endsWith('.dart')) {
      var content = file.readAsStringSync();
      var newContent = content.replaceAll('=> context.pop(),', '=> context.canPop() ? context.pop() : null,');
      newContent = newContent.replaceAll('=> context.pop()', '=> { if(context.canPop()) context.pop() }');
      newContent = newContent.replaceAll('context.pop();', 'if(context.canPop()) context.pop();');
      
      // Also fix Image.network in build_subcategories_screen
      if (file.path.contains('build_subcategories_screen.dart')) {
        newContent = newContent.replaceAll(
          'child: Image.network(',
          'child: Image.network(\\n                                errorBuilder: (context, error, stackTrace) => const Icon(Icons.broken_image, color: Colors.grey),\\n'
        );
      }
      
      if (content != newContent) {
        file.writeAsStringSync(newContent);
        print('Fixed');
      }
    }
  }
}
