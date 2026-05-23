import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/forms/edit_deposit_form.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/deposit.dart';
import 'package:luvverse/shared/widgets/app_card.dart';

/// Card displaying a single deposit with edit/delete actions.
class DepositCard extends ConsumerWidget {
  final Deposit deposit;
  const DepositCard(this.deposit, {super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹');
    final dateFmt = DateFormat('dd MMM yyyy');
    final isRD = deposit.isRecurring;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          if (deposit.provider != null) ...[
            const SizedBox(height: 4),
            Text(
              deposit.provider!,
              style: AppTypography.small.copyWith(color: AppColors.textMuted),
            ),
          ],
          const SizedBox(height: AppSpacing.md),
          _buildMetrics(currencyFmt),
          const SizedBox(height: AppSpacing.sm),
          _buildMaturityRow(currencyFmt, dateFmt),
          if (isRD && deposit.totalInstallments != null) ...[
            const SizedBox(height: AppSpacing.md),
            _buildInstallmentProgress(),
          ],
          const SizedBox(height: AppSpacing.md),
          _buildActions(context, ref),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    final isRD = deposit.isRecurring;
    return Row(
      children: [
        Icon(
          isRD ? Icons.repeat : Icons.lock_clock,
          color: AppColors.accent,
          size: 20,
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(deposit.name, style: AppTypography.cardTitle),
        ),
        _buildBadge(
          isRD ? 'RD' : 'FD',
          AppColors.accent,
        ),
        const SizedBox(width: 6),
        _buildBadge(
          deposit.isActive ? 'Active' : 'Matured',
          deposit.isActive ? AppColors.success : AppColors.accent,
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

  Widget _buildMetrics(NumberFormat fmt) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _InfoCol('Principal', fmt.format(deposit.principalAmount)),
        _InfoCol('Rate', '${deposit.interestRate}%'),
        _InfoCol('Tenure', '${deposit.tenureMonths} mo'),
      ],
    );
  }

  Widget _buildMaturityRow(NumberFormat currencyFmt, DateFormat dateFmt) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _InfoCol('Maturity Date', dateFmt.format(deposit.maturityDate)),
        _InfoCol('Maturity Amt', currencyFmt.format(deposit.maturityAmount)),
      ],
    );
  }

  Widget _buildInstallmentProgress() {
    return Row(
      children: [
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: deposit.installmentProgress,
              backgroundColor: AppColors.border,
              color: AppColors.accent,
              minHeight: 6,
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Text(
          '${deposit.paidInstallments}/${deposit.totalInstallments} paid',
          style: AppTypography.xs.copyWith(color: AppColors.textMuted),
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
          onPressed: () => EditDepositForm.show(context, deposit),
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
        title: const Text('Delete Deposit'),
        content: Text('Delete "${deposit.name}"? This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(depositsProvider.notifier).delete(deposit.id);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Deposit deleted')),
                );
              }
            },
            child: Text('Delete',
                style: TextStyle(color: AppColors.danger)),
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
