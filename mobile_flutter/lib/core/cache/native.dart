import 'dart:io';
import 'package:drift/native.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlite3/open.dart';
import 'package:sqlcipher_flutter_libs/sqlcipher_flutter_libs.dart';
import 'package:luvverse/core/cache/database.dart';

const _encryptionKeyName = 'cache_db_encryption_key';

/// Open encrypted drift database on native platforms (iOS/Android).
///
/// If [fallbackToMemory] is true, returns an in-memory database (used when
/// the encrypted DB fails to initialize).
Future<CacheDatabase> openCacheDatabase({bool fallbackToMemory = false}) async {
  if (fallbackToMemory) {
    debugPrint('[CacheDB] Using in-memory fallback');
    return CacheDatabase(NativeDatabase.memory());
  }

  try {
    // Ensure sqlcipher is loaded
    open.overrideFor(OperatingSystem.android, openCipherOnAndroid);

    final dir = await getApplicationDocumentsDirectory();
    final dbFile = File(p.join(dir.path, 'cache.db'));

    // Get or generate encryption key
    const storage = FlutterSecureStorage();
    var key = await storage.read(key: _encryptionKeyName);
    if (key == null) {
      // Generate a 32-char hex key
      key = List.generate(32, (_) => 'abcdef0123456789'[
          DateTime.now().microsecondsSinceEpoch % 16]).join();
      await storage.write(key: _encryptionKeyName, value: key);
    }

    final queryExecutor = NativeDatabase.createInBackground(
      dbFile,
      isolateSetup: () async {
        // Re-apply sqlcipher override inside the background isolate
        // (overrides are per-isolate; without this, the background
        // isolate fails with "libsqlite3.so not found" on Android).
        if (Platform.isAndroid) {
          open.overrideFor(OperatingSystem.android, openCipherOnAndroid);
        }
      },
      setup: (db) {
        db.execute("PRAGMA key = '$key'");
      },
    );

    return CacheDatabase(queryExecutor);
  } catch (e) {
    debugPrint('[CacheDB] Encrypted DB failed: $e — falling back to memory');
    return CacheDatabase(NativeDatabase.memory());
  }
}
