import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

/// Hold-to-record voice message UI. Replaces input when recording.
class VoiceRecorder extends ConsumerStatefulWidget {
  final VoidCallback onCancel;

  const VoiceRecorder({super.key, required this.onCancel});

  @override
  ConsumerState<VoiceRecorder> createState() => _VoiceRecorderState();
}

class _VoiceRecorderState extends ConsumerState<VoiceRecorder> {
  final AudioRecorder _recorder = AudioRecorder();
  Timer? _timer;
  int _seconds = 0;
  bool _isRecording = false;
  double _dragX = 0;
  String? _filePath;

  @override
  void initState() {
    super.initState();
    _startRecording();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _recorder.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    if (!await _recorder.hasPermission()) {
      widget.onCancel();
      return;
    }

    final dir = await getTemporaryDirectory();
    _filePath = '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.m4a';

    await _recorder.start(
      const RecordConfig(encoder: AudioEncoder.aacLc),
      path: _filePath!,
    );

    setState(() => _isRecording = true);
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _seconds++);
    });
  }

  Future<void> _stopAndSend() async {
    _timer?.cancel();
    final path = await _recorder.stop();
    if (path != null && _seconds > 0) {
      final file = File(path);
      await ref.read(chatNotifierProvider.notifier).sendVoice(
        file,
        _seconds * 1000,
      );
    }
    widget.onCancel();
  }

  void _cancelRecording() async {
    _timer?.cancel();
    await _recorder.stop();
    if (_filePath != null) {
      final file = File(_filePath!);
      if (await file.exists()) await file.delete();
    }
    widget.onCancel();
  }

  String _formatTime(int seconds) {
    final m = (seconds ~/ 60).toString().padLeft(2, '0');
    final s = (seconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: context.colors.bgElevated,
        border: Border(top: BorderSide(color: context.colors.cardBorder)),
      ),
      child: SafeArea(
        top: false,
        child: GestureDetector(
          onHorizontalDragUpdate: (details) {
            setState(() => _dragX += details.delta.dx);
            if (_dragX < -100) _cancelRecording();
          },
          child: Row(
            children: [
              // Slide to cancel indicator
              Expanded(
                child: Row(
                  children: [
                    Icon(
                      Icons.arrow_back_ios,
                      size: 14,
                      color: context.colors.textMuted,
                    ),
                    Text(
                      'Slide to cancel',
                      style: TextStyle(
                        color: context.colors.textMuted,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              // Duration timer
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.xs,
                ),
                decoration: BoxDecoration(
                  color: context.colors.danger.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: context.colors.danger,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      _formatTime(_seconds),
                      style: TextStyle(
                        color: context.colors.danger,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              // Send button
              GestureDetector(
                onTap: _isRecording ? _stopAndSend : null,
                child: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: context.colors.accent,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.send,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
