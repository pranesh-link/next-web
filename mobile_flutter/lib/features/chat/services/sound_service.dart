import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provides the singleton SoundService instance.
final soundServiceProvider = Provider<SoundService>((ref) {
  final service = SoundService();
  ref.onDispose(service.dispose);
  return service;
});

/// Handles playback of chat sound effects (send/receive).
class SoundService {
  final AudioPlayer _sendPlayer = AudioPlayer();
  final AudioPlayer _receivePlayer = AudioPlayer();
  bool _initialized = false;

  /// Pre-load audio sources for faster playback.
  Future<void> init() async {
    if (_initialized) return;
    try {
      await _sendPlayer.setSource(AssetSource('sounds/send.mp3'));
      await _receivePlayer.setSource(AssetSource('sounds/receive.mp3'));
      await _sendPlayer.setVolume(0.6);
      await _receivePlayer.setVolume(0.6);
      _initialized = true;
    } catch (e) {
      debugPrint('[SoundService] Failed to init: $e');
    }
  }

  /// Play the message-sent sound.
  Future<void> playSend() async {
    try {
      await _sendPlayer.stop();
      await _sendPlayer.play(AssetSource('sounds/send.mp3'));
    } catch (e) {
      debugPrint('[SoundService] playSend error: $e');
    }
  }

  /// Play the message-received sound.
  Future<void> playReceive() async {
    try {
      await _receivePlayer.stop();
      await _receivePlayer.play(AssetSource('sounds/receive.mp3'));
    } catch (e) {
      debugPrint('[SoundService] playReceive error: $e');
    }
  }

  /// Release audio resources.
  void dispose() {
    _sendPlayer.dispose();
    _receivePlayer.dispose();
  }
}
