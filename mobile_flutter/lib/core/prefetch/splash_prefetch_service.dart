import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/prefetch/network_quality_service.dart';
import 'package:luvverse/core/prefetch/battery_service.dart';
import 'package:luvverse/core/prefetch/prefetch_progress_provider.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/features/finance/repositories/couple_repository.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/models/couple.dart';

/// Local couple provider for prefetch
final _coupleRepoProvider = Provider<CoupleRepository>((ref) {
  return CoupleRepository(ref.read(apiClientProvider));
});

final _coupleProvider = FutureProvider<Couple?>((ref) async {
  return ref.read(_coupleRepoProvider).getCouple();
});

/// Result of a prefetch operation containing success and failure information.
class PrefetchResult {
  /// Map of successfully fetched items and their fetch durations.
  final Map<String, Duration> success = {};

  /// Map of failed items and their error details.
  final Map<String, dynamic> failures = {};

  /// Whether critical data (accounts) was successfully fetched.
  bool get hasCriticalData => success.containsKey('accounts');

  /// Human-readable summary of the prefetch operation.
  String get summary => '${success.length} fetched, ${failures.length} failed';

  /// Total duration of all successful fetches combined.
  Duration get totalDuration {
    if (success.isEmpty) return Duration.zero;
    return success.values.fold(Duration.zero, (sum, duration) => sum + duration);
  }

  /// Whether all critical items were fetched successfully.
  bool get allCriticalSuccessful {
    return success.containsKey('accounts') &&
        success.containsKey('couple') &&
        success.containsKey('balance');
  }

  /// Logging helper to print detailed results.
  void logResults() {
    if (kDebugMode) {
      print('📊 Prefetch Results:');
      print('  ✅ Success: ${success.length} items in ${totalDuration.inMilliseconds}ms');
      for (final entry in success.entries) {
        print('    - ${entry.key}: ${entry.value.inMilliseconds}ms');
      }
      if (failures.isNotEmpty) {
        print('  ❌ Failures: ${failures.length} items');
        for (final entry in failures.entries) {
          print('    - ${entry.key}: ${entry.value}');
        }
      }
    }
  }
}

/// Main orchestrator for splash screen data prefetching.
///
/// Handles two-phase prefetching strategy:
/// - Phase 1: Critical data (always fetched)
/// - Phase 2: High priority data (conditionally fetched based on network/battery)
class SplashPrefetchService {
  final WidgetRef _ref;

  /// Creates a new prefetch service with the given Riverpod ref.
  SplashPrefetchService(this._ref);

  /// Prefetches all data according to the two-phase strategy.
  ///
  /// Returns a [PrefetchResult] containing success/failure information.
  Future<PrefetchResult> prefetchAll() async {
    if (kDebugMode) {
      print('🚀 Starting splash screen prefetch...');
    }

    final result = PrefetchResult();
    final startTime = DateTime.now();

    // Get network and battery strategies
    final networkStrategy = await NetworkQualityService.getStrategy();
    final batteryStrategyRaw = await BatteryService.getStrategy();
    
    // Convert BatteryStrategy to PrefetchStrategy
    final batteryStrategy = (batteryStrategyRaw == BatteryStrategy.minimal || 
        batteryStrategyRaw == BatteryStrategy.critical) 
        ? PrefetchStrategy.offline 
        : PrefetchStrategy.full;

    if (kDebugMode) {
      print('📡 Network strategy: ${networkStrategy.name}');
      print('🔋 Battery strategy: ${batteryStrategy.name}');
    }

    // Phase 1: Critical data (always fetch)
    if (kDebugMode) {
      print('⚡ Phase 1: Fetching critical data...');
    }
    await _fetchPhase1(result);

    // Phase 2: High priority data (conditional)
    final shouldFetchPhase2 = _shouldFetchPhase2(networkStrategy, batteryStrategy);
    if (shouldFetchPhase2) {
      if (kDebugMode) {
        print('📦 Phase 2: Fetching high priority data...');
      }
      await _fetchPhase2(result);
    } else {
      if (kDebugMode) {
        print('⏩ Phase 2: Skipped (cellular or low battery)');
      }
    }

    final totalTime = DateTime.now().difference(startTime);
    if (kDebugMode) {
      print('✨ Prefetch completed in ${totalTime.inMilliseconds}ms');
      result.logResults();
    }

    // Reset progress provider
    final totalItems = result.success.length + result.failures.length;
    _ref.read(prefetchProgressProvider.notifier).reset(totalItems);

    return result;
  }

