import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provides online/last-seen status for the partner based on typing signals.
class OnlineStatus {
  final bool isOnline;
  final DateTime? lastSeen;

  const OnlineStatus({this.isOnline = false, this.lastSeen});
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
