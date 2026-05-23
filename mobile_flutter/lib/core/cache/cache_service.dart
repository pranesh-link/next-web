import 'package:drift/drift.dart';
import 'package:luvverse/core/cache/cache_config.dart';
import 'package:luvverse/core/cache/database.dart';

/// High-level cache service for reading/writing cached data.
class CacheService {
  final CacheDatabase _db;

  CacheService(this._db);

  /// Get cached data for a key. Returns null if missing or expired.
  Future<String?> get(String key) async {
    try {
      final entry = await (_db.select(_db.cacheEntries)
            ..where((t) => t.key.equals(key)))
          .getSingleOrNull();

      if (entry == null) return null;

      // Check schema version
      if (entry.schemaVersion < CacheConfig.schemaVersion) {
        await delete(key);
        return null;
      }

      // Check TTL
      final age = DateTime.now().millisecondsSinceEpoch - entry.cachedAt;
      if (age > entry.ttlMs) return null;

      return entry.data;
    } catch (_) {
      return null;
    }
  }

  /// Get cached data even if stale (for fallback scenarios).
  Future<String?> getStale(String key) async {
    try {
      final entry = await (_db.select(_db.cacheEntries)
            ..where((t) => t.key.equals(key)))
          .getSingleOrNull();

      if (entry == null) return null;
      if (entry.schemaVersion < CacheConfig.schemaVersion) return null;

      return entry.data;
    } catch (_) {
      return null;
    }
  }

  /// Check if a cache entry is stale (expired TTL but still present).
  Future<bool> isStale(String key) async {
    try {
      final entry = await (_db.select(_db.cacheEntries)
            ..where((t) => t.key.equals(key)))
          .getSingleOrNull();

      if (entry == null) return true;

      final age = DateTime.now().millisecondsSinceEpoch - entry.cachedAt;
      return age > entry.ttlMs;
    } catch (_) {
      return true;
    }
  }

  /// Get the timestamp of when data was last cached.
  Future<DateTime?> getCachedAt(String key) async {
    try {
      final entry = await (_db.select(_db.cacheEntries)
            ..where((t) => t.key.equals(key)))
          .getSingleOrNull();

      if (entry == null) return null;
      return DateTime.fromMillisecondsSinceEpoch(entry.cachedAt);
    } catch (_) {
      return null;
    }
  }

  /// Store data in cache with appropriate TTL.
  Future<void> put(String key, String data) async {
    final ttl = CacheConfig.getTtl(key);
    try {
      await _db.into(_db.cacheEntries).insertOnConflictUpdate(
            CacheEntriesCompanion.insert(
              key: key,
              data: data,
              cachedAt: DateTime.now().millisecondsSinceEpoch,
              ttlMs: ttl.inMilliseconds,
              schemaVersion: Value(CacheConfig.schemaVersion),
            ),
          );
    } catch (_) {
      // Silently fail — cache is best-effort
    }
  }

  /// Delete a specific cache entry.
  Future<void> delete(String key) async {
    try {
      await (_db.delete(_db.cacheEntries)
            ..where((t) => t.key.equals(key)))
          .go();
    } catch (_) {}
  }

  /// Invalidate all entries for an entity type (e.g. "accounts").
  Future<void> invalidateEntity(String entityType) async {
    try {
      await (_db.delete(_db.cacheEntries)
            ..where((t) => t.key.like('$entityType%')))
          .go();
    } catch (_) {}
  }

  /// Clear all cache entries.
  Future<void> clearAll() async {
    try {
      await _db.delete(_db.cacheEntries).go();
      await _db.delete(_db.mutationQueue).go();
    } catch (_) {}
  }

  /// Prune expired entries and entries older than max retention.
  Future<void> prune() async {
    try {
      final now = DateTime.now().millisecondsSinceEpoch;
      final maxAge =
          now - CacheConfig.maxRetention.inMilliseconds;

      // Delete expired entries
      await (_db.delete(_db.cacheEntries)
            ..where((t) => t.cachedAt.isSmallerThanValue(maxAge)))
          .go();
    } catch (_) {}
  }
}
