import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

const _kLastReminderKey = 'pushPermissionReminderTs';

/// Shows a non-intrusive banner at most once every 3 days when the user
/// has denied push notification permission. The banner:
/// - On Android: requests the permission directly via FirebaseMessaging if
///   not-yet-determined, otherwise opens the system Notification Settings
///   screen for the app via the ACTION_APP_NOTIFICATION_SETTINGS intent.
/// - On iOS: deep-links to the app notification settings.
class NotificationPermissionReminder extends StatefulWidget {
  const NotificationPermissionReminder({super.key});

  @override
  State<NotificationPermissionReminder> createState() =>
      _NotificationPermissionReminderState();
}

class _NotificationPermissionReminderState
    extends State<NotificationPermissionReminder> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    _checkShouldShow();
  }

  Future<void> _checkShouldShow() async {
    final prefs = await SharedPreferences.getInstance();
    final lastTs = prefs.getInt(_kLastReminderKey);
    final now = DateTime.now().millisecondsSinceEpoch;
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    if (lastTs != null && (now - lastTs) < threeDaysMs) return;
    if (mounted) setState(() => _visible = true);
  }

  Future<void> _dismiss() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_kLastReminderKey, DateTime.now().millisecondsSinceEpoch);
    if (mounted) setState(() => _visible = false);
  }

  @override
  Widget build(BuildContext context) {
    if (!_visible) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.lg),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: context.colors.accent.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.accent.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Icon(Icons.notifications_off_outlined,
              size: 18, color: context.colors.accent),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              'Enable notifications to stay updated',
              style: AppTypography.small.copyWith(color: context.colors.text),
            ),
          ),
          TextButton(
            onPressed: () {
              _handleEnable();
            },
            style: TextButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md, vertical: 0),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: Text('Enable',
                style: AppTypography.small.copyWith(
                    color: context.colors.accent,
                    fontWeight: FontWeight.w700)),
          ),
          GestureDetector(
            onTap: _dismiss,
            child: Icon(Icons.close, size: 16, color: context.colors.textMuted),
          ),
        ],
      ),
    );
  }

  Future<void> _openSettings() async {
    if (Platform.isAndroid) {
      // Try the Android notification-settings intent first.
      // This opens directly to the notification toggle for this app.
      const channel = MethodChannel('luvverse/notifications');
      try {
        await channel.invokeMethod('openNotificationSettings');
        return;
      } catch (_) {
        // Platform channel not registered — fall through to URL fallback.
      }
      // Fallback: deep-link via intent URI understood by most Android versions.
      try {
        final opened = await launchUrl(
          Uri.parse('android.settings.APP_NOTIFICATION_SETTINGS'),
          mode: LaunchMode.externalApplication,
        );
        if (opened) return;
      } catch (_) {}
      // Last resort: open generic app settings.
      try {
        await launchUrl(
          Uri.parse('app-settings:'),
          mode: LaunchMode.externalApplication,
        );
      } catch (_) {}
    } else {
      // iOS: open the app settings page (notification toggle is there).
      try {
        await launchUrl(
          Uri.parse('app-settings:'),
          mode: LaunchMode.externalApplication,
        );
      } catch (_) {}
    }
  }

  Future<void> _handleEnable() async {
    _dismiss();
    if (Platform.isAndroid) {
      // On Android, check if the permission can still be requested directly.
      final settings =
          await FirebaseMessaging.instance.getNotificationSettings();
      if (settings.authorizationStatus ==
          AuthorizationStatus.notDetermined) {
        // First time — show the OS permission dialog.
        await FirebaseMessaging.instance.requestPermission();
        return;
      }
    }
    // Already denied / iOS — take user to settings.
    await _openSettings();
  }
}
