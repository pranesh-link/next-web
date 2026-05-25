import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/budgets/budget_card.dart';
import 'package:luvverse/features/finance/budgets/edit_budget_form.dart';
import 'package:luvverse/features/finance/forms/add_budget_form.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/budget.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';

final _currencyFormat =
    NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class BudgetsScreen extends ConsumerWidget {
  const BudgetsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedMonth = ref.watch(selectedMonthProvider);
    final asyncBudgets = ref.watch(budgetsProvider);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          Row(
            children: [
              _MonthSelector(
                current: selectedMonth,
                onChanged: (m) =>
                    ref.read(selectedMonthProvider.notifier).state = m,
              ),
              const Spacer(),
              AppButton(
                label: 'Add',
                icon: Icons.add,
                size: ButtonSize.sm,
                onPressed: () => AddBudgetForm.show(context),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Expanded(
            child: asyncBudgets.when(
              loading: () =>
                  const LoadingSkeleton(type: SkeletonType.card, count: 3),
              error: (e, _) => OfflineErrorState(
                error: e,
                onRetry: () => ref.read(budgetsProvider.notifier).refresh(),
              ),
              data: (budgets) => budgets.isEmpty
                  ? EmptyState(
                      icon: Icons.pie_chart,
                      title: 'No budgets',
                      description: 'Set spending limits by category',
                      actionLabel: 'Create Budget',
                      onAction: () => AddBudgetForm.show(context),
                    )
                  : _BudgetsList(budgets: budgets),
            ),
          ),
        ],
      ),
    );
  }
}

class _BudgetsList extends ConsumerWidget {
  final List<Budget> budgets;
  const _BudgetsList({required this.budgets});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final totalBudgeted = budgets.fold(0.0, (s, b) => s + b.limit);
    final totalSpent = budgets.fold(0.0, (s, b) => s + (b.spent ?? 0));
    final totalRemaining = totalBudgeted - totalSpent;

    return RefreshIndicator(
      onRefresh: () => ref.read(budgetsProvider.notifier).refresh(),
      child: ListView(
        children: [
          _SummaryRow(
            budgeted: totalBudgeted,
            spent: totalSpent,
            remaining: totalRemaining,
          ),
          const SizedBox(height: AppSpacing.lg),
          ...budgets.map(
            (b) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: BudgetCard(
                budget: b,
                onEdit: () => EditBudgetForm.show(context, b),
                onDelete: () => _confirmDelete(context, ref, b),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, Budget budget) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Budget'),
        content: Text('Delete "${budget.category}" budget?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(budgetsProvider.notifier).delete(budget.id);
            },
            child: const Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final double budgeted;
  final double spent;
  final double remaining;
  const _SummaryRow({
    required this.budgeted,
    required this.spent,
    required this.remaining,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _SummaryCard(label: 'BUDGETED', value: budgeted)),
        const SizedBox(width: AppSpacing.sm),
        Expanded(child: _SummaryCard(label: 'SPENT', value: spent, color: AppColors.danger)),
        const SizedBox(width: AppSpacing.sm),
        Expanded(child: _SummaryCard(label: 'REMAINING', value: remaining, color: AppColors.success)),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final double value;
  final Color? color;
  const _SummaryCard({required this.label, required this.value, this.color});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        children: [
          Text(label, style: AppTypography.xs),
          const SizedBox(height: AppSpacing.xs),
          Text(
            _currencyFormat.format(value),
            style: AppTypography.bodyMedium.copyWith(
              color: color ?? AppColors.text,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _MonthSelector extends StatelessWidget {
  final String current;
  final ValueChanged<String> onChanged;
  const _MonthSelector({required this.current, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final date = DateTime.parse('$current-01');
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: () {
            final prev = DateTime(date.year, date.month - 1);
            onChanged('${prev.year}-${prev.month.toString().padLeft(2, '0')}');
          },
        ),
        Text(DateFormat('MMM yyyy').format(date), style: AppTypography.cardTitle),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: () {
            final next = DateTime(date.year, date.month + 1);
            onChanged('${next.year}-${next.month.toString().padLeft(2, '0')}');
          },
        ),
      ],
    );
  }
}
