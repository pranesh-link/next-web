import 'dart:async';
import 'dart:io';

import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/services/encrypted_file_loader.dart';
import 'package:path_provider/path_provider.dart';

/// Plays encrypted voice messages: downloads, decrypts, writes to temp file, plays.
class EncryptedVoiceBubble extends ConsumerStatefulWidget {
  final String filePath;
  final int durationMs;
  final bool isMe;

  const EncryptedVoiceBubble({
    super.key,
    required this.filePath,
    required this.durationMs,
    required this.isMe,
  });

  @override
  ConsumerState<EncryptedVoiceBubble> createState() =>
      _EncryptedVoiceBubbleState();
}

class _EncryptedVoiceBubbleState extends ConsumerState<EncryptedVoiceBubble> {
  final AudioPlayer _player = AudioPlayer();
  bool _isPlaying = false;
  Duration _position = Duration.zero;
  late Duration _duration;
  StreamSubscription? _positionSub;
  StreamSubscription? _stateSub;
  bool _loading = true;
  bool _error = false;
  String? _tempFilePath;

  @override
  void initState() {
    super.initState();
    _duration = Duration(milliseconds: widget.durationMs);
    _positionSub = _player.onPositionChanged.listen((pos) {
      if (mounted) setState(() => _position = pos);
    });
    _stateSub = _player.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() => _isPlaying = state == PlayerState.playing);
        if (state == PlayerState.completed) {
          setState(() => _position = Duration.zero);
        }
      }
    });
    _loadAudio();
  }

  Future<void> _loadAudio() async {
    try {
      final loader = ref.read(encryptedFileLoaderProvider);
      final bytes = await loader.load(widget.filePath);
      if (!mounted) return;
      if (bytes == null) {
        setState(() {
          _loading = false;
          _error = true;
        });
        return;
      }
      // Write decrypted bytes to a temp file for AudioPlayer
      final tempDir = await getTemporaryDirectory();
      final tempFile = File(
        '${tempDir.path}/voice_${widget.filePath.hashCode}.m4a',
      );
      await tempFile.writeAsBytes(bytes);
      _tempFilePath = tempFile.path;
      setState(() => _loading = false);
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = true;
        });
      }
    }
  }

  @override
  void dispose() {
    _positionSub?.cancel();
    _stateSub?.cancel();
    _player.dispose();
    super.dispose();
  }

  Future<void> _togglePlay() async {
    if (_tempFilePath == null) return;
    if (_isPlaying) {
      await _player.pause();
    } else {
      await _player.play(DeviceFileSource(_tempFilePath!));
    }
  }

  String _formatDuration(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final barColor = widget.isMe
        ? Colors.white70
        : Theme.of(context).colorScheme.primary;

    if (_loading) {
      return Container(
        width: 200,
        height: 50,
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
      );
    }

    if (_error) {
      return Container(
        width: 200,
        height: 50,
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: const Center(
          child: Icon(Icons.error_outline, color: Colors.grey),
        ),
      );
    }

    final progress = _duration.inMilliseconds > 0
        ? _position.inMilliseconds / _duration.inMilliseconds
        : 0.0;

    return SizedBox(
      width: 200,
      child: Row(
        children: [
          IconButton(
            icon: Icon(
              _isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled,
              color: barColor,
              size: 32,
            ),
            onPressed: _togglePlay,
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: progress,
                    backgroundColor: barColor.withValues(alpha: 0.2),
                    color: barColor,
                    minHeight: 3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDuration(_isPlaying ? _position : _duration),
                  style: TextStyle(fontSize: 11, color: barColor),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
