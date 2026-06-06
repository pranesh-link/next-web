import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
import 'package:luvverse/core/auth/biometric_service.dart';
import 'package:luvverse/core/notifications/push_providers.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/core/theme/theme_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final currentTheme = ref.watch(themeProvider);

    return Stack(
      children: [
        Scaffold(
          appBar: AppBar(title: const Text('Settings')),
          body: ListView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: [
          // Profile section
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Theme.of(context).dividerColor),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: context.colors.accent.withValues(alpha: 0.1),
                  backgroundImage: user?.image != null ? CachedNetworkImageProvider(user!.image!) : null,
                  child: user?.image == null
                      ? Text(
                          (user?.name ?? 'U')[0].toUpperCase(),
                          style: TextStyle(color: context.colors.accent, fontSize: 20, fontWeight: FontWeight.w700),
                        )
                      : null,
                ),
                const SizedBox(width: AppSpacing.lg),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(user?.name ?? 'User', style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 2),
                      Text(user?.email ?? '', style: AppTypography.small.copyWith(color: context.colors.textMuted)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          _SettingsTile(icon: Icons.people, title: 'Couple', onTap: () => context.push('/couple/manage')),
          _SettingsTile(icon: Icons.notifications_outlined, title: 'Notifications', onTap: () => context.push('/notifications')),
          _SettingsTile(icon: Icons.cloud_outlined, title: 'Chat Backup', onTap: () => context.push('/backup-settings')),
          _TestNotificationTile(),
          _ListDevicesTile(),
          const SizedBox(height: AppSpacing.lg),
          // Theme section
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text('Theme', style: AppTypography.small.copyWith(color: context.colors.textMuted, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: AppSpacing.sm),
          SegmentedButton<ThemeMode>(
            segments: const [
              ButtonSegment(value: ThemeMode.light, label: Text('Light'), icon: Icon(Icons.light_mode)),
              ButtonSegment(value: ThemeMode.system, label: Text('System'), icon: Icon(Icons.settings_brightness)),
              ButtonSegment(value: ThemeMode.dark, label: Text('Dark'), icon: Icon(Icons.dark_mode)),
            ],
            selected: {currentTheme},
            onSelectionChanged: (selected) {
              ref.read(themeProvider.notifier).setTheme(selected.first);
            },
          ),
          const SizedBox(height: AppSpacing.lg),
          // Biometric lock section
          _BiometricToggle(),
          const SizedBox(height: AppSpacing.lg),
          _SettingsTile(
            icon: Icons.info_outline,
            title: 'About',
            onTap: () => showAboutDialog(context: context, applicationName: 'LuvVerse', applicationVersion: '1.0.0', applicationLegalese: '\u00a9 2024 LuvVerse'),
          ),
          const Divider(height: 32),
          ListTile(
            leading: Icon(Icons.logout, color: context.colors.danger),
            title: Text('Sign Out', style: AppTypography.body.copyWith(color: context.colors.danger)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            onTap: () => _confirmSignOut(context, ref),
          ),
        ],
      ),
    ),
    // Signing out overlay — blocks all interaction
    if (authState.isSigningOut)
      Container(
        color: Colors.black54,
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Colors.white),
              SizedBox(height: 16),
              Text('Signing out...', style: TextStyle(color: Colors.white, fontSize: 16)),
            ],
          ),
        ),
      ),
    ],
    );
  }

  void _confirmSignOut(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).signOut();
            },
            child: Text('Sign Out', style: TextStyle(color: context.colors.danger)),
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _SettingsTile({required this.icon, required this.title, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: context.colors.textDim),
      title: Text(title, style: AppTypography.body),
      trailing: Icon(Icons.chevron_right, color: context.colors.textMuted, size: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: onTap,
    );
  }
}

