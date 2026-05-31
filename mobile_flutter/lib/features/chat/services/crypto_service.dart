import 'dart:convert';
import 'dart:typed_data';

import 'package:cryptography/cryptography.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:luvverse/features/chat/services/epoch_key_store.dart';

/// End-to-end encryption service using ECDH P-256 + AES-256-GCM.
///
/// Produces ciphertext/IV identical to the web implementation
/// (Web Crypto API with P-256 ECDH and AES-GCM 256-bit).
class CryptoService {
  static const _privateKeyStorageKey = 'ecdh_private_key_jwk';
  static const _publicKeyStorageKey = 'ecdh_public_key_jwk';

  final FlutterSecureStorage _storage;
  final Ecdh _ecdh = Ecdh.p256(length: 32);

  SecretKey? _sharedKey;
  EpochKeyStore? _epochStore;

  /// The epoch key store, available after [initEpochKeys] is called.
  EpochKeyStore? get epochStore => _epochStore;

  CryptoService({FlutterSecureStorage? storage})
    : _storage = storage ?? const FlutterSecureStorage();

  /// Generate a new ECDH P-256 key pair and persist to secure storage.
  Future<void> generateKeyPair() async {
    final keyPair = await _ecdh.newKeyPair();
    final keyPairData = await keyPair.extract();
    final publicKey = await keyPair.extractPublicKey();

    final privateJwk = _keyPairDataToJwk(keyPairData);
    final publicJwk = _ecPublicKeyToJwk(publicKey);

    await _storage.write(
      key: _privateKeyStorageKey,
      value: jsonEncode(privateJwk),
    );
    await _storage.write(
      key: _publicKeyStorageKey,
      value: jsonEncode(publicJwk),
    );
  }

  /// Check if a key pair already exists in storage.
  Future<bool> hasKeyPair() async {
    final pk = await _storage.read(key: _privateKeyStorageKey);
    return pk != null;
  }

  /// Export public key as base64-encoded JWK string
  /// (matches web: btoa(JSON.stringify(jwk))).
  Future<String?> exportPublicKeyBase64() async {
    final publicJwkStr = await _storage.read(key: _publicKeyStorageKey);
    if (publicJwkStr == null) return null;
    return base64Encode(utf8.encode(publicJwkStr));
  }

  /// Import partner's public key from base64 JWK and derive shared
  /// AES-256-GCM key.
  Future<void> deriveSharedKey(String partnerPublicKeyBase64) async {
    final partnerJwkStr = utf8.decode(base64Decode(partnerPublicKeyBase64));
    final partnerJwk = jsonDecode(partnerJwkStr) as Map<String, dynamic>;

    final partnerPublicKey = _jwkToEcPublicKey(partnerJwk);
    final myKeyPairData = await _loadKeyPairData();
    if (myKeyPairData == null) {
      throw StateError('No key pair found. Call generateKeyPair() first.');
    }

    final sharedSecretKey = await _ecdh.sharedSecretKey(
      keyPair: myKeyPairData,
      remotePublicKey: partnerPublicKey,
    );

    // Web Crypto deriveKey with ECDH produces raw shared secret bytes
    // used directly as AES-256 key material. The raw ECDH shared secret
    // from P-256 is 32 bytes (the x-coordinate), which matches AES-256.
    final sharedSecretBytes = await sharedSecretKey.extractBytes();
    _sharedKey = SecretKey(sharedSecretBytes);
  }

  /// Initialize epoch-based forward secrecy using the derived shared secret.
  /// Must be called after [deriveSharedKey].
  Future<void> initEpochKeys() async {
    if (_sharedKey == null) {
      throw StateError('Shared key not derived. Call deriveSharedKey() first.');
    }
    final sharedBytes = await _sharedKey!.extractBytes();
    _epochStore = EpochKeyStore();
    await _epochStore!.init(Uint8List.fromList(sharedBytes));
  }

