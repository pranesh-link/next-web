import 'package:drift/drift.dart';
import 'package:luvverse/core/cache/tables.dart';

part 'database.g.dart';

/// Drift database for offline cache and mutation queue.
@DriftDatabase(tables: [CacheEntries, MutationQueue])
class CacheDatabase extends _$CacheDatabase {
  CacheDatabase(super.e);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          // On future schema changes, add migration logic here.
          // For now, recreate all tables on upgrade.
          await m.deleteTable('cache_entries');
          await m.deleteTable('mutation_queue');
          await m.createAll();
        },
      );
}
