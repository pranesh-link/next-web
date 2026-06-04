import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

const _kLastReminderKey = 'pushPermissionReminderTs';

/// Shows a non-intrusive banner at most once every 3 days when the user
/// has denied push notification permission. The banner deep-links to the
/// device's app notification settings.
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
              _dismiss();
              // Navigate user to device notification settings for this app.
              // Uses flutter_local_notifications, available in the project.
              _openSettings();
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

  void _openSettings() {
    // Open the device app-settings page so the user can enable notifications.
    launchUrl(
      Uri.parse('app-settings:'),
      mode: LaunchMode.externalApplication,
    ).catchError((Object _) {
      // Fallback: some Android versions don't support 'app-settings:'.
      launchUrl(
        Uri.parse('package:com.pranesh.luvverse'),
        mode: LaunchMode.externalApplication,
      ).catchError((Object __) {});
    });
  }
}
