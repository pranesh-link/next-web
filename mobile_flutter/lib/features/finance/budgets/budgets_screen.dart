import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/budget.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/features/finance/forms/add_budget_form.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

class BudgetsScreen extends ConsumerWidget {
  const BudgetsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncBudgets = ref.watch(budgetsProvider);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [AppButton(label: 'Add Budget', icon: Icons.add, size: ButtonSize.sm, onPressed: () => AddBudgetForm.show(context))],
          ),
          const SizedBox(height: AppSpacing.lg),
          Expanded(
            child: asyncBudgets.when(
              loading: () => const LoadingSkeleton(type: SkeletonType.card, count: 3),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (budgets) => budgets.isEmpty
                  ? EmptyState(
                      icon: Icons.pie_chart,
                      title: 'No budgets',
                      description: 'Set spending limits by category',
                      actionLabel: 'Create Budget',
                      onAction: () => AddBudgetForm.show(context),
                    )
                  : ListView.separated(
                      itemCount: budgets.length,
                      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
                      itemBuilder: (_, i) => _buildBudgetCard(budgets[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBudgetCard(Budget budget) {
    final spent = budget.spent ?? 0;
    final progress = budget.progress.clamp(0.0, 1.0);
    final isOver = budget.isOverBudget;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(budget.category, style: AppTypography.cardTitle),
              Text(
                '${_currencyFormat.format(spent)} / ${_currencyFormat.format(budget.limit)}',
                style: AppTypography.small,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppColors.bgElevated,
              color: isOver ? AppColors.danger : AppColors.accent,
              minHeight: 8,
            ),
          ),
          if (isOver) ...[
            const SizedBox(height: AppSpacing.xs),
            Text('Over budget!', style: AppTypography.small.copyWith(color: AppColors.danger)),
          ],
        ],
      ),
    );
  }
}
