import 'dart:convert';
import 'package:luvverse/core/cache/cache_service.dart';
import 'package:luvverse/core/network/api_exceptions.dart';

/// Mixin that adds cache-aware fetching to repositories.
mixin CacheMixin {
  CacheService get cache;

  /// Fetch with cache: try API first, cache result, fallback to cache on error.
  Future<T> fetchWithCache<T>({
    required String cacheKey,
    required Future<T> Function() apiFetch,
    required String Function(T data) serialize,
    required T Function(String cached) deserialize,
    T? defaultValue,
  }) async {
    try {
      final data = await apiFetch();
      // Write-through to cache — but never cache empty/default responses
      // to prevent stale empty data from persisting after a server outage.
      final serialized = serialize(data);
      if (data != defaultValue && serialized != serialize(defaultValue as T)) {
        await cache.put(cacheKey, serialized);
      }
      return data;
    } on NetworkException {
      // Network error — fallback to cache
      return _fallbackToCache(cacheKey, deserialize, defaultValue: defaultValue);
    } catch (e) {
      // For non-network errors (401, 422), try stale cache
      if (e is UnauthorizedException) rethrow;
      final cached = await cache.getStale(cacheKey);
      if (cached != null) return deserialize(cached);
      if (defaultValue is T) return defaultValue;
      rethrow;
    }
  }

  /// Fetch nullable with cache (for optional data like couple, budget plan).
  Future<T?> fetchNullableWithCache<T>({
    required String cacheKey,
    required Future<T?> Function() apiFetch,
    required String Function(T data) serialize,
    required T Function(String cached) deserialize,
  }) async {
    try {
      final data = await apiFetch();
      if (data != null) {
        await cache.put(cacheKey, serialize(data));
      } else {
        // Cache null as empty to distinguish from "no cache"
        await cache.put(cacheKey, '{"__null":true}');
      }
      return data;
    } on NetworkException {
      final cached = await cache.getStale(cacheKey);
      if (cached == null) return null;
      if (cached == '{"__null":true}') return null;
      return deserialize(cached);
    } catch (e) {
      if (e is UnauthorizedException) rethrow;
      final cached = await cache.getStale(cacheKey);
      if (cached == null || cached == '{"__null":true}') return null;
      return deserialize(cached);
    }
  }

  Future<T> _fallbackToCache<T>(
    String cacheKey,
    T Function(String cached) deserialize, {
    T? defaultValue,
  }) async {
    // Try fresh cache first, then stale
    final cached = await cache.get(cacheKey) ?? await cache.getStale(cacheKey);
    if (cached != null) return deserialize(cached);
    // Return default value (e.g. empty list) instead of crashing with an error.
    if (defaultValue is T) return defaultValue;
    throw const NetworkException('No internet connection. No cached data available.');
  }

  /// Helper to serialize a list of models to JSON.
  String serializeList(List<dynamic> items) {
    return jsonEncode(items.map((e) => e.toJson()).toList());
  }
}
