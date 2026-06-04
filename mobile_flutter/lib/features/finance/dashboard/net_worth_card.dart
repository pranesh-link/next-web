import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/finance/balance_masked_provider.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
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
    final masked = ref.watch(balanceMaskedProvider);

    return netWorthAsync.when(
      loading: () => const LoadingSkeleton(type: SkeletonType.card),
      error: (_, __) => const SizedBox.shrink(),
      data: (data) => _NetWorthContent(data: data, masked: masked),
    );
  }
}

class _NetWorthContent extends StatelessWidget {
  final NetWorthData data;
  final bool masked;
  const _NetWorthContent({required this.data, this.masked = false});

  @override
  Widget build(BuildContext context) {
    final isPositive = data.netWorth >= 0;
    final fmt = masked ? '₹ ••••' : _currencyFormat.format(data.netWorth);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: context.colors.accent.withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.pie_chart_outline, color: context.colors.accent, size: 20),
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
              fmt,
              style: AppTypography.summaryValue.copyWith(
                color: masked
                    ? context.colors.textMuted
                    : isPositive
                        ? context.colors.success
                        : context.colors.danger,
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          _BreakdownLine(label: 'Accounts', amount: data.accountsTotal, masked: masked),
          const SizedBox(height: AppSpacing.sm),
          _BreakdownLine(label: 'Investments', amount: data.investmentsTotal, masked: masked),
          const SizedBox(height: AppSpacing.sm),
          _BreakdownLine(label: 'Deposits', amount: data.depositsTotal, masked: masked),
          const Divider(height: 20),
          _BreakdownLine(label: 'Total Assets', amount: data.totalAssets, bold: true, masked: masked),
          const SizedBox(height: AppSpacing.sm),
          _BreakdownLine(label: 'Liabilities (Loans)', amount: -data.liabilities, isDanger: true, masked: masked),
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
  final bool masked;

  const _BreakdownLine({
    required this.label,
    required this.amount,
    this.bold = false,
    this.isDanger = false,
    this.masked = false,
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
              : AppTypography.small.copyWith(color: context.colors.textMuted),
        ),
        Text(
          masked ? '••••' : _currencyFormat.format(amount.abs()),
          style: AppTypography.small.copyWith(
            fontWeight: bold ? FontWeight.w600 : FontWeight.w500,
            color: isDanger ? context.colors.danger : context.colors.text,
          ),
        ),
      ],
    );
  }
}
