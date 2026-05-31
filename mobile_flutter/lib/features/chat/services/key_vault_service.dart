import 'dart:convert';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:luvverse/features/chat/repositories/chat_repository.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';

/// Manages the encrypted key vault — allows backing up the E2E private key
/// to the server, protected by a user-chosen 6-digit PIN.
///
/// The PIN is stretched via PBKDF2 (600K iterations) to derive an AES-256 key
/// which encrypts the private key locally before upload. The server only ever
/// sees the ciphertext blob.
class KeyVaultService {
  KeyVaultService(this._repo);

  final ChatRepository _repo;
  static const _pinHashKey = 'e2e_vault_pin_hash';
  static const _storage = FlutterSecureStorage();

  /// Check if the user has already set up a PIN.
  Future<bool> hasPinConfigured() async {
    final hash = await _storage.read(key: _pinHashKey);
    return hash != null;
  }

  /// Create (or overwrite) the key vault.
  /// Encrypts the private key with a PIN-derived AES key and uploads.
  Future<bool> createVault({
    required String pin,
    required String userId,
    required Uint8List privateKeyBytes,
  }) async {
    try {
      final vaultKey = await _deriveKey(pin, userId);
      final encrypted = await _encrypt(privateKeyBytes, vaultKey);
      final vaultB64 = base64Encode(encrypted);

      final success = await _repo.uploadKeyVault(vaultB64);
      if (success) {
        // Store a hash of the PIN locally so we know it's set up
        final pinHash = base64Encode(
          Uint8List.fromList(
            (await Sha256().hash(utf8.encode(pin))).bytes,
          ),
        );
        await _storage.write(key: _pinHashKey, value: pinHash);
      }
      return success;
    } catch (e) {
      debugPrint('[KeyVault] createVault failed: $e');
      return false;
    }
  }

  /// Restore the private key from the server vault using the user's PIN.
  Future<Uint8List?> restoreFromVault({
    required String pin,
    required String userId,
  }) async {
    try {
      final vaultB64 = await _repo.downloadKeyVault();
      if (vaultB64 == null) return null;

      final vaultBytes = base64Decode(vaultB64);
      final vaultKey = await _deriveKey(pin, userId);
      final decrypted = await _decrypt(vaultBytes, vaultKey);
      return decrypted;
    } catch (e) {
      debugPrint('[KeyVault] restoreFromVault failed: $e');
      return null;
    }
  }

  /// Derive a 256-bit AES key from the PIN + userId salt.
  Future<SecretKey> _deriveKey(String pin, String userId) async {
    final pbkdf2 = Pbkdf2(
      macAlgorithm: Hmac.sha256(),
      iterations: 600000,
      bits: 256,
    );
    final secretKey = await pbkdf2.deriveKey(
      secretKey: SecretKey(utf8.encode(pin)),
      nonce: utf8.encode(userId),
    );
    return secretKey;
  }

  /// Encrypt data with AES-256-GCM.
  Future<Uint8List> _encrypt(Uint8List data, SecretKey key) async {
    final algo = AesGcm.with256bits();
    final secretBox = await algo.encrypt(data, secretKey: key);
    // Format: [12-byte nonce][ciphertext + 16-byte MAC]
    final result = Uint8List(
        secretBox.nonce.length + secretBox.cipherText.length + secretBox.mac.bytes.length);
    result.setAll(0, secretBox.nonce);
    result.setAll(secretBox.nonce.length, secretBox.cipherText);
    result.setAll(
        secretBox.nonce.length + secretBox.cipherText.length, secretBox.mac.bytes);
    return result;
  }

  /// Decrypt data with AES-256-GCM.
  Future<Uint8List?> _decrypt(Uint8List data, SecretKey key) async {
    if (data.length < 28) return null; // 12 nonce + 16 MAC minimum
    final algo = AesGcm.with256bits();
    final nonce = data.sublist(0, 12);
    final cipherText = data.sublist(12, data.length - 16);
    final mac = Mac(data.sublist(data.length - 16));
    final secretBox = SecretBox(cipherText, nonce: nonce, mac: mac);
    final decrypted = await algo.decrypt(secretBox, secretKey: key);
    return Uint8List.fromList(decrypted);
  }
}

final keyVaultServiceProvider = Provider<KeyVaultService>((ref) {
  return KeyVaultService(ref.read(chatRepositoryProvider));
});
