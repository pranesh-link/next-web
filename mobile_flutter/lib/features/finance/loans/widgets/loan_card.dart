import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/models/loan.dart';
import 'package:luvverse/shared/widgets/app_card.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
final _dateFormat = DateFormat('dd MMM yyyy');

class LoanCard extends StatelessWidget {
  final Loan loan;
  final VoidCallback onView;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const LoanCard({
    super.key,
    required this.loan,
    required this.onView,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final paid = loan.principal - loan.remainingBalance;
    final progress = loan.principal > 0 ? (paid / loan.principal).clamp(0.0, 1.0) : 0.0;
    final percent = (progress * 100).toStringAsFixed(0);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(context),
          if (loan.loanAccountNumber != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text('A/C: ${loan.loanAccountNumber}', style: AppTypography.xs.copyWith(color: context.colors.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
          const SizedBox(height: AppSpacing.md),
          _buildProgressBar(context, progress, percent),
          const SizedBox(height: AppSpacing.md),
          _buildDetails(context),
          const SizedBox(height: AppSpacing.md),
          _buildActions(context),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(loan.name, style: AppTypography.cardTitle),
              if (loan.loanProvider != null)
                Text(loan.loanProvider!, style: AppTypography.small.copyWith(color: context.colors.textMuted)),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
          decoration: BoxDecoration(
            color: context.colors.accent.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text('${loan.interestRate}%', style: AppTypography.small.copyWith(color: context.colors.accent)),
        ),
      ],
    );
  }

  Widget _buildProgressBar(BuildContext context, double progress, String percent) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('$percent% repaid', style: AppTypography.small.copyWith(color: context.colors.accent)),
            Text(
              '${_currencyFormat.format(loan.principal - loan.remainingBalance)} / ${_currencyFormat.format(loan.principal)}',
              style: AppTypography.xs.copyWith(color: context.colors.textMuted),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: context.colors.border,
            color: progress >= 1.0 ? context.colors.success : context.colors.accent,
            minHeight: 8,
          ),
        ),
      ],
    );
  }

  Widget _buildDetails(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.lg,
      runSpacing: AppSpacing.sm,
      children: [
        _detail(context, 'EMI', _currencyFormat.format(loan.emiAmount)),
        _detail(context, 'Remaining', _currencyFormat.format(loan.remainingBalance)),
        _detail(context, 'Start', _dateFormat.format(loan.startDate)),
        _detail(context, 'Tenure', '${loan.tenureMonths} months'),
      ],
    );
  }

  Widget _detail(BuildContext context, String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
        Text(value, style: AppTypography.small),
      ],
    );
  }

  Widget _buildActions(BuildContext context) {
    return Row(
      children: [
        _actionButton(context, Icons.edit_outlined, 'Edit', onEdit),
        const SizedBox(width: AppSpacing.sm),
        _actionButton(context, Icons.delete_outline, 'Delete', onDelete, color: context.colors.danger),
        const Spacer(),
        TextButton.icon(
          onPressed: onView,
          icon: const Icon(Icons.schedule, size: 16),
          label: const Text('View Schedule'),
          style: TextButton.styleFrom(foregroundColor: context.colors.accent, textStyle: AppTypography.small),
        ),
      ],
    );
  }

  Widget _actionButton(BuildContext context, IconData icon, String label, VoidCallback onTap, {Color? color}) {
    final c = color ?? context.colors.textMuted;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: c),
            const SizedBox(width: 4),
            Text(label, style: AppTypography.xs.copyWith(color: c)),
          ],
        ),
      ),
    );
  }
}
