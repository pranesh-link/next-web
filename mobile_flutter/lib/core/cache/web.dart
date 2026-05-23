import 'package:drift/wasm.dart';
import 'package:luvverse/core/cache/database.dart';

/// Open drift database on web using sql.js (IndexedDB-backed).
Future<CacheDatabase> openCacheDatabase() async {
  final result = await WasmDatabase.open(
    databaseName: 'luvverse_cache',
    sqlite3Uri: Uri.parse('sqlite3.wasm'),
    driftWorkerUri: Uri.parse('drift_worker.js'),
  );

  return CacheDatabase(result.resolvedExecutor);
}
