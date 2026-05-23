import 'package:drift/drift.dart';

/// Cache entries table — stores JSON blobs with metadata.
class CacheEntries extends Table {
  TextColumn get key => text()();
  TextColumn get data => text()();
  IntColumn get cachedAt => integer()();
  IntColumn get ttlMs => integer()();
  IntColumn get schemaVersion => integer().withDefault(const Constant(1))();

  @override
  Set<Column> get primaryKey => {key};
}

/// Offline mutation queue — stores pending writes.
class MutationQueue extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get entityType => text()();
  TextColumn get action => text()();
  TextColumn get payload => text()();
  IntColumn get createdAt => integer()();
  IntColumn get retries => integer().withDefault(const Constant(0))();
  TextColumn get lastError => text().nullable()();
}
