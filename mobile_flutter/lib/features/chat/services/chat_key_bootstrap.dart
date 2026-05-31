import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';
import 'package:luvverse/features/chat/repositories/chat_repository.dart';
import 'package:luvverse/features/chat/services/crypto_service.dart';

/// Encapsulates the full E2E key lifecycle: generate, upload public key,
/// fetch partner key, derive shared secret. Idempotent — safe to call from
/// multiple sites (sign-in, app start, chat screen open).
class ChatKeyBootstrap {
  ChatKeyBootstrap(this._crypto, this._repo);

  final CryptoService _crypto;
  final ChatRepository _repo;

  Future<bool>? _inFlight;
  bool _ready = false;

  /// Whether shared key has been derived. Combines local flag with the
  /// underlying crypto service readiness for defense-in-depth.
  bool get isReady => _ready && _crypto.isReady;

  /// Underlying crypto service — exposed so callers can encrypt/decrypt
  /// without reaching into Riverpod providers.
  CryptoService get crypto => _crypto;

  /// Idempotent. Returns true if shared key is derived (encryption ready),
  /// false if partner key is not yet on the server. Never throws.
  Future<bool> ensureBootstrapped() async {
    if (_ready && _crypto.isReady) return true;
    final existing = _inFlight;
    if (existing != null) return existing;

    final future = _run();
    _inFlight = future;
    try {
      return await future;
    } finally {
      _inFlight = null;
    }
  }

  Future<bool> _run() async {
    try {
      if (!await _crypto.hasKeyPair()) {
        await _crypto.generateKeyPair();
      }

      final pub = await _crypto.exportPublicKeyBase64();
      if (pub != null) {
        try {
          await _repo.uploadPublicKey(pub);
        } catch (e) {
          // Server upload is idempotent; tolerate transient errors.
          debugPrint('[ChatKeyBootstrap] uploadPublicKey failed: $e');
        }
      }

      final partnerKey = await _repo.getPartnerPublicKey();
      if (partnerKey == null) {
        // Partner has not uploaded yet — do NOT cache success; allow retry.
        return false;
      }

      await _crypto.deriveSharedKey(partnerKey);
      _ready = true;
      return true;
    } catch (e, st) {
      debugPrint('[ChatKeyBootstrap] bootstrap failed: $e\n$st');
      return false;
    }
  }
}

/// Singleton per app lifetime — the bootstrap caches readiness so that
/// repeat calls after success are O(1).
final chatKeyBootstrapProvider = Provider<ChatKeyBootstrap>((ref) {
  return ChatKeyBootstrap(
    ref.read(cryptoServiceProvider),
    ref.read(chatRepositoryProvider),
  );
});