  /// Encrypt with epoch-based forward secrecy.
  /// Returns {ciphertext, iv, epoch} or null if not ready.
  Future<Map<String, String>?> encryptWithEpoch(String plaintext) async {
    if (_epochStore == null) return encrypt(plaintext);

    final aesGcm = AesGcm.with256bits();
    final plaintextBytes = utf8.encode(plaintext);
    final epochKey = await _epochStore!.getEncryptionKey();

    final secretBox = await aesGcm.encrypt(plaintextBytes, secretKey: epochKey);

    final ciphertextWithTag = Uint8List.fromList([
      ...secretBox.cipherText,
      ...secretBox.mac.bytes,
    ]);

    return {
      'ciphertext': base64Encode(ciphertextWithTag),
      'iv': base64Encode(Uint8List.fromList(secretBox.nonce)),
      'epoch': _epochStore!.currentEpoch.toString(),
    };
  }

  /// Decrypt with epoch-based forward secrecy.
  /// Falls back to static shared key if epoch is null (legacy messages).
  Future<String?> decryptWithEpoch(
    String ciphertextBase64,
    String ivBase64,
    int? epoch,
  ) async {
    if (epoch == null || _epochStore == null) {
      return decrypt(ciphertextBase64, ivBase64);
    }

    try {
      final epochKey = await _epochStore!.getDecryptionKey(epoch);
      if (epochKey == null) {
        // Fallback to static key for unresolvable epochs
        return decrypt(ciphertextBase64, ivBase64);
      }

      final aesGcm = AesGcm.with256bits();
      final combined = base64Decode(ciphertextBase64);
      final iv = base64Decode(ivBase64);

      if (combined.length < 16) return null;
      final cipherText = combined.sublist(0, combined.length - 16);
      final mac = Mac(combined.sublist(combined.length - 16));

      final secretBox = SecretBox(cipherText, nonce: iv, mac: mac);
      final plainBytes = await aesGcm.decrypt(secretBox, secretKey: epochKey);
      return utf8.decode(plainBytes);
    } catch (_) {
      // Fallback to static key on any epoch decryption failure
      return decrypt(ciphertextBase64, ivBase64);
    }
  }

  /// Encrypt plaintext -> {ciphertext: base64, iv: base64}.
  ///
  /// Uses AES-256-GCM with a random 12-byte IV, matching the web
  /// implementation.
  Future<Map<String, String>?> encrypt(String plaintext) async {
    if (_sharedKey == null) return null;

    final aesGcm = AesGcm.with256bits();
    final plaintextBytes = utf8.encode(plaintext);

    final secretBox = await aesGcm.encrypt(
      plaintextBytes,
      secretKey: _sharedKey!,
    );

    // Combine ciphertext + mac (GCM tag) — same as Web Crypto output
    final ciphertextWithTag = Uint8List.fromList([
      ...secretBox.cipherText,
      ...secretBox.mac.bytes,
    ]);

    return {
      'ciphertext': base64Encode(ciphertextWithTag),
      'iv': base64Encode(Uint8List.fromList(secretBox.nonce)),
    };
  }

  /// Decrypt {ciphertext: base64, iv: base64} -> plaintext or null on failure.
  Future<String?> decrypt(String ciphertextBase64, String ivBase64) async {
    if (_sharedKey == null) return null;

    try {
      final aesGcm = AesGcm.with256bits();
      final combined = base64Decode(ciphertextBase64);
      final iv = base64Decode(ivBase64);

      // Web Crypto appends 16-byte GCM tag to ciphertext
      if (combined.length < 16) return null;
      final cipherText = combined.sublist(0, combined.length - 16);
      final mac = Mac(combined.sublist(combined.length - 16));

      final secretBox = SecretBox(cipherText, nonce: iv, mac: mac);

      final plainBytes = await aesGcm.decrypt(
        secretBox,
        secretKey: _sharedKey!,
      );

      return utf8.decode(plainBytes);
    } catch (_) {
      return null;
    }
  }

  /// Encrypt raw bytes using AES-256-GCM.
  /// Returns: [12-byte IV][ciphertext + 16-byte GCM tag] as a single Uint8List.
  Future<Uint8List?> encryptBytes(Uint8List data) async {
    if (_sharedKey == null) return null;

    final aesGcm = AesGcm.with256bits();
    final secretBox = await aesGcm.encrypt(data, secretKey: _sharedKey!);

    // Format: IV (12 bytes) + ciphertext + MAC (16 bytes)
    final combined = Uint8List(12 + secretBox.cipherText.length + 16);
    combined.setAll(0, secretBox.nonce);
    combined.setAll(12, secretBox.cipherText);
    combined.setAll(12 + secretBox.cipherText.length, secretBox.mac.bytes);
    return combined;
  }

