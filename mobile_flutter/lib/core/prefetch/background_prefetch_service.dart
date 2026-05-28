import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';

/// Service for silent background data fetching after home screen loads.
/// 
/// Prefetches medium-priority data (loans, goals, investments, deposits)
/// after a short delay to avoid blocking initial UI rendering.
class BackgroundPrefetchService {
  final WidgetRef _ref;

  BackgroundPrefetchService(this._ref);

  /// Prefetch medium-priority data with a 1-second delay.
  /// 
  /// Fetches loans, goals, investments, and deposits in parallel
  /// with graceful error handling for each operation.
  Future<void> prefetchMediumPriority() async {
    // Wait to avoid interfering with initial render
    await Future.delayed(const Duration(seconds: 1));

    debugPrint('[Background] Starting medium priority prefetch...');

    await Future.wait([
      _safeFetch('loans', () => _ref.read(loansProvider.future)),
      _safeFetch('goals', () => _ref.read(goalsProvider.future)),
      _safeFetch('investments', () => _ref.read(investmentsProvider.future)),
      _safeFetch('deposits', () => _ref.read(depositsProvider.future)),
    ]);

    debugPrint('[Background] Medium priority prefetch complete');
  }

  /// Safely fetch data with error handling and logging.
  /// 
  /// Catches any errors during fetch and logs them without throwing,
  /// allowing other prefetch operations to continue.
  Future<void> _safeFetch(String key, Future<dynamic> Function() fetcher) async {
    try {
      await fetcher();
      debugPrint('[Background] ✓ $key fetched');
    } catch (e) {
      debugPrint('[Background] ✗ $key failed: $e');
    }
  }
}
