import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/forms/edit_investment_form.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/investment.dart';
import 'package:luvverse/shared/widgets/app_card.dart';

/// Card displaying a single investment with edit/delete actions.
class InvestmentCard extends ConsumerWidget {
  final Investment investment;
  const InvestmentCard(this.investment, {super.key});

  String get _assetEmoji {
    switch (investment.assetType) {
      case 'GOLD':
        return '🥇';
      case 'SILVER':
        return '🥈';
      case 'STOCK':
        return '📊';
      case 'MUTUAL_FUND':
        return '📈';
      default:
        return '💰';
    }
  }

  String get _assetLabel {
    switch (investment.assetType) {
      case 'GOLD':
        return 'Gold';
      case 'SILVER':
        return 'Silver';
      case 'STOCK':
        return 'Stock';
      case 'MUTUAL_FUND':
        return 'Mutual Fund';
      default:
        return investment.assetType;
    }
  }

  Color get _assetColor {
    switch (investment.assetType) {
      case 'GOLD':
        return const Color(0xFFD4A017);
      case 'SILVER':
        return const Color(0xFFC0C0C0);
      case 'STOCK':
        return AppColors.accent;
      case 'MUTUAL_FUND':
        return const Color(0xFF8B5CF6);
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹');
    final gainLoss = investment.gainLoss;
    final gainColor = gainLoss >= 0 ? AppColors.success : AppColors.danger;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          if (investment.ticker != null) ...[
            const SizedBox(height: 4),
            Text(
              '${investment.ticker}${investment.exchange != null ? ' · ${investment.exchange}' : ''}',
              style:
                  AppTypography.small.copyWith(color: AppColors.textMuted),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          _buildMetrics(currencyFmt, gainLoss, gainColor),
          if (investment.isSip && investment.sipAmount != null) ...[
            const SizedBox(height: AppSpacing.sm),
            _buildSipInfo(currencyFmt),
          ],
          const SizedBox(height: AppSpacing.md),
          _buildActions(context, ref),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Text(_assetEmoji, style: const TextStyle(fontSize: 18)),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(investment.name, style: AppTypography.cardTitle),
        ),
        _buildBadge(_assetLabel, _assetColor),
        const SizedBox(width: 6),
        _buildBadge(
          investment.isSip ? 'SIP' : 'Lumpsum',
          investment.isSip ? AppColors.accent : AppColors.textMuted,
        ),
      ],
    );
  }

  Widget _buildBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        label,
        style: AppTypography.xs.copyWith(
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildMetrics(NumberFormat fmt, double gainLoss, Color gainColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _InfoCol('Invested', fmt.format(investment.investedAmount)),
        _InfoCol(
          'Current',
          fmt.format(investment.currentValue ?? investment.investedAmount),
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('Gain/Loss',
                style:
                    AppTypography.xs.copyWith(color: AppColors.textMuted)),
            const SizedBox(height: 2),
            Text(
              '${gainLoss >= 0 ? '+' : ''}${fmt.format(gainLoss)}',
              style: AppTypography.bodyMedium.copyWith(color: gainColor),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSipInfo(NumberFormat currencyFmt) {
    final dateFmt = DateFormat('dd MMM yyyy');
    return Row(
      children: [
        Icon(Icons.autorenew, size: 14, color: AppColors.textMuted),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            'SIP ${currencyFmt.format(investment.sipAmount)} on day ${investment.sipDayOfMonth}'
            '${investment.nextSipDate != null ? ' · Next: ${dateFmt.format(investment.nextSipDate!)}' : ''}',
            style: AppTypography.xs.copyWith(color: AppColors.textMuted),
          ),
        ),
      ],
    );
  }

  Widget _buildActions(BuildContext context, WidgetRef ref) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        IconButton(
          icon: const Icon(Icons.edit_outlined, size: 20),
          color: AppColors.textMuted,
          onPressed: () => EditInvestmentForm.show(context, investment),
          tooltip: 'Edit',
          visualDensity: VisualDensity.compact,
        ),
        IconButton(
          icon: const Icon(Icons.delete_outline, size: 20),
          color: AppColors.danger,
          onPressed: () => _confirmDelete(context, ref),
          tooltip: 'Delete',
          visualDensity: VisualDensity.compact,
        ),
      ],
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Investment'),
        content:
            Text('Delete "${investment.name}"? This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref
                  .read(investmentsProvider.notifier)
                  .delete(investment.id);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Investment deleted')),
                );
              }
            },
            child:
                Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}

class _InfoCol extends StatelessWidget {
  final String label;
  final String value;
  const _InfoCol(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: AppTypography.xs.copyWith(color: AppColors.textMuted)),
        const SizedBox(height: 2),
        Text(value, style: AppTypography.bodyMedium),
      ],
    );
  }
}
