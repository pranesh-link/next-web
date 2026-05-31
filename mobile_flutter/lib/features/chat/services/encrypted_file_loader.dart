import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';
import 'package:luvverse/features/chat/repositories/chat_repository.dart';
import 'package:luvverse/features/chat/services/chat_key_bootstrap.dart';

/// Downloads encrypted files from Firebase Storage, decrypts them locally.
/// Caches decrypted bytes in memory by path to avoid re-downloading.
class EncryptedFileLoader {
  EncryptedFileLoader(this._repo, this._bootstrap);

  final ChatRepository _repo;
  final ChatKeyBootstrap _bootstrap;
  final Dio _dio = Dio();

  final Map<String, Uint8List> _cache = {};
  final Map<String, Future<Uint8List?>> _inFlight = {};

  /// Load and decrypt a file. Returns cached bytes if already loaded.
  /// [path] is the Firebase Storage path (e.g. "chat/userId/uuid.jpg.enc").
  /// Returns null if decryption fails or file not found.
  Future<Uint8List?> load(String path) async {
    if (_cache.containsKey(path)) return _cache[path];

    // Coalesce concurrent requests for the same path
    if (_inFlight.containsKey(path)) return _inFlight[path];

    final future = _doLoad(path);
    _inFlight[path] = future;
    try {
      final result = await future;
      if (result != null) _cache[path] = result;
      return result;
    } finally {
      _inFlight.remove(path);
    }
  }

  Future<Uint8List?> _doLoad(String path) async {
    try {
      // Get a fresh signed URL
      final signedUrl = await _repo.getSignedUrl(path);
      if (signedUrl == null) return null;

      // Download the encrypted bytes
      final response = await _dio.get<List<int>>(
        signedUrl,
        options: Options(responseType: ResponseType.bytes),
      );
      if (response.statusCode != 200 || response.data == null) return null;

      // Decrypt
      final decrypted = await _bootstrap.crypto.decryptBytes(
        Uint8List.fromList(response.data!),
      );
      return decrypted;
    } catch (e) {
      debugPrint('[EncryptedFileLoader] load failed for $path: $e');
      return null;
    }
  }

  /// Clear the in-memory cache (e.g., on logout).
  void clearCache() {
    _cache.clear();
  }
}

final encryptedFileLoaderProvider = Provider<EncryptedFileLoader>((ref) {
  return EncryptedFileLoader(
    ref.read(chatRepositoryProvider),
    ref.read(chatKeyBootstrapProvider),
  );
});