class _BiometricToggle extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final biometricEnabled = ref.watch(biometricEnabledProvider);
    final biometricService = ref.read(biometricServiceProvider);

    return FutureBuilder<bool>(
      future: biometricService.isAvailable(),
      builder: (context, snapshot) {
        if (snapshot.data != true) return const SizedBox.shrink();
        return SwitchListTile(
          title: const Text('Biometric Lock'),
          subtitle: const Text('Require authentication on app resume'),
          secondary: const Icon(Icons.fingerprint),
          value: biometricEnabled,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          onChanged: (value) async {
            final messenger = ScaffoldMessenger.of(context);
            if (value) {
              final hasEnrolled = await biometricService.hasEnrolledBiometrics();
              if (!hasEnrolled) {
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text(
                      'No biometrics enrolled. Set up Face ID / fingerprint in device settings first.',
                    ),
                  ),
                );
                return;
              }
              final success = await biometricService.authenticate();
              if (success) {
                await ref.read(biometricEnabledProvider.notifier).toggle(true);
              } else {
                messenger.showSnackBar(
                  const SnackBar(content: Text('Authentication failed.')),
                );
              }
            } else {
              await ref.read(biometricEnabledProvider.notifier).toggle(false);
            }
          },
        );
      },
    );
  }
}

class _TestNotificationTile extends ConsumerStatefulWidget {
  @override
  ConsumerState<_TestNotificationTile> createState() => _TestNotificationTileState();
}

class _TestNotificationTileState extends ConsumerState<_TestNotificationTile> {
  bool _sending = false;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(Icons.send_outlined, color: context.colors.textDim),
      title: Text('Test Push Notification', style: AppTypography.body),
      trailing: _sending
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
          : Icon(Icons.chevron_right, color: context.colors.textMuted, size: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: _sending ? null : _sendTest,
    );
  }

  Future<void> _sendTest() async {
    setState(() => _sending = true);
    try {
      final pushService = ref.read(pushNotificationServiceProvider);

      // Guard: check permission first so we give a clear diagnosis
      final hasPerm = await pushService.hasPermission();
      if (!hasPerm) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Notification permission denied. Enable it in system Settings → Apps → LuvVerse → Notifications.',
            ),
            duration: Duration(seconds: 5),
          ),
        );
        return;
      }

      // Force a fresh FCM token before the test so we don't send against a
      // stale/deactivated token (common after reinstall or OS update).
      final regResult = await pushService.refreshAndRegisterToken();
      if (!regResult.success) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Device registration failed: ${regResult.error ?? 'Unknown error'}.'),
            duration: const Duration(seconds: 5),
          ),
        );
        return;
      }

      final result = await pushService.sendTestNotification();
      if (!mounted) return;

      final String text;
      if (result.success) {
        text = '✓ Test sent to ${result.sent}/${result.deviceCount} device(s)';
      } else if (result.rateLimited) {
        text = '⏱  ${result.message}';
      } else if (result.reason == 'ALL_FAILED') {
        text = 'FCM rejected the token — sign out and back in, then retry.';
      } else if (result.deviceCount == 0) {
        text = 'No active devices found. Sign out and back in, then try again.';
      } else if (result.reason == 'FCM_NOT_CONFIGURED') {
        text = 'Push service not configured on server.';
      } else {
        text = result.message.isNotEmpty ? result.message : 'Unknown error (${result.reason})';
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(text), duration: const Duration(seconds: 5)),
      );
    } catch (e) {
      // Catch silent errors (e.g. Firebase not initialised, network timeout)
      // that previously caused the button to appear to do nothing.
      debugPrint('[TestPush] error: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Push test failed: ${e.toString().replaceFirst('Exception: ', '')}'),
          duration: const Duration(seconds: 5),
        ),
      );
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }
}

class _ListDevicesTile extends ConsumerStatefulWidget {
  @override
  ConsumerState<_ListDevicesTile> createState() => _ListDevicesTileState();
}

