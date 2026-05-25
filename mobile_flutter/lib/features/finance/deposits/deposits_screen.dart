import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/deposits/deposit_card.dart';
import 'package:luvverse/features/finance/forms/add_deposit_form.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/deposit.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';

/// Screen listing all deposit instruments with summary cards.
class DepositsScreen extends ConsumerWidget {
  const DepositsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final depositsAsync = ref.watch(depositsProvider);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              AppButton(
                label: 'Add Deposit',
                onPressed: () => AddDepositForm.show(context),
                size: ButtonSize.sm,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Expanded(
            child: depositsAsync.when(
              loading: () => const LoadingSkeleton(type: SkeletonType.list),
              error: (e, _) => OfflineErrorState(
                error: e,
                onRetry: () => ref.read(depositsProvider.notifier).refresh(),
              ),
              data: (deposits) => deposits.isEmpty
                  ? EmptyState(
                      icon: Icons.savings_outlined,
                      title: 'No Deposits',
                      description:
                          'Add your first FD or RD to track maturity',
                      actionLabel: 'Add Deposit',
                      onAction: () => AddDepositForm.show(context),
                    )
                  : RefreshIndicator(
                      onRefresh: () =>
                          ref.read(depositsProvider.notifier).refresh(),
                      child: ListView(
                        children: [
                          _SummarySection(deposits: deposits),
                          const SizedBox(height: AppSpacing.lg),
                          ...deposits.map((d) => Padding(
                                padding: const EdgeInsets.only(
                                    bottom: AppSpacing.sm),
                                child: DepositCard(d),
                              )),
                        ],
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummarySection extends StatelessWidget {
  final List<Deposit> deposits;
  const _SummarySection({required this.deposits});

  @override
  Widget build(BuildContext context) {
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹');
    final totalInvested =
        deposits.fold<double>(0, (s, d) => s + d.principalAmount);
    final maturityValue =
        deposits.fold<double>(0, (s, d) => s + d.maturityAmount);
    final interestEarned = maturityValue - totalInvested;
    final activeCount = deposits.where((d) => d.isActive).length;
    final maturedCount = deposits.where((d) => d.isMatured).length;

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                label: 'Total Invested',
                value: currencyFmt.format(totalInvested),
                icon: Icons.account_balance_wallet,
                color: AppColors.accent,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _SummaryCard(
                label: 'Maturity Value',
                value: currencyFmt.format(maturityValue),
                icon: Icons.trending_up,
                color: AppColors.success,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                label: 'Interest Earned',
                value: currencyFmt.format(interestEarned),
                icon: Icons.percent,
                color: const Color(0xFF8B5CF6),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: _SummaryCard(
                label: 'Active / Matured',
                value: '$activeCount / $maturedCount',
                icon: Icons.pie_chart_outline,
                color: AppColors.accent,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _SummaryCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Expanded(
                child: Text(label,
                    style: AppTypography.xs
                        .copyWith(color: AppColors.textMuted)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: AppTypography.bodyMedium.copyWith(
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
