import 'package:battery_plus/battery_plus.dart';
import 'package:flutter/foundation.dart';

enum BatteryStrategy { full, critical, minimal }

class BatteryService {
  static const int lowBatteryThreshold = 20;
  static const int criticalBatteryThreshold = 10;

  /// Determines the appropriate prefetch strategy based on battery level and charging status.
  ///
  /// Strategy rules:
  /// - Charging → full
  /// - Battery >20% → full
  /// - Battery 10-20% → critical (Phase 1 only)
  /// - Battery <10% → minimal (skip prefetch)
  ///
  /// :return: The recommended battery strategy for prefetching.
  static Future<BatteryStrategy> getStrategy() async {
    try {
      final isChargingNow = await isCharging();
      final batteryLevel = await getBatteryLevel();

      if (kDebugMode) {
        print('[Battery] Level: $batteryLevel%, Charging: $isChargingNow');
      }

      // Charging → full strategy
      if (isChargingNow) {
        if (kDebugMode) {
          print('[Battery] Strategy: full (charging)');
        }
        return BatteryStrategy.full;
      }

      // Battery level based strategy
      if (batteryLevel > lowBatteryThreshold) {
        if (kDebugMode) {
          print('[Battery] Strategy: full (battery > $lowBatteryThreshold%)');
        }
        return BatteryStrategy.full;
      } else if (batteryLevel >= criticalBatteryThreshold) {
        if (kDebugMode) {
          print(
              '[Battery] Strategy: critical (battery $criticalBatteryThreshold-$lowBatteryThreshold%)');
        }
        return BatteryStrategy.critical;
      } else {
        if (kDebugMode) {
          print(
              '[Battery] Strategy: minimal (battery < $criticalBatteryThreshold%)');
        }
        return BatteryStrategy.minimal;
      }
    } catch (e) {
      if (kDebugMode) {
        print('[Battery] Error getting strategy: $e');
      }
      // Default to minimal on error to be conservative
      return BatteryStrategy.minimal;
    }
  }

  /// Returns the current battery level as a percentage (0-100).
  ///
  /// :return: Battery level percentage, or 0 on error.
  static Future<int> getBatteryLevel() async {
    try {
      final battery = Battery();
      final level = await battery.batteryLevel;
      return level;
    } catch (e) {
      if (kDebugMode) {
        print('[Battery] Error getting battery level: $e');
      }
      return 0;
    }
  }

  /// Checks if the device is currently charging.
  ///
  /// :return: True if charging or fully charged, false otherwise.
  static Future<bool> isCharging() async {
    try {
      final battery = Battery();
      final state = await battery.batteryState;
      return state == BatteryState.charging || state == BatteryState.full;
    } catch (e) {
      if (kDebugMode) {
        print('[Battery] Error getting charging status: $e');
      }
      return false;
    }
  }
}
