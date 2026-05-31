import 'dart:convert';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Manages epoch-based key ratcheting for forward secrecy.
///
/// The shared ECDH secret is used as input keying material. Each epoch
/// derives a unique AES-256 key via HKDF with the epoch counter as info.
/// Old epoch keys are stored locally so historical messages remain decryptable.
///
/// Epoch rotates every 24 hours or every 100 messages (whichever first).
class EpochKeyStore {
  static const _epochCounterKey = 'e2e_epoch_counter';
  static const _epochKeysPrefix = 'e2e_epoch_key_';
  static const _epochTimestampKey = 'e2e_epoch_timestamp';
  static const _epochMessageCountKey = 'e2e_epoch_msg_count';
  static const _storage = FlutterSecureStorage();

  static const int messagesPerEpoch = 100;
  static const Duration epochDuration = Duration(hours: 24);

  int _currentEpoch = 0;
  int _messageCount = 0;
  DateTime? _epochStartTime;
  SecretKey? _currentKey;
  Uint8List? _sharedSecret;

  /// Initialize the epoch store with the ECDH shared secret.
  Future<void> init(Uint8List sharedSecret) async {
    _sharedSecret = sharedSecret;

    final storedEpoch = await _storage.read(key: _epochCounterKey);
    _currentEpoch = storedEpoch != null ? int.parse(storedEpoch) : 0;

    final storedCount = await _storage.read(key: _epochMessageCountKey);
    _messageCount = storedCount != null ? int.parse(storedCount) : 0;

    final storedTimestamp = await _storage.read(key: _epochTimestampKey);
    _epochStartTime = storedTimestamp != null
        ? DateTime.parse(storedTimestamp)
        : DateTime.now();

    _currentKey = await _deriveEpochKey(_currentEpoch);
    await _storeEpochKey(_currentEpoch, _currentKey!);
  }

  /// Get the current epoch number.
  int get currentEpoch => _currentEpoch;

  /// Get the encryption key for the current epoch.
  /// Automatically rotates if thresholds exceeded.
  Future<SecretKey> getEncryptionKey() async {
    if (_shouldRotate()) {
      await _rotate();
    }
    _messageCount++;
    await _storage.write(
        key: _epochMessageCountKey, value: _messageCount.toString());
    return _currentKey!;
  }

  /// Get the decryption key for a specific epoch.
  /// Returns the stored key for historical messages.
  Future<SecretKey?> getDecryptionKey(int epoch) async {
    if (epoch == _currentEpoch) return _currentKey;

    // Try to load from stored keys
    final stored = await _storage.read(key: '$_epochKeysPrefix$epoch');
    if (stored != null) {
      final bytes = base64Decode(stored);
      return SecretKey(bytes);
    }

    // Derive it if we have the shared secret
    if (_sharedSecret != null) {
      final key = await _deriveEpochKey(epoch);
      await _storeEpochKey(epoch, key);
      return key;
    }

    return null;
  }

  bool _shouldRotate() {
    if (_messageCount >= messagesPerEpoch) return true;
    if (_epochStartTime != null &&
        DateTime.now().difference(_epochStartTime!) >= epochDuration) {
      return true;
    }
    return false;
  }

  Future<void> _rotate() async {
    _currentEpoch++;
    _messageCount = 0;
    _epochStartTime = DateTime.now();
    _currentKey = await _deriveEpochKey(_currentEpoch);

    await _storage.write(key: _epochCounterKey, value: _currentEpoch.toString());
    await _storage.write(key: _epochMessageCountKey, value: '0');
    await _storage.write(
        key: _epochTimestampKey, value: _epochStartTime!.toIso8601String());
    await _storeEpochKey(_currentEpoch, _currentKey!);

    debugPrint('[EpochKeyStore] Rotated to epoch $_currentEpoch');
  }

  Future<SecretKey> _deriveEpochKey(int epoch) async {
    final hkdf = Hkdf(hmac: Hmac.sha256(), outputLength: 32);
    final derivedKey = await hkdf.deriveKey(
      secretKey: SecretKey(_sharedSecret!),
      info: utf8.encode('luvverse-chat-epoch-$epoch'),
      nonce: Uint8List(0),
    );
    return derivedKey;
  }

  Future<void> _storeEpochKey(int epoch, SecretKey key) async {
    final bytes = await key.extractBytes();
    await _storage.write(
        key: '$_epochKeysPrefix$epoch', value: base64Encode(bytes));
  }

  /// Clear all stored epoch data (used on logout).
  Future<void> clear() async {
    for (int i = 0; i <= _currentEpoch; i++) {
      await _storage.delete(key: '$_epochKeysPrefix$i');
    }
    await _storage.delete(key: _epochCounterKey);
    await _storage.delete(key: _epochMessageCountKey);
    await _storage.delete(key: _epochTimestampKey);
    _currentEpoch = 0;
    _messageCount = 0;
    _currentKey = null;
  }
}
