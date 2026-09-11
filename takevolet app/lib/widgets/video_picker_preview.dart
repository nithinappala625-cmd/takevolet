import 'dart:io';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:google_fonts/google_fonts.dart';

class VideoPickerPreview extends StatefulWidget {
  final File? videoFile;
  final String? videoUrl;
  final VoidCallback onPick;
  final VoidCallback onRemove;
  final Color primaryColor;

  const VideoPickerPreview({
    super.key,
    this.videoFile,
    this.videoUrl,
    required this.onPick,
    required this.onRemove,
    this.primaryColor = const Color(0xFF7B3AEC),
  });

  @override
  State<VideoPickerPreview> createState() => _VideoPickerPreviewState();
}

class _VideoPickerPreviewState extends State<VideoPickerPreview> {
  VideoPlayerController? _controller;
  bool _isInitialized = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _initVideo();
  }

  @override
  void didUpdateWidget(covariant VideoPickerPreview oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.videoFile?.path != widget.videoFile?.path ||
        oldWidget.videoUrl != widget.videoUrl) {
      _initVideo();
    }
  }

  Future<void> _initVideo() async {
    _disposeController();
    if (widget.videoFile == null && (widget.videoUrl == null || widget.videoUrl!.isEmpty)) {
      if (mounted) setState(() { _isInitialized = false; _hasError = false; });
      return;
    }

    try {
      if (widget.videoFile != null) {
        _controller = VideoPlayerController.file(widget.videoFile!);
      } else if (widget.videoUrl != null && widget.videoUrl!.isNotEmpty) {
        _controller = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl!));
      }

      if (_controller != null) {
        await _controller!.initialize();
        _controller!.setLooping(true);
        if (mounted) {
          setState(() {
            _isInitialized = true;
            _hasError = false;
          });
        }
      }
    } catch (e) {
      debugPrint('[VideoPickerPreview] error initializing video: ');
      if (mounted) {
        setState(() {
          _hasError = true;
          _isInitialized = false;
        });
      }
    }
  }

  void _disposeController() {
    _controller?.pause();
    _controller?.dispose();
    _controller = null;
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  String _getFileSize() {
    if (widget.videoFile != null) {
      try {
        final bytes = widget.videoFile!.lengthSync();
        final mb = bytes / (1024 * 1024);
        return '${mb.toStringAsFixed(1)} MB';
      } catch (_) {
        return '';
      }
    }
    return 'Cloud Video';
  }

  String _getFileName() {
    if (widget.videoFile != null) {
      return widget.videoFile!.path.split(Platform.pathSeparator).last;
    }
    if (widget.videoUrl != null) {
      return widget.videoUrl!.split('/').last;
    }
    return 'Property Video';
  }

  @override
  Widget build(BuildContext context) {
    final hasVideo = widget.videoFile != null || (widget.videoUrl != null && widget.videoUrl!.isNotEmpty);

    if (!hasVideo) {
      return InkWell(
        onTap: widget.onPick,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
          decoration: BoxDecoration(
            color: widget.primaryColor.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: widget.primaryColor.withValues(alpha: 0.3), width: 1.5),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: widget.primaryColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.videocam_rounded, size: 28, color: widget.primaryColor),
              ),
              const SizedBox(height: 10),
              Text(
                'Upload Video Tour (Optional)',
                style: GoogleFonts.outfit(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Select video from phone gallery (Max 50MB)',
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  color: const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Video Player Screen
          Stack(
            alignment: Alignment.center,
            children: [
              Container(
                height: 200,
                width: double.infinity,
                color: Colors.black,
                child: _isInitialized && _controller != null
                    ? Center(
                        child: AspectRatio(
                          aspectRatio: _controller!.value.aspectRatio,
                          child: VideoPlayer(_controller!),
                        ),
                      )
                    : _hasError
                        ? Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.error_outline, color: Colors.white70, size: 36),
                                const SizedBox(height: 6),
                                Text(
                                  'Video selected (preview unavailable)',
                                  style: GoogleFonts.outfit(color: Colors.white70, fontSize: 12),
                                ),
                              ],
                            ),
                          )
                        : const Center(
                            child: CircularProgressIndicator(color: Colors.white),
                          ),
              ),

              // Play / Pause Overlay Button
              if (_isInitialized && _controller != null)
                GestureDetector(
                  onTap: () {
                    setState(() {
                      if (_controller!.value.isPlaying) {
                        _controller!.pause();
                      } else {
                        _controller!.play();
                      }
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.55),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _controller!.value.isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                      color: Colors.white,
                      size: 34,
                    ),
                  ),
                ),

              // Top Badges
              Positioned(
                top: 12,
                left: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.65),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 14),
                      const SizedBox(width: 5),
                      Text(
                        'Video Ready',
                        style: GoogleFonts.outfit(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),

              // Remove Button
              Positioned(
                top: 10,
                right: 10,
                child: GestureDetector(
                  onTap: () {
                    _disposeController();
                    widget.onRemove();
                  },
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.close_rounded, color: Colors.white, size: 18),
                  ),
                ),
              ),
            ],
          ),

          // File Info & Replace Button
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _getFileName(),
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w700,
                          fontSize: 13,
                          color: const Color(0xFF0F172A),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        _getFileSize(),
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.w500,
                          fontSize: 11.5,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                TextButton.icon(
                  onPressed: widget.onPick,
                  icon: const Icon(Icons.change_circle_rounded, size: 18),
                  label: const Text('Change'),
                  style: TextButton.styleFrom(
                    foregroundColor: widget.primaryColor,
                    visualDensity: VisualDensity.compact,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
