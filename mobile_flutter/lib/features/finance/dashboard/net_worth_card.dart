import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

/// Displays the user's net worth (assets - liabilities).
class NetWorthCard extends ConsumerWidget {
  const NetWorthCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final netWorthAsync = ref.watch(netWorthProvider);

    return netWorthAsync.when(
      loading: () => const LoadingSkeleton(type: SkeletonType.card),
      error: (_, __) => const SizedBox.shrink(),
      data: (data) => _NetWorthContent(data: data),
    );
  }
}

class _NetWorthContent extends StatelessWidget {
  final NetWorthData data;
  const _NetWorthContent({required this.data});

  @override
  Widget build(BuildContext context) {
    final isPositive = data.netWorth >= 0;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.accent.withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.pie_chart_outline, color: AppColors.accent, size: 20),
              ),
              const SizedBox(width: AppSpacing.md),
              Text('Net Worth', style: AppTypography.cardTitle),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              _currencyFormat.format(data.netWorth),
              style: AppTypography.summaryValue.copyWith(
                color: isPositive ? AppColors.success : AppColors.danger,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          _BreakdownLine(label: 'Accounts', amount: data.accountsTotal),
          const SizedBox(height: AppSpacing.sm),
          _BreakdownLine(label: 'Investments', amount: data.investmentsTotal),
          const SizedBox(height: AppSpacing.sm),
          _BreakdownLine(label: 'Deposits', amount: data.depositsTotal),
          const Divider(height: 20),
          _BreakdownLine(label: 'Total Assets', amount: data.totalAssets, bold: true),
          const SizedBox(height: AppSpacing.sm),
          _BreakdownLine(label: 'Liabilities (Loans)', amount: -data.liabilities, isDanger: true),
        ],
      ),
    );
  }
}

class _BreakdownLine extends StatelessWidget {
  final String label;
  final double amount;
  final bool bold;
  final bool isDanger;

  const _BreakdownLine({
    required this.label,
    required this.amount,
    this.bold = false,
    this.isDanger = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: bold
              ? AppTypography.small.copyWith(fontWeight: FontWeight.w600)
              : AppTypography.small.copyWith(color: AppColors.textMuted),
        ),
        Text(
          _currencyFormat.format(amount.abs()),
          style: AppTypography.small.copyWith(
            fontWeight: bold ? FontWeight.w600 : FontWeight.w500,
            color: isDanger ? AppColors.danger : AppColors.text,
          ),
        ),
      ],
    );
  }
}
