import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
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
          _buildHeader(),
          if (loan.loanAccountNumber != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text('A/C: ${loan.loanAccountNumber}', style: AppTypography.xs.copyWith(color: AppColors.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
          const SizedBox(height: AppSpacing.md),
          _buildProgressBar(progress, percent),
          const SizedBox(height: AppSpacing.md),
          _buildDetails(),
          const SizedBox(height: AppSpacing.md),
          _buildActions(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(loan.name, style: AppTypography.cardTitle),
              if (loan.loanProvider != null)
                Text(loan.loanProvider!, style: AppTypography.small.copyWith(color: AppColors.textMuted)),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
          decoration: BoxDecoration(
            color: AppColors.accent.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text('${loan.interestRate}%', style: AppTypography.small.copyWith(color: AppColors.accent)),
        ),
      ],
    );
  }

  Widget _buildProgressBar(double progress, String percent) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('$percent% repaid', style: AppTypography.small.copyWith(color: AppColors.accent)),
            Text(
              '${_currencyFormat.format(loan.principal - loan.remainingBalance)} / ${_currencyFormat.format(loan.principal)}',
              style: AppTypography.xs.copyWith(color: AppColors.textMuted),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: AppColors.border,
            color: progress >= 1.0 ? AppColors.success : AppColors.accent,
            minHeight: 8,
          ),
        ),
      ],
    );
  }

  Widget _buildDetails() {
    return Wrap(
      spacing: AppSpacing.lg,
      runSpacing: AppSpacing.sm,
      children: [
        _detail('EMI', _currencyFormat.format(loan.emiAmount)),
        _detail('Remaining', _currencyFormat.format(loan.remainingBalance)),
        _detail('Start', _dateFormat.format(loan.startDate)),
        _detail('Tenure', '${loan.tenureMonths} months'),
      ],
    );
  }

  Widget _detail(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: AppTypography.xs.copyWith(color: AppColors.textMuted)),
        Text(value, style: AppTypography.small),
      ],
    );
  }

  Widget _buildActions() {
    return Row(
      children: [
        _actionButton(Icons.edit_outlined, 'Edit', onEdit),
        const SizedBox(width: AppSpacing.sm),
        _actionButton(Icons.delete_outline, 'Delete', onDelete, color: AppColors.danger),
        const Spacer(),
        TextButton.icon(
          onPressed: onView,
          icon: const Icon(Icons.schedule, size: 16),
          label: const Text('View Schedule'),
          style: TextButton.styleFrom(foregroundColor: AppColors.accent, textStyle: AppTypography.small),
        ),
      ],
    );
  }

  Widget _actionButton(IconData icon, String label, VoidCallback onTap, {Color? color}) {
    final c = color ?? AppColors.textMuted;
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
