import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_strings.dart';

/// Empty state shown when no budget plan items exist.
class PlannerEmptyState extends StatelessWidget {
  final VoidCallback onAdd;

  /// When non-null, shows a quick-import chip for the previous month's plan.
  final VoidCallback? onImportLastMonth;

  /// When non-null, shows a quick-import chip for loan EMIs.
  final VoidCallback? onImportLoans;

  const PlannerEmptyState({
    super.key,
    required this.onAdd,
    this.onImportLastMonth,
    this.onImportLoans,
  });

  @override
  Widget build(BuildContext context) {
    final hasQuickImport = onImportLastMonth != null || onImportLoans != null;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.event_note_outlined,
                size: 56, color: context.colors.textMuted.withAlpha(100)),
            const SizedBox(height: AppSpacing.lg),
            Text(
              BudgetPlannerStrings.noPlansYet,
              style:
                  AppTypography.cardTitle.copyWith(color: context.colors.textMuted),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              BudgetPlannerStrings.startPlanningYourMonth,
              style: AppTypography.small.copyWith(color: context.colors.textMuted),
            ),
            const SizedBox(height: AppSpacing.xl),
            FilledButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add, size: 18),
              label: const Text(BudgetPlannerStrings.addFirstItem),
            ),
                        if (hasQuickImport) ...[
              const SizedBox(height: AppSpacing.lg),
              Text(
                BudgetPlannerStrings.quicklyAddFrom,
                style: AppTypography.xs.copyWith(color: context.colors.textMuted),
              ),
              const SizedBox(height: AppSpacing.sm),
              Wrap(
                spacing: AppSpacing.sm,
                runSpacing: AppSpacing.xs,
                children: [
                  if (onImportLastMonth != null)
                    ActionChip(
                      avatar: const Text(BudgetPlannerStrings.clipboardIcon),
                      label: const Text(BudgetPlannerStrings.lastMonth),
                      onPressed: onImportLastMonth,
                    ),
                  if (onImportLoans != null)
                    ActionChip(
                      avatar: const Text(BudgetPlannerStrings.creditCardIcon),
                      label: const Text(BudgetPlannerStrings.loanEmis),
                      onPressed: onImportLoans,
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
