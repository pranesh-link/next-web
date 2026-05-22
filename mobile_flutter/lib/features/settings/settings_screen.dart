import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Settings'), backgroundColor: AppColors.bg, elevation: 0),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.xl),
        children: [
          // Profile section
          Container(
            padding: const EdgeInsets.all(AppSpacing.xl),
            decoration: BoxDecoration(
              color: AppColors.bgElevated,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.cardBorder),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.accent.withValues(alpha: 0.1),
                  backgroundImage: user?.image != null ? NetworkImage(user!.image!) : null,
                  child: user?.image == null
                      ? Text(
                          (user?.name ?? 'U')[0].toUpperCase(),
                          style: TextStyle(color: AppColors.accent, fontSize: 20, fontWeight: FontWeight.w700),
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
                      Text(user?.email ?? '', style: AppTypography.small.copyWith(color: AppColors.textMuted)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          _SettingsTile(icon: Icons.people, title: 'Couple', onTap: () => context.go('/couple/details')),
          _SettingsTile(icon: Icons.notifications_outlined, title: 'Notifications', onTap: () => _showSnackbar(context, 'Coming soon')),
          _SettingsTile(icon: Icons.palette_outlined, title: 'Appearance', onTap: () => _showSnackbar(context, 'Coming soon')),
          _SettingsTile(
            icon: Icons.info_outline,
            title: 'About',
            onTap: () => showAboutDialog(context: context, applicationName: 'LuvVerse', applicationVersion: '1.0.0', applicationLegalese: '\u00a9 2024 LuvVerse'),
          ),
          const Divider(height: 32),
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.danger),
            title: Text('Sign Out', style: AppTypography.body.copyWith(color: AppColors.danger)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            onTap: () => _confirmSignOut(context, ref),
          ),
        ],
      ),
    );
  }

  void _showSnackbar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), duration: const Duration(seconds: 2)));
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
            child: const Text('Sign Out', style: TextStyle(color: AppColors.danger)),
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
      leading: Icon(icon, color: AppColors.textDim),
      title: Text(title, style: AppTypography.body),
      trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: onTap,
    );
  }
}
