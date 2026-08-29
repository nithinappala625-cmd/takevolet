import 'dart:io';
import 'package:image/image.dart' as img;

void main() {
  final image = img.Image(width: 100, height: 100);
  img.drawString(image, 'Test', font: img.arial48, color: img.ColorRgba8(255,255,255,128));
  print('OK');
}
