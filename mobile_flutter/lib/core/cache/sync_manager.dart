import 'dart:async';
import 'dart:convert';
import 'package:luvverse/core/cache/cache_service.dart';
import 'package:luvverse/core/cache/mutation_queue.dart';
import 'package:luvverse/core/network/api_client.dart';

/// Manages cache synchronization with the server.
class SyncManager {
  final ApiClient _client;
  final CacheService _cache;
  final MutationQueueService _mutationQueue;
  Timer? _pollTimer;

  SyncManager(this._client, this._cache, this._mutationQueue);

  /// Start periodic polling for couple data freshness (every 2 min).
  void startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(
      const Duration(minutes: 2),
      (_) => checkSyncStatus(),
    );
  }

  /// Stop polling.
  void stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
  }

  /// Check server for latest modification times and invalidate stale cache.
  Future<void> checkSyncStatus() async {
    try {
      final response = await _client.get<Map<String, dynamic>>(
        '/api/v1/finance/sync-status',
      );

      final timestamps = response;
      for (final entry in timestamps.entries) {
        final entity = entry.key;
        final serverModifiedAt = entry.value as int;

        final cachedAt = await _cache.getCachedAt(entity);
        if (cachedAt == null) continue;

        if (serverModifiedAt > cachedAt.millisecondsSinceEpoch) {
          await _cache.invalidateEntity(entity);
        }
      }
    } catch (_) {
      // Polling failure is non-critical
    }
  }

  /// Replay pending mutations on reconnect.
  Future<SyncResult> replayMutations() async {
    final pending = await _mutationQueue.getPending();
    var succeeded = 0;
    var failed = 0;

    for (final mutation in pending) {
      if (mutation.retries >= 3) {
        failed++;
        continue;
      }

      try {
        final payload = jsonDecode(mutation.payload) as Map<String, dynamic>;
        await _executeMutation(
          mutation.entityType,
          mutation.action,
          payload,
        );
        await _mutationQueue.remove(mutation.id);
        succeeded++;
      } catch (e) {
        await _mutationQueue.markRetried(mutation.id, e.toString());
        failed++;
      }
    }

    return SyncResult(succeeded: succeeded, failed: failed);
  }

  Future<void> _executeMutation(
    String entityType,
    String action,
    Map<String, dynamic> payload,
  ) async {
    final path = '/api/v1/finance/$entityType';

    switch (action) {
      case 'create':
        await _client.post<Map<String, dynamic>>(path, data: payload);
        break;
      case 'update':
        final id = payload.remove('id');
        await _client.put<Map<String, dynamic>>('$path/$id', data: payload);
        break;
      case 'delete':
        final id = payload['id'];
        await _client.delete('$path/$id');
        break;
    }

    // Invalidate cache for this entity after successful mutation
    await _cache.invalidateEntity(entityType);
  }

  /// Dispose resources.
  void dispose() {
    stopPolling();
  }
}

/// Result of a mutation replay operation.
class SyncResult {
  final int succeeded;
  final int failed;

  const SyncResult({required this.succeeded, required this.failed});

  bool get hasFailures => failed > 0;
  int get total => succeeded + failed;
}
