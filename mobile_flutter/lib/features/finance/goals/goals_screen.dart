import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/goals/contribute_modal.dart';
import 'package:luvverse/features/finance/goals/edit_goal_form.dart';
import 'package:luvverse/features/finance/goals/goal_card.dart';
import 'package:luvverse/features/finance/forms/add_goal_form.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/goal.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';

final _currencyFormat =
    NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class GoalsScreen extends ConsumerWidget {
  const GoalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncGoals = ref.watch(goalsProvider);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              AppButton(
                label: 'Add Goal',
                icon: Icons.add,
                size: ButtonSize.sm,
                onPressed: () => AddGoalForm.show(context),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Expanded(
            child: asyncGoals.when(
              loading: () =>
                  const LoadingSkeleton(type: SkeletonType.card, count: 3),
              error: (e, _) => OfflineErrorState(
                error: e,
                onRetry: () => ref.read(goalsProvider.notifier).refresh(),
              ),
              data: (goals) => goals.isEmpty
                  ? EmptyState(
                      icon: Icons.flag,
                      title: 'No goals',
                      description: 'Set savings goals and track progress',
                      actionLabel: 'Create Goal',
                      onAction: () => AddGoalForm.show(context),
                    )
                  : _GoalsList(goals: goals),
            ),
          ),
        ],
      ),
    );
  }
}

class _GoalsList extends ConsumerWidget {
  final List<Goal> goals;
  const _GoalsList({required this.goals});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final totalGoals = goals.length;
    final totalSaved = goals.fold(0.0, (s, g) => s + g.currentAmount);
    final totalTarget = goals.fold(0.0, (s, g) => s + g.targetAmount);

    return RefreshIndicator(
      onRefresh: () => ref.read(goalsProvider.notifier).refresh(),
      child: ListView(
        children: [
          _SummaryRow(
            totalGoals: totalGoals,
            totalSaved: totalSaved,
            totalTarget: totalTarget,
          ),
          const SizedBox(height: AppSpacing.lg),
          ...goals.map(
            (g) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: GoalCard(
                goal: g,
                onEdit: () => EditGoalForm.show(context, g),
                onDelete: () => _confirmDelete(context, ref, g),
                onContribute: () => ContributeModal.show(context, g),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, Goal goal) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Goal'),
        content: Text('Delete "${goal.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(goalsProvider.notifier).delete(goal.id);
            },
            child: const Text('Delete', style: TextStyle(color: AppColors.danger)),
          ),
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final int totalGoals;
  final double totalSaved;
  final double totalTarget;
  const _SummaryRow({
    required this.totalGoals,
    required this.totalSaved,
    required this.totalTarget,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _SummaryCard(label: 'GOALS', value: totalGoals.toString()),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _SummaryCard(
            label: 'SAVED',
            value: _currencyFormat.format(totalSaved),
            color: AppColors.success,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _SummaryCard(
            label: 'TARGET',
            value: _currencyFormat.format(totalTarget),
          ),
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
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
            value,
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
