import 'dart:io';
import 'dart:typed_data';
import 'package:minio/minio.dart';
import 'package:mime/mime.dart';
import 'package:path/path.dart' as path;

class R2StorageService {
  // Cloudflare R2 Credentials
  static const String _endPoint = 'ec7011a55f044eeb6fb5459880ddb598.r2.cloudflarestorage.com';
  static const String _accessKey = '2db3874b9dc096845b4b218cafcb0f25';
  static const String _secretKey = '72dfb320cf6b563647e1f5ac4caf86982879d63bd27f31e127be99e65f2f03f1';
  static const String _bucketName = 'takevolet-media';
  static const String _publicDevUrl = 'https://pub-6e2dfd0939c946adb7029c6cdae04896.r2.dev';

  // Initialize Minio client
  static final Minio _minio = Minio(
    endPoint: _endPoint,
    accessKey: _accessKey,
    secretKey: _secretKey,
    useSSL: true,
  );

  /// Uploads a file to Cloudflare R2 and returns the public URL
  static Future<String> uploadFile(File file, String destinationPath) async {
    try {
      // Determine the mime type (content type)
      final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';
      
      // Ensure destination path doesn't start with a slash
      final sanitizedPath = destinationPath.startsWith('/') 
          ? destinationPath.substring(1) 
          : destinationPath;

      // Upload file directly to R2
      await _minio.putObject(
        _bucketName,
        sanitizedPath,
        file.openRead().map((chunk) => Uint8List.fromList(chunk)),
        size: await file.length(),
        metadata: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000',
        },
      );

      // Return the public URL
      return '$_publicDevUrl/$sanitizedPath';
    } catch (e) {
      print('Error uploading to R2: $e');
      throw Exception('Failed to upload image: $e');
    }
  }
}
