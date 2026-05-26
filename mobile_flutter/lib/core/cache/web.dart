import 'dart:async';

import 'package:drift/wasm.dart';
import 'package:flutter/foundation.dart';
import 'package:luvverse/core/cache/database.dart';
import 'package:sqlite3/wasm.dart';

/// Open drift database on web using WASM (IndexedDB-backed).
/// Falls back to in-memory database if worker setup fails or times out.
Future<CacheDatabase> openCacheDatabase() async {
  try {
    final result = await WasmDatabase.open(
      databaseName: 'luvverse_cache',
      sqlite3Uri: Uri.parse('sqlite3.wasm'),
      driftWorkerUri: Uri.parse('drift_worker.js'),
    ).timeout(const Duration(seconds: 5));
    return CacheDatabase(result.resolvedExecutor);
  } catch (e) {
    debugPrint('WasmDatabase.open failed ($e), trying in-memory fallback...');
    try {
      final sqlite3 = await WasmSqlite3.loadFromUrl(
        Uri.parse('sqlite3.wasm'),
      ).timeout(const Duration(seconds: 5));
      sqlite3.registerVirtualFileSystem(
        InMemoryFileSystem(),
        makeDefault: true,
      );
      return CacheDatabase(WasmDatabase.inMemory(sqlite3));
    } catch (e2) {
      debugPrint('In-memory fallback also failed: $e2');
      rethrow;
    }
  }
}
