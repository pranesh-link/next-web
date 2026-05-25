import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/forms/add_investment_form.dart';
import 'package:luvverse/features/finance/investments/investment_card.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/investment.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';

/// Screen listing all investment holdings with summary cards.
class InvestmentsScreen extends ConsumerWidget {
  const InvestmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final investmentsAsync = ref.watch(investmentsProvider);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              AppButton(
                label: 'Add Investment',
                onPressed: () => AddInvestmentForm.show(context),
                size: ButtonSize.sm,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Expanded(
            child: investmentsAsync.when(
              loading: () => const LoadingSkeleton(type: SkeletonType.list),
              error: (e, _) => OfflineErrorState(
                error: e,
                onRetry: () => ref.read(investmentsProvider.notifier).refresh(),
              ),
              data: (investments) => investments.isEmpty
                  ? EmptyState(
                      icon: Icons.trending_up,
                      title: 'No Investments',
                      description:
                          'Track your stocks, mutual funds, gold & silver',
                      actionLabel: 'Add Investment',
                      onAction: () => AddInvestmentForm.show(context),
                    )
                  : RefreshIndicator(
                      onRefresh: () =>
                          ref.read(investmentsProvider.notifier).refresh(),
                      child: ListView(
                        children: [
                          _SummarySection(investments: investments),
                          const SizedBox(height: AppSpacing.lg),
                          ...investments.map((inv) => Padding(
                                padding: const EdgeInsets.only(
                                    bottom: AppSpacing.sm),
                                child: InvestmentCard(inv),
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
  final List<Investment> investments;
  const _SummarySection({required this.investments});

  @override
  Widget build(BuildContext context) {
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹');
    final totalInvested =
        investments.fold<double>(0, (s, inv) => s + inv.investedAmount);
    final currentValue = investments.fold<double>(
        0, (s, inv) => s + (inv.currentValue ?? inv.investedAmount));
    final gainLoss = currentValue - totalInvested;
    final gainColor = gainLoss >= 0 ? AppColors.success : AppColors.danger;

    return Row(
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
            label: 'Current Value',
            value: currencyFmt.format(currentValue),
            icon: Icons.trending_up,
            color: AppColors.success,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _SummaryCard(
            label: 'Gain/Loss',
            value: '${gainLoss >= 0 ? '+' : ''}${currencyFmt.format(gainLoss)}',
            icon: gainLoss >= 0
                ? Icons.arrow_upward
                : Icons.arrow_downward,
            color: gainColor,
          ),
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
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Flexible(
                child: Text(label,
                    style: AppTypography.xs
                        .copyWith(color: AppColors.textMuted),
                    overflow: TextOverflow.ellipsis),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: AppTypography.small.copyWith(
              fontWeight: FontWeight.w700,
              color: color,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