  /// Decrypt bytes encrypted with `encryptBytes`.
  /// Expects format: [12-byte IV][ciphertext + 16-byte GCM tag].
  /// Returns null on failure.
  Future<Uint8List?> decryptBytes(Uint8List encryptedData) async {
    if (_sharedKey == null) return null;

    try {
      if (encryptedData.length < 12 + 16) return null;
      final aesGcm = AesGcm.with256bits();

      final iv = encryptedData.sublist(0, 12);
      final cipherTextWithMac = encryptedData.sublist(12);
      final cipherText = cipherTextWithMac.sublist(
        0,
        cipherTextWithMac.length - 16,
      );
      final mac = Mac(cipherTextWithMac.sublist(cipherTextWithMac.length - 16));

      final secretBox = SecretBox(cipherText, nonce: iv, mac: mac);
      final plainBytes = await aesGcm.decrypt(
        secretBox,
        secretKey: _sharedKey!,
      );
      return Uint8List.fromList(plainBytes);
    } catch (_) {
      return null;
    }
  }

  /// Whether the shared key has been derived (ready to encrypt/decrypt).
  bool get isReady => _sharedKey != null;

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  Future<EcKeyPairData?> _loadKeyPairData() async {
    final privateJwkStr = await _storage.read(key: _privateKeyStorageKey);
    if (privateJwkStr == null) return null;
    final jwk = jsonDecode(privateJwkStr) as Map<String, dynamic>;
    return _jwkToKeyPairData(jwk);
  }

  /// Convert EcKeyPairData to JWK map (private key included).
  Map<String, dynamic> _keyPairDataToJwk(EcKeyPairData keyPairData) {
    return {
      'kty': 'EC',
      'crv': 'P-256',
      'x': _base64UrlNoPad(Uint8List.fromList(keyPairData.x)),
      'y': _base64UrlNoPad(Uint8List.fromList(keyPairData.y)),
      'd': _base64UrlNoPad(Uint8List.fromList(keyPairData.d)),
      'key_ops': ['deriveKey'],
      'ext': true,
    };
  }

  /// Convert EcPublicKey to public-only JWK map.
  Map<String, dynamic> _ecPublicKeyToJwk(EcPublicKey publicKey) {
    return {
      'kty': 'EC',
      'crv': 'P-256',
      'x': _base64UrlNoPad(Uint8List.fromList(publicKey.x)),
      'y': _base64UrlNoPad(Uint8List.fromList(publicKey.y)),
      'key_ops': [],
      'ext': true,
    };
  }

  /// Parse a public-only JWK into an EcPublicKey.
  EcPublicKey _jwkToEcPublicKey(Map<String, dynamic> jwk) {
    final x = _base64UrlNoPadDecode(jwk['x'] as String);
    final y = _base64UrlNoPadDecode(jwk['y'] as String);

    return EcPublicKey(x: x, y: y, type: KeyPairType.p256);
  }

  /// Parse a full JWK (with 'd') into an EcKeyPairData.
  EcKeyPairData _jwkToKeyPairData(Map<String, dynamic> jwk) {
    final x = _base64UrlNoPadDecode(jwk['x'] as String);
    final y = _base64UrlNoPadDecode(jwk['y'] as String);
    final d = _base64UrlNoPadDecode(jwk['d'] as String);

    return EcKeyPairData(d: d, x: x, y: y, type: KeyPairType.p256);
  }

  /// Base64url encode without padding (JWK standard).
  String _base64UrlNoPad(Uint8List bytes) {
    return base64Url.encode(bytes).replaceAll('=', '');
  }

  /// Base64url decode without padding.
  Uint8List _base64UrlNoPadDecode(String input) {
    String padded = input;
    final remainder = padded.length % 4;
    if (remainder != 0) {
      padded = padded.padRight(padded.length + (4 - remainder), '=');
    }
    return base64Url.decode(padded);
  }
}
