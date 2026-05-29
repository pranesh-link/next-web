import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:luvverse/core/prefetch/network_quality_service.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';

/// Automatically refreshes finance data when WiFi becomes available.
///
/// Listens to connectivity changes and triggers background prefetch
/// when transitioning from cellular/offline to WiFi connection.
class WiFiCacheWarmer {
  final WidgetRef _ref;
  ConnectivityType? _previousType;

  WiFiCacheWarmer(this._ref);

  /// Initialize the WiFi cache warmer.
  ///
  /// Sets up a listener for connectivity changes and triggers
  /// background prefetch when WiFi becomes available.
  void init() {
    // Listen to connectivity changes via Connectivity plugin
    Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> results) async {
      final currentType = await NetworkQualityService.getConnectionType();

      if (kDebugMode) {
        debugPrint('[WiFi] Connectivity changed: ${_previousType?.name} → ${currentType.name}');
      }

      // Detect transition from non-WiFi to WiFi
      if (_previousType != null &&
          _previousType != ConnectivityType.wifi &&
          currentType == ConnectivityType.wifi) {
        if (kDebugMode) {
          debugPrint('[WiFi] WiFi connected - triggering background prefetch');
        }
        _triggerBackgroundPrefetch();
      }

      _previousType = currentType;
    });

    // Initialize with current status
    NetworkQualityService.getConnectionType().then((type) {
      _previousType = type;
    });
  }

  /// Trigger background prefetch of medium-priority finance providers.
  ///
  /// Refreshes loans, goals, investments, and deposits in parallel.
  /// Uses eagerError: false to continue even if some providers fail.
  Future<void> _triggerBackgroundPrefetch() async {
    try {
      // Refresh medium priority providers in parallel
      await Future.wait(
        [
          _ref.read(loansProvider.notifier).refresh(),
          _ref.read(goalsProvider.notifier).refresh(),
          _ref.read(investmentsProvider.notifier).refresh(),
          _ref.read(depositsProvider.notifier).refresh(),
        ],
        eagerError: false,
      );

      if (kDebugMode) {
        debugPrint('[WiFi] Background prefetch completed');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[WiFi] Background prefetch error: $e');
      }
    }
  }
}
