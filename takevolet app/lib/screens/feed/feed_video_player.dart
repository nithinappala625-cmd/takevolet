import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';

class FeedVideoPlayer extends StatefulWidget {
  final String videoUrl;
  const FeedVideoPlayer({super.key, required this.videoUrl});

  @override
  State<FeedVideoPlayer> createState() => _FeedVideoPlayerState();
}

class _FeedVideoPlayerState extends State<FeedVideoPlayer> {
  late VideoPlayerController _videoPlayerController;
  ChewieController? _chewieController;
  bool _isError = false;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    try {
      _videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl));
      await _videoPlayerController.initialize();
      _chewieController = ChewieController(
        videoPlayerController: _videoPlayerController,
        autoPlay: false,
        looping: false,
        aspectRatio: _videoPlayerController.value.aspectRatio,
        errorBuilder: (context, errorMessage) {
          return const Center(
            child: Text(
              'Error playing video',
              style: TextStyle(color: Colors.white),
            ),
          );
        },
      );
      if (mounted) setState(() {});
    } catch (e) {
      debugPrint('Video player error: $e');
      if (mounted) setState(() => _isError = true);
    }
  }

  @override
  void dispose() {
    _videoPlayerController.dispose();
    _chewieController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_isError) {
      return Container(
        height: 200,
        color: Colors.grey.shade900,
        alignment: Alignment.center,
        child: const Text('Error loading video', style: TextStyle(color: Colors.white)),
      );
    }
    
    if (_chewieController != null && _videoPlayerController.value.isInitialized) {
      return Container(
        constraints: const BoxConstraints(maxHeight: 400),
        child: AspectRatio(
          aspectRatio: _videoPlayerController.value.aspectRatio,
          child: Chewie(controller: _chewieController!),
        ),
      );
    }

    return Container(
      height: 200,
      color: Colors.black12,
      child: const Center(
        child: CircularProgressIndicator(color: Color(0xFFD4AF37)),
      ),
    );
  }
}
