import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/models/budget.dart';
import 'package:luvverse/shared/widgets/app_card.dart';

final _currencyFormat =
    NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class BudgetCard extends StatelessWidget {
  final Budget budget;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const BudgetCard({
    super.key,
    required this.budget,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final spent = budget.spent ?? 0;
    final remaining = budget.limit - spent;
    final progress = budget.progress.clamp(0.0, 1.0);
    final isOver = budget.isOverBudget;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    Flexible(child: Text(budget.category, style: AppTypography.cardTitle, maxLines: 1, overflow: TextOverflow.ellipsis)),
                    if (isOver) ...[
                      const SizedBox(width: AppSpacing.sm),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.sm,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.danger.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Exceeded!',
                          style: AppTypography.xs.copyWith(
                            color: AppColors.danger,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.edit_outlined, size: 18),
                color: AppColors.textMuted,
                onPressed: onEdit,
                constraints: const BoxConstraints(),
                padding: const EdgeInsets.all(AppSpacing.xs),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18),
                color: AppColors.danger,
                onPressed: onDelete,
                constraints: const BoxConstraints(),
                padding: const EdgeInsets.all(AppSpacing.xs),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppColors.bgElevated,
              color: isOver ? AppColors.danger : AppColors.accent,
              minHeight: 8,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${_currencyFormat.format(spent)} spent / ${_currencyFormat.format(budget.limit)} limit',
                style: AppTypography.small,
              ),
              Text(
                isOver
                    ? '${_currencyFormat.format(remaining.abs())} over'
                    : '${_currencyFormat.format(remaining)} remaining',
                style: AppTypography.small.copyWith(
                  color: isOver ? AppColors.danger : AppColors.success,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
