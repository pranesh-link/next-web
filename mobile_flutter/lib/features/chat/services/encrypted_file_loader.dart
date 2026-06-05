import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';
import 'package:luvverse/features/chat/repositories/chat_repository.dart';

/// Downloads files from Firebase Storage and returns raw bytes.
/// In-flight message encryption has been decommissioned; files are stored and
/// served as plain bytes. The class name is kept for backwards compatibility
/// with existing widgets (EncryptedImageBubble, EncryptedVoiceBubble).
/// Legacy encrypted files from before decommission will fail to decode —
/// those bubble widgets display an error placeholder in that case.
class EncryptedFileLoader {
  EncryptedFileLoader(this._repo);

  final ChatRepository _repo;
  final Dio _dio = Dio();

  final Map<String, Uint8List> _cache = {};
  final Map<String, Future<Uint8List?>> _inFlight = {};

  /// Load a file. Returns cached bytes if already loaded.
  /// [path] is the Firebase Storage path (e.g. "chat/userId/uuid.jpg").
  /// Returns null if the file is not found or download fails.
  Future<Uint8List?> load(String path) async {
    if (_cache.containsKey(path)) return _cache[path];
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
      final signedUrl = await _repo.getSignedUrl(path);
      if (signedUrl == null) return null;

      final response = await _dio.get<List<int>>(
        signedUrl,
        options: Options(responseType: ResponseType.bytes),
      );
      if (response.statusCode != 200 || response.data == null) return null;
      return Uint8List.fromList(response.data!);
    } catch (e) {
      debugPrint('[FileLoader] load failed for $path: $e');
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
  );
});