  /// Fetches critical data (Phase 1) with 2-second timeout.
  Future<void> _fetchPhase1(PrefetchResult result) async {
    final criticalItems = [
      _PrefetchItem(
        key: 'accounts',
        fetcher: () => _ref.read(accountsProvider.future),
        timeout: Duration(seconds: 2),
      ),
      _PrefetchItem(
        key: 'couple',
        fetcher: () => _ref.read(_coupleProvider.future),
        timeout: Duration(seconds: 2),
      ),
      _PrefetchItem(
        key: 'balance',
        fetcher: () async {
          final asyncValue = _ref.read(totalBalanceProvider);
          return asyncValue.when(
            data: (value) => value,
            loading: () => throw Exception('Balance still loading'),
            error: (err, stack) => throw err,
          );
        },
        timeout: Duration(seconds: 2),
      ),
    ];

    // Update total items for progress tracking
    _ref.read(prefetchProgressProvider.notifier).reset(criticalItems.length);

    // Fetch all critical items concurrently
    await Future.wait(
      criticalItems.map((item) => _fetchWithProgress(item, result)),
    );
  }

  /// Fetches high priority data (Phase 2) with 1-second timeout.
  Future<void> _fetchPhase2(PrefetchResult result) async {
    final highPriorityItems = [
      _PrefetchItem(
        key: 'transactions',
        fetcher: () => _ref.read(transactionsProvider.future),
        timeout: Duration(seconds: 1),
      ),
      _PrefetchItem(
        key: 'budgets',
        fetcher: () => _ref.read(budgetsProvider.future),
        timeout: Duration(seconds: 1),
      ),
      _PrefetchItem(
        key: 'notifications',
        fetcher: () => _ref.read(notificationsProvider.future),
        timeout: Duration(seconds: 1),
      ),
      _PrefetchItem(
        key: 'healthScore',
        fetcher: () => _ref.read(healthScoreProvider.future),
        timeout: Duration(seconds: 1),
      ),
    ];

    // Update total items for progress tracking
    final currentCompleted = _ref.read(prefetchProgressProvider).completedItems;
    _ref.read(prefetchProgressProvider.notifier).reset(
          currentCompleted + highPriorityItems.length,
        );

    // Fetch all high priority items concurrently
    await Future.wait(
      highPriorityItems.map((item) => _fetchWithProgress(item, result)),
    );
  }

  /// Fetches a single item with progress updates.
  Future<void> _fetchWithProgress(
    _PrefetchItem item,
    PrefetchResult result,
  ) async {
    await _fetch(
      item.key,
      item.fetcher,
      result,
      timeout: item.timeout,
    );
    _ref.read(prefetchProgressProvider.notifier).incrementItem(item.key);
  }

  /// Fetches a single data item with retry logic and timeout.
  ///
  /// Retries up to 3 times with exponential backoff (500ms * attempt).
  Future<void> _fetch(
    String key,
    Future<dynamic> Function() fetcher,
    PrefetchResult result, {
    required Duration timeout,
  }) async {
    int attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        if (kDebugMode && attempt > 0) {
          print('🔄 Retrying $key (attempt ${attempt + 1}/$maxAttempts)');
        }

        final start = DateTime.now();
        await fetcher().timeout(timeout);
        final duration = DateTime.now().difference(start);

        result.success[key] = duration;

        if (kDebugMode) {
          print('✅ $key fetched in ${duration.inMilliseconds}ms');
        }
        return;
      } catch (e) {
        attempt++;
        if (attempt >= maxAttempts) {
          result.failures[key] = e;
          if (kDebugMode) {
            print('❌ $key failed after $maxAttempts attempts: $e');
          }
        } else {
          final delayMs = 500 * attempt;
          if (kDebugMode) {
            print('⏳ $key failed (attempt $attempt), retrying in ${delayMs}ms...');
          }
          await Future.delayed(Duration(milliseconds: delayMs));
        }
      }
    }
  }

  /// Determines if Phase 2 should be fetched based on network and battery conditions.
  bool _shouldFetchPhase2(
    PrefetchStrategy networkStrategy,
    PrefetchStrategy batteryStrategy,
  ) {
    // Skip Phase 2 if on cellular or low battery
    return networkStrategy == PrefetchStrategy.full &&
        batteryStrategy == PrefetchStrategy.full;
  }
}

/// Internal helper class for prefetch item configuration.
class _PrefetchItem {
  final String key;
  final Future<dynamic> Function() fetcher;
  final Duration timeout;

  const _PrefetchItem({
    required this.key,
    required this.fetcher,
    required this.timeout,
  });
}
