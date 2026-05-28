import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Manages app lifecycle state tracking for background/foreground transitions.
///
/// Tracks when the app goes to background and determines if the app has been
/// inactive long enough to require a splash screen refresh on resume.
class AppLifecycleManager {
  /// Key for storing the last background timestamp in SharedPreferences.
  static const String _backgroundTimeKey = 'last_background_timestamp';

  /// Duration threshold after which the app is considered stale.
  ///
  /// If the app has been in the background for this duration or longer,
  /// [shouldShowSplash] will return true.
  static const Duration staleThreshold = Duration(minutes: 90);

  /// Records the current time as the last background timestamp.
  ///
  /// This should be called when the app transitions to the background state.
  /// Persists the timestamp in SharedPreferences for later retrieval.
  static Future<void> recordBackgroundTime() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      await prefs.setInt(_backgroundTimeKey, timestamp);
      debugPrint('[Lifecycle] Recorded background time: $timestamp');
    } catch (e) {
      debugPrint('[Lifecycle] Error recording background time: $e');
    }
  }

  /// Determines if the app should show the splash screen based on stale detection.
  ///
  /// Returns `true` if the elapsed time since the app went to background is
  /// greater than or equal to [staleThreshold] (90 minutes).
  ///
  /// Returns `false` if:
  /// - No timestamp is recorded (first launch)
  /// - Elapsed time is less than the stale threshold
  ///
  /// Logs the elapsed time in minutes and the stale detection result.
  static Future<bool> shouldShowSplash() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final timestamp = prefs.getInt(_backgroundTimeKey);

      if (timestamp == null) {
        debugPrint('[Lifecycle] No background timestamp recorded (first launch)');
        return false;
      }

      final backgroundTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      final elapsed = DateTime.now().difference(backgroundTime);
      final elapsedMinutes = elapsed.inMinutes;
      final isStale = elapsed >= staleThreshold;

      debugPrint('[Lifecycle] Time since background: $elapsedMinutes minutes, isStale: $isStale');

      return isStale;
    } catch (e) {
      debugPrint('[Lifecycle] Error checking stale status: $e');
      return false;
    }
  }

  /// Gets the duration since the app last went to background.
  ///
  /// Returns `null` if no background timestamp has been recorded (first launch).
  /// Otherwise returns the [Duration] between the recorded timestamp and now.
  static Future<Duration?> getTimeSinceBackground() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final timestamp = prefs.getInt(_backgroundTimeKey);

      if (timestamp == null) {
        return null;
      }

      final backgroundTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      return DateTime.now().difference(backgroundTime);
    } catch (e) {
      debugPrint('[Lifecycle] Error getting time since background: $e');
      return null;
    }
  }

  /// Clears the stored background timestamp.
  ///
  /// This can be used to reset the lifecycle state, typically after
  /// successfully showing the splash screen or on app initialization.
  static Future<void> clearBackgroundTime() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_backgroundTimeKey);
      debugPrint('[Lifecycle] Cleared background time');
    } catch (e) {
      debugPrint('[Lifecycle] Error clearing background time: $e');
    }
  }
}
