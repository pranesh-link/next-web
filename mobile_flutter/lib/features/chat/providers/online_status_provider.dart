import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

/// Provides online/last-seen status for the partner based on typing signals.
class OnlineStatus {
  final bool isOnline;
  final DateTime? lastSeen;

  const OnlineStatus({this.isOnline = false, this.lastSeen});

  /// Human-readable last-seen string (iMessage style):
  ///   - Same day  → "3:45 PM"
  ///   - This week → "Mon 3:45 PM"
  ///   - Older     → "Jun 5"
  String get formattedLastSeen {
    if (lastSeen == null) return '';
    final local = lastSeen!.toLocal();
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final msgDay = DateTime(local.year, local.month, local.day);
    final daysDiff = today.difference(msgDay).inDays;

    if (daysDiff == 0) return DateFormat('h:mm a').format(local);
    if (daysDiff < 7) return DateFormat('EEE h:mm a').format(local);
    return DateFormat('MMM d').format(local);
  }
}

/// Tracks partner's last activity time.
final partnerLastActivityProvider = StateProvider<DateTime?>((ref) => null);

/// Derives online status from last activity timestamp.
/// Online = activity within last 30 seconds.
final onlineStatusProvider = Provider<OnlineStatus>((ref) {
  final lastActivity = ref.watch(partnerLastActivityProvider);
  if (lastActivity == null) return const OnlineStatus();

  final diff = DateTime.now().difference(lastActivity);
  if (diff.inSeconds <= 30) {
    return const OnlineStatus(isOnline: true);
  }
  return OnlineStatus(isOnline: false, lastSeen: lastActivity);
});
