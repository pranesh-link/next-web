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
    final user = ref.watch(authProvider).user;
    final currentTheme = ref.watch(themeProvider);

    return Scaffold(
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
          _SettingsTile(icon: Icons.notifications_outlined, title: 'Notifications', onTap: () => context.push('/finance/notifications')),
          _TestNotificationTile(),
          _RegisterDeviceTile(),
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
    final pushService = ref.read(pushNotificationServiceProvider);

    // Guard: check permission first so we give a clear diagnosis
    final hasPerm = await pushService.hasPermission();
    if (!hasPerm) {
      if (!mounted) return;
      setState(() => _sending = false);
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

    final result = await pushService.sendTestNotification();
    if (!mounted) return;
    setState(() => _sending = false);

    final String text;
    if (result.success) {
      text = 'Test sent to ${result.sent}/${result.deviceCount} device(s)';
    } else if (result.rateLimited) {
      text = '⏱  ${result.message}';
    } else {
      // Backend returns the precise reason — use its message directly
      text = result.message;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(text), duration: const Duration(seconds: 5)),
    );
  }
}

class _RegisterDeviceTile extends ConsumerStatefulWidget {
  @override
  ConsumerState<_RegisterDeviceTile> createState() => _RegisterDeviceTileState();
}

class _RegisterDeviceTileState extends ConsumerState<_RegisterDeviceTile> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(Icons.phonelink_setup, color: context.colors.textDim),
      title: Text('Re-register this device', style: AppTypography.body),
      subtitle: Text(
        'Request permission & re-register FCM token',
        style: AppTypography.small.copyWith(color: context.colors.textMuted),
      ),
      trailing: _busy
          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
          : Icon(Icons.chevron_right, color: context.colors.textMuted, size: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: _busy ? null : _register,
    );
  }

  Future<void> _register() async {
    setState(() => _busy = true);
    final pushService = ref.read(pushNotificationServiceProvider);
    final granted = await pushService.requestPermission();
    final result = await pushService.registerToken();
    if (!mounted) return;
    setState(() => _busy = false);

    final String text;
    if (!granted) {
      text = 'Permission denied. Enable notifications in system Settings.';
    } else if (result.success) {
      text = 'Device registered ✓';
    } else {
      text = 'Registration failed: ${result.error}';
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(text), duration: const Duration(seconds: 6)),
    );
  }
}
