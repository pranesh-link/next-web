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
  int? _partnerKeyVersion;
  String? _partnerKeyRotatedAt;

  /// Whether shared key has been derived. Combines local flag with the
  /// underlying crypto service readiness for defense-in-depth.
  bool get isReady => _ready && _crypto.isReady;

  /// Partner's current key version (1 = original, >1 = rotated).
  int? get partnerKeyVersion => _partnerKeyVersion;

  /// ISO timestamp of partner's last key rotation.
  String? get partnerKeyRotatedAt => _partnerKeyRotatedAt;

  /// Whether the partner has rotated their key (device reinstall).
  bool get partnerKeyRotated => (_partnerKeyVersion ?? 1) > 1;

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
          final uploadRes = await _repo.uploadPublicKey(pub);
          // If server says key already exists with different value,
          // force-rotate (we lost our old private key — e.g. reinstall).
          if (uploadRes['existing'] == true) {
            await _repo.uploadPublicKeyForce(pub);
          }
        } catch (e) {
          debugPrint('[ChatKeyBootstrap] uploadPublicKey failed: $e');
        }
      }

      final partnerData = await _repo.getPartnerPublicKeyWithVersion();
      _partnerKeyVersion = partnerData.keyVersion;
      _partnerKeyRotatedAt = partnerData.keyRotatedAt;

      if (partnerData.publicKey == null) {
        return false;
      }

      await _crypto.deriveSharedKey(partnerData.publicKey!);
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
