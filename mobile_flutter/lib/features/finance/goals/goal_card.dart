import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/models/goal.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';

final _currencyFormat =
    NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class GoalCard extends StatelessWidget {
  final Goal goal;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onContribute;

  const GoalCard({
    super.key,
    required this.goal,
    required this.onEdit,
    required this.onDelete,
    required this.onContribute,
  });

  @override
  Widget build(BuildContext context) {
    final progress = goal.progress.clamp(0.0, 1.0);
    final percent = (progress * 100).toStringAsFixed(0);
    final remaining = goal.targetAmount - goal.currentAmount;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(goal.name, style: AppTypography.cardTitle)),
              IconButton(
                icon: const Icon(Icons.edit_outlined, size: 18),
                color: context.colors.textMuted,
                onPressed: onEdit,
                constraints: const BoxConstraints(),
                padding: const EdgeInsets.all(AppSpacing.xs),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18),
                color: context.colors.danger,
                onPressed: onDelete,
                constraints: const BoxConstraints(),
                padding: const EdgeInsets.all(AppSpacing.xs),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              SizedBox(
                width: 56,
                height: 56,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 5,
                      backgroundColor: context.colors.border,
                      color: goal.isComplete ? context.colors.success : context.colors.accent,
                    ),
                    Text(
                      '$percent%',
                      style: AppTypography.xs.copyWith(
                        color: context.colors.text,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${_currencyFormat.format(goal.currentAmount)} / ${_currencyFormat.format(goal.targetAmount)}',
                      style: AppTypography.body,
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Text(
                      '${_currencyFormat.format(remaining > 0 ? remaining : 0)} remaining',
                      style: AppTypography.small.copyWith(color: context.colors.textMuted),
                    ),
                    if (goal.deadline != null) ...[
                      const SizedBox(height: AppSpacing.xs),
                      _DeadlineBadge(deadline: goal.deadline!),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          if (!goal.isComplete)
            AppButton(
              label: 'Contribute',
              icon: Icons.add,
              size: ButtonSize.sm,
              onPressed: onContribute,
            ),
        ],
      ),
    );
  }
}

class _DeadlineBadge extends StatelessWidget {
  final DateTime deadline;
  const _DeadlineBadge({required this.deadline});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final isOverdue = deadline.isBefore(now);
    final months = _monthsDiff(now, deadline);

    final text = isOverdue ? 'Overdue!' : '$months months left';
    final color = isOverdue ? context.colors.danger : context.colors.accent;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: AppTypography.xs.copyWith(color: color, fontWeight: FontWeight.w700),
      ),
    );
  }

  int _monthsDiff(DateTime from, DateTime to) {
    return (to.year - from.year) * 12 + to.month - from.month;
  }
}
