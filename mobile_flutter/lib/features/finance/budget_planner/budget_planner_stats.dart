/// Helper class for budget planner statistics and delta calculations.
class StatsHelper {
  /// Returns a signed percentage delta string (e.g. '↑5%') or null if trivial.
  ///
  /// :param current: Current period value.
  /// :param previous: Previous period value (nullable).
  /// :return: Formatted delta string with arrow emoji, or null if change is zero or no previous value.
  static String? computeDelta(double current, double? previous) {
    if (previous == null || previous == 0) return null;
    final pct = ((current - previous) / previous * 100).round();
    if (pct == 0) return null;
    return pct > 0 ? '↑$pct%' : '↓${(-pct)}%';
  }
}
