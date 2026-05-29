import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
import 'package:luvverse/core/prefetch/background_prefetch_service.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/shared/widgets/app_card.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Trigger background prefetch after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      BackgroundPrefetchService(ref).prefetchMediumPriority();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final firstName = user?.name.split(' ').first;
    final balance = ref.watch(totalBalanceProvider);

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
              // Module grid
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: AppSpacing.lg,
                  crossAxisSpacing: AppSpacing.lg,
                  childAspectRatio: 1.05,
                  children: [
                    _ModuleCard(icon: Icons.account_balance_wallet, title: 'Finance', subtitle: 'Track money together', color: context.colors.accent, onTap: () => context.go('/finance')),
                    _ModuleCard(icon: Icons.flight, title: 'Travel', subtitle: 'Plan trips', color: const Color(0xFF8B5CF6), onTap: () => _snackbar(context, 'Coming soon')),
                    _ModuleCard(icon: Icons.favorite, title: 'Lifestyle', subtitle: 'Health & wellness', color: const Color(0xFFEC4899), onTap: () => context.go('/lifestyle')),
                    _ModuleCard(icon: Icons.chat_bubble, title: 'Chat', subtitle: 'Stay connected', color: context.colors.success, onTap: () => _snackbar(context, 'Coming soon')),
                  ],
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
                      Text(NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2).format(val), style: AppTypography.bodyMedium.copyWith(fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _snackbar(BuildContext context, String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), duration: const Duration(seconds: 2)));
  }
}

class _ModuleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;

  const _ModuleCard({required this.icon, required this.title, required this.subtitle, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
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
    );
  }
}
