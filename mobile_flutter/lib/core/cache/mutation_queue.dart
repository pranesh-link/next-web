import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:luvverse/core/cache/database.dart';

/// Manages offline mutation queue — stores pending writes for later sync.
class MutationQueueService {
  final CacheDatabase _db;

  MutationQueueService(this._db);

  /// Add a mutation to the queue.
  Future<void> enqueue({
    required String entityType,
    required String action,
    required Map<String, dynamic> payload,
  }) async {
    await _db.into(_db.mutationQueue).insert(
          MutationQueueCompanion.insert(
            entityType: entityType,
            action: action,
            payload: jsonEncode(payload),
            createdAt: DateTime.now().millisecondsSinceEpoch,
          ),
        );
  }

  /// Get all pending mutations in FIFO order.
  Future<List<MutationQueueData>> getPending() async {
    return (_db.select(_db.mutationQueue)
          ..orderBy([(t) => OrderingTerm.asc(t.id)]))
        .get();
  }

  /// Get count of pending mutations.
  Future<int> getPendingCount() async {
    final count = _db.mutationQueue.id.count();
    final query = _db.selectOnly(_db.mutationQueue)..addColumns([count]);
    final result = await query.getSingle();
    return result.read(count) ?? 0;
  }

  /// Mark a mutation as retried with an error message.
  Future<void> markRetried(int id, String error) async {
    final entry = await (_db.select(_db.mutationQueue)
          ..where((t) => t.id.equals(id)))
        .getSingle();
    await (_db.update(_db.mutationQueue)..where((t) => t.id.equals(id)))
        .write(MutationQueueCompanion(
      retries: Value(entry.retries + 1),
      lastError: Value(error),
    ));
  }

  /// Remove a mutation after successful sync.
  Future<void> remove(int id) async {
    await (_db.delete(_db.mutationQueue)..where((t) => t.id.equals(id))).go();
  }

  /// Remove all mutations that exceeded max retries.
  Future<List<MutationQueueData>> getFailedMutations({int maxRetries = 3}) async {
    return (_db.select(_db.mutationQueue)
          ..where((t) => t.retries.isBiggerOrEqualValue(maxRetries)))
        .get();
  }

  /// Clear all pending mutations.
  Future<void> clearAll() async {
    await _db.delete(_db.mutationQueue).go();
  }
}
