import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

/// Types of network connectivity
enum ConnectivityType {
  /// WiFi connection
  wifi,

  /// Cellular/mobile data connection
  cellular,

  /// No network connection
  none,
}

/// Prefetch strategies based on network quality
enum PrefetchStrategy {
  /// Full prefetch - all phases (WiFi)
  full,

  /// Critical only - Phase 1 only (Cellular)
  critical,

  /// Offline mode - skip prefetch, use cache (No connection)
  offline,
}

/// Service for detecting network quality and determining prefetch strategies
class NetworkQualityService {
  /// Get the current connection type
  ///
  /// :return: The current connectivity type (WiFi, cellular, or none).
  static Future<ConnectivityType> getConnectionType() async {
    final List<ConnectivityResult> connectivityResults =
        await Connectivity().checkConnectivity();

    if (connectivityResults.isEmpty ||
        connectivityResults.contains(ConnectivityResult.none)) {
      debugPrint('[Network] Connection type: None');
      return ConnectivityType.none;
    }

    if (connectivityResults.contains(ConnectivityResult.wifi) ||
        connectivityResults.contains(ConnectivityResult.ethernet)) {
      debugPrint('[Network] Connection type: WiFi');
      return ConnectivityType.wifi;
    }

    if (connectivityResults.contains(ConnectivityResult.mobile)) {
      debugPrint('[Network] Connection type: Cellular');
      return ConnectivityType.cellular;
    }

    // Default to none if unknown
    debugPrint('[Network] Connection type: Unknown (defaulting to None)');
    return ConnectivityType.none;
  }

  /// Get the prefetch strategy based on current network quality
  ///
  /// :return: The recommended prefetch strategy based on connection type.
  static Future<PrefetchStrategy> getStrategy() async {
    final ConnectivityType connectionType = await getConnectionType();

    PrefetchStrategy strategy;
    switch (connectionType) {
      case ConnectivityType.wifi:
        strategy = PrefetchStrategy.full;
        debugPrint('[Network] Strategy: Full prefetch (WiFi detected)');
        break;
      case ConnectivityType.cellular:
        strategy = PrefetchStrategy.critical;
        debugPrint(
            '[Network] Strategy: Critical only (Cellular detected, Phase 1 only)');
        break;
      case ConnectivityType.none:
        strategy = PrefetchStrategy.offline;
        debugPrint('[Network] Strategy: Offline mode (No connection)');
        break;
    }

    return strategy;
  }
}
