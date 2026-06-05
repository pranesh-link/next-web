import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
import 'package:luvverse/core/finance/balance_masked_provider.dart';
import 'package:luvverse/core/notifications/notification_permission_reminder.dart';
import 'package:luvverse/core/notifications/push_providers.dart';
import 'package:luvverse/core/prefetch/background_prefetch_service.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/couple/couple_status_provider.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/core/config/app_config_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with WidgetsBindingObserver {
  /// Tracks whether notifications are denied so the banner rebuilds correctly
  /// when the user returns from Android settings after granting permission.
  bool _notifDenied = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Trigger background prefetch after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      BackgroundPrefetchService(ref).prefetchMediumPriority();
      _checkPushPermission();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  /// Re-check permission whenever the app comes back to the foreground so the
  /// banner disappears immediately after the user grants permission in settings.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkPushPermission();
    }
  }

  /// Handle push permission on home load.
  /// First install (notDetermined): show the OS prompt now that home is visible.
  /// Already denied: surface the reminder banner.
  Future<void> _checkPushPermission() async {
    final pushService = ref.read(pushNotificationServiceProvider);
    if (await pushService.isPermissionNotDetermined()) {
      // First install — ask for permission now that home page is visible.
      final granted = await pushService.requestPermission();
      if (granted && mounted) {
        await pushService.registerToken();
        setState(() => _notifDenied = false);
      }
      return;
    }
    final hasPermission = await pushService.hasPermission();
    if (mounted) {
      setState(() => _notifDenied = !hasPermission);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final firstName = user?.name?.split(' ').first ?? user?.displayName;
    final balance = ref.watch(totalBalanceProvider);
    final masked = ref.watch(balanceMaskedProvider);
    final hasCouple = ref.watch(hasCoupleProvider).valueOrNull ?? true;
    final config = ref.watch(appConfigProvider).valueOrNull;

    // Build module cards; available (non-comingSoon) items appear first.
    final allModules = [
      _ModuleConfig(
        icon: Icons.account_balance_wallet,
        title: 'Finance',
        subtitle: 'Track money',
        color: context.colors.accent,
        comingSoon: config != null && !config.isEnabled('finance'),
        route: '/finance',
      ),
      _ModuleConfig(
        icon: Icons.flight,
        title: 'Travel',
        subtitle: 'Plan trips',
        color: const Color(0xFF8B5CF6),
        comingSoon: config == null || !config.isEnabled('travel'),
        route: '/travel',
      ),
      _ModuleConfig(
        icon: Icons.favorite,
        title: 'Lifestyle',
        subtitle: 'Health & wellness',
        color: const Color(0xFFEC4899),
        comingSoon: config == null || !config.isEnabled('lifestyle'),
        route: '/lifestyle',
      ),
      if (hasCouple)
        _ModuleConfig(
          icon: Icons.chat_bubble,
          title: 'Chat',
          subtitle: 'Stay connected',
          color: context.colors.success,
          comingSoon: config != null && !config.isEnabled('chat'),
          route: '/chat',
        ),
    ];
    // Active modules first, coming-soon last.
    final sortedModules = [...allModules..sort((a, b) {
      if (!a.comingSoon && b.comingSoon) return -1;
      if (a.comingSoon && !b.comingSoon) return 1;
      return 0;
    })];

    return Scaffold(
      backgroundColor: context.colors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Expanded(
                    child: Text('LuvVerse', style: AppTypography.pageTitle.copyWith(color: context.colors.accent)),
                  ),
                  GestureDetector(
                    onTap: () => context.go('/settings'),
                    child: CircleAvatar(
                      radius: 18,
                      backgroundColor: context.colors.accent.withValues(alpha: 0.1),
                      backgroundImage: user?.image != null ? CachedNetworkImageProvider(user!.image!) : null,
                      child: user?.image == null
                          ? Text((user?.name ?? 'U')[0].toUpperCase(), style: TextStyle(color: context.colors.accent, fontSize: 14, fontWeight: FontWeight.w700))
                          : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.xxl),
              Text(
                firstName != null ? 'Welcome back, $firstName' : 'Welcome back',
                style: AppTypography.cardTitle.copyWith(letterSpacing: -0.3),
              ),
              const SizedBox(height: AppSpacing.xxl),
              // Permission reminder banner — only visible when notifications denied.
              // Driven by _notifDenied state which refreshes on every app resume
              // so the banner disappears immediately after the user grants
              // permission in system settings and returns to the app.
              if (_notifDenied) const NotificationPermissionReminder(),
              // Module grid
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: AppSpacing.lg,
                  crossAxisSpacing: AppSpacing.lg,
                  childAspectRatio: 1.05,
                  children: sortedModules.map((m) => _ModuleCard(
                    icon: m.icon,
                    title: m.title,
                    subtitle: m.subtitle,
                    color: m.color,
                    comingSoon: m.comingSoon,
                    onTap: () => context.go(m.route),
                  )).toList(),
                ),
              ),
              // Quick stats
              balance.when(
                data: (val) => Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  decoration: BoxDecoration(
                    color: context.colors.bgElevated,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: context.colors.cardBorder),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.account_balance_wallet_outlined, size: 20, color: context.colors.textMuted),
                      const SizedBox(width: AppSpacing.md),
                      Text('Total Balance', style: AppTypography.small.copyWith(color: context.colors.textMuted)),
                      const Spacer(),
                      Text(
                        masked ? '₹ ••••' : NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2).format(val),
                        style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ),
                loading: () => const SizedBox.shrink(),
                error: (e, _) => const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }

}

class _ModuleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;
  final bool comingSoon;

  const _ModuleCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
    this.comingSoon = false,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.passthrough,
      children: [
        AppCard(
          onTap: comingSoon
              ? () => ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Coming soon'),
                      duration: Duration(seconds: 2),
                    ),
                  )
              : onTap,
          child: Opacity(
            opacity: comingSoon ? 0.55 : 1.0,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(title, style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(subtitle, style: AppTypography.small.copyWith(color: context.colors.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ),
        if (comingSoon)
          Positioned(
            top: 8,
            right: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFF59E0B),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'Coming soon',
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                  letterSpacing: 0.2,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _ModuleConfig {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final bool comingSoon;
  final String route;

  const _ModuleConfig({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.comingSoon,
    required this.route,
  });
}
