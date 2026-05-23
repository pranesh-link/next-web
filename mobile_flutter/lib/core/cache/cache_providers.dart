import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/cache/cache_service.dart';
import 'package:luvverse/core/cache/database.dart';
import 'package:luvverse/core/cache/mutation_queue.dart';
import 'package:luvverse/core/cache/sync_manager.dart';
import 'package:luvverse/core/network/api_client.dart';

/// The drift database instance (initialized in main.dart).
final cacheDatabaseProvider = Provider<CacheDatabase>((ref) {
  throw UnimplementedError('Must be overridden in ProviderScope');
});

/// Cache service for reading/writing cached data.
final cacheServiceProvider = Provider<CacheService>((ref) {
  return CacheService(ref.read(cacheDatabaseProvider));
});

/// Mutation queue for offline writes.
final mutationQueueProvider = Provider<MutationQueueService>((ref) {
  return MutationQueueService(ref.read(cacheDatabaseProvider));
});

/// Sync manager for couple invalidation and mutation replay.
final syncManagerProvider = Provider<SyncManager>((ref) {
  final client = ref.read(apiClientProvider);
  final cache = ref.read(cacheServiceProvider);
  final queue = ref.read(mutationQueueProvider);
  return SyncManager(client, cache, queue);
});

/// Count of pending mutations in the queue.
final pendingMutationCountProvider = FutureProvider<int>((ref) {
  return ref.read(mutationQueueProvider).getPendingCount();
});