class _ListDevicesTileState extends ConsumerState<_ListDevicesTile> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(Icons.devices, color: context.colors.textDim),
      title: Text('List registered devices', style: AppTypography.body),
      subtitle: Text(
        'Show all devices registered for push notifications',
        style: AppTypography.small.copyWith(color: context.colors.textMuted),
      ),
      trailing: _busy
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
          : Icon(Icons.chevron_right, color: context.colors.textMuted, size: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: _busy ? null : _listDevices,
    );
  }

  Future<void> _listDevices() async {
    setState(() => _busy = true);
    final pushService = ref.read(pushNotificationServiceProvider);
    var result = await pushService.listDevices();
    if (!mounted) return;
    setState(() => _busy = false);

    if (!result.success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to list devices: ${result.error}'), duration: const Duration(seconds: 4)),
      );
      return;
    }

    // If any device is expired, auto-trigger re-registration in the background
    // so the list reflects the fresh token when the user sees it.
    final hasExpired = result.devices.any((d) => !d.active);
    if (hasExpired) {
      // Fire-and-forget — result will be reflected when user taps Re-register
      // or pulls to refresh. This initiates the heal without blocking the dialog.
      pushService.refreshAndRegisterToken().then((_) async {
        // Re-fetch so if the user dismisses and re-opens they see fresh state.
        await pushService.listDevices();
      }).ignore();
    }

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          // Per-device loading map: deviceId -> isLoading
          final Map<String, bool> reregLoading = {};

          return AlertDialog(
            title: Text('Registered Devices (${result.activeCount}/${result.totalCount} active)'),
            content: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (hasExpired)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(
                        'Expired tokens are being refreshed automatically.',
                        style: AppTypography.xs.copyWith(color: Colors.orange),
                      ),
                    ),
                  if (result.devices.isEmpty)
                    const Text('No devices registered.')
                  else
                    ...result.devices.map((device) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Opacity(
                            opacity: device.active ? 1.0 : 0.45,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      device.platform == 'ios' ? Icons.phone_iphone : Icons.phone_android,
                                      size: 18,
                                      color: device.active ? context.colors.textDim : context.colors.textMuted,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(device.platform.toUpperCase(),
                                        style: AppTypography.small.copyWith(fontWeight: FontWeight.w600)),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: device.active
                                            ? Colors.green.withValues(alpha: 0.2)
                                            : Colors.orange.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(
                                        device.active ? 'ACTIVE' : 'EXPIRED',
                                        style: AppTypography.xs.copyWith(
                                          color: device.active ? Colors.green : Colors.orange,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                if (!device.active)
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          'Token rejected by FCM.',
                                          style: AppTypography.xs.copyWith(color: Colors.orange),
                                        ),
                                      ),
                                      // Inline re-register with spinner — dialog stays open
                                      reregLoading[device.id] == true
                                          ? const SizedBox(
                                              width: 20, height: 20,
                                              child: CircularProgressIndicator(strokeWidth: 2),
                                            )
                                          : TextButton(
                                              style: TextButton.styleFrom(
                                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                                minimumSize: Size.zero,
                                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                              ),
                                              onPressed: () async {
                                                setDialogState(() => reregLoading[device.id] = true);
                                                try {
                                                  final r = await pushService.refreshAndRegisterToken();
                                                  if (!ctx.mounted) return;
                                                  if (r.success) {
                                                    // Re-fetch and rebuild dialog content
                                                    final fresh = await pushService.listDevices();
                                                    if (!ctx.mounted) return;
                                                    result = fresh.success ? fresh : result;
                                                  }
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    SnackBar(
                                                      content: Text(r.success
                                                          ? '\u2713 Device re-registered successfully'
                                                          : 'Re-registration failed: ${r.error ?? 'Unknown error'}'),
                                                      duration: const Duration(seconds: 4),
                                                    ),
                                                  );
                                                } finally {
                                                  if (ctx.mounted) {
                                                    setDialogState(() => reregLoading.remove(device.id));
                                                  }
                                                }
                                              },
                                              child: Text('Re-register',
                                                  style: AppTypography.xs.copyWith(
                                                      color: Colors.orange,
                                                      fontWeight: FontWeight.w700)),
                                            ),
                                    ],
                                  ),
                                Text('Registered: ${device.createdAt}',
                                    style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
                                Text('Last seen: ${device.updatedAt}',
                                    style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
                              ],
                            ),
                          ),
                        )),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: const Text('Close'),
              ),
            ],
          );
        },
      ),
    );
  }
}
