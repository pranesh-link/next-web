import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Android notification channel configuration for LuvVerse push notifications.
abstract final class NotificationChannel {
  static const id = 'luvverse_notifications';
  static const name = 'LuvVerse Notifications';
  static const description = 'Notifications for finance alerts, reminders, and couple updates';

  /// Creates the Android notification channel (idempotent).
  static Future<void> create(FlutterLocalNotificationsPlugin plugin) async {
    const channel = AndroidNotificationChannel(
      id,
      name,
      description: description,
      importance: Importance.high,
    );

    await plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }
}
