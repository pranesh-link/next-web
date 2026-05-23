/// Cache TTL configuration and constants for offline caching.
class CacheConfig {
  CacheConfig._();

  /// Current schema version — bump to invalidate all cached data.
  static const int schemaVersion = 1;

  /// Maximum cache storage size in bytes (50MB).
  static const int maxStorageBytes = 50 * 1024 * 1024;

  /// Maximum age for pruning old entries (180 days).
  static const Duration maxRetention = Duration(days: 180);

  /// TTL per entity type.
  static const Map<String, Duration> ttl = {
    'accounts': Duration(minutes: 5),
    'transactions': Duration(minutes: 15),
    'budgets': Duration(minutes: 15),
    'budget_plans': Duration(minutes: 30),
    'loans': Duration(hours: 1),
    'goals': Duration(hours: 1),
    'deposits': Duration(hours: 1),
    'investments': Duration(hours: 1),
    'insights': Duration(minutes: 30),
    'health_score': Duration(minutes: 30),
    'notifications': Duration(minutes: 5),
    'couple': Duration(hours: 1),
    'net_worth': Duration(minutes: 30),
  };

  /// Get TTL for a cache key (extracts entity prefix).
  static Duration getTtl(String key) {
    final entity = key.split(':').first;
    return ttl[entity] ?? const Duration(minutes: 15);
  }
}
