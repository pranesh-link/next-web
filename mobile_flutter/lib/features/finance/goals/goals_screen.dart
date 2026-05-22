import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/goal.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/features/finance/forms/add_goal_form.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

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
            children: [AppButton(label: 'Add Goal', icon: Icons.add, size: ButtonSize.sm, onPressed: () => AddGoalForm.show(context)),],
          ),
          const SizedBox(height: AppSpacing.lg),
          Expanded(
            child: asyncGoals.when(
              loading: () => const LoadingSkeleton(type: SkeletonType.card, count: 3),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (goals) => goals.isEmpty
                  ? EmptyState(
                      icon: Icons.flag,
                      title: 'No goals',
                      description: 'Set savings goals and track progress',
                      actionLabel: 'Create Goal',
                      onAction: () => AddGoalForm.show(context),
                    )
                  : ListView.separated(
                      itemCount: goals.length,
                      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
                      itemBuilder: (_, i) => _buildGoalCard(goals[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGoalCard(Goal goal) {
    final progress = goal.progress.clamp(0.0, 1.0);
    final percent = (progress * 100).toStringAsFixed(0);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(child: Text(goal.name, style: AppTypography.cardTitle)),
              Text('$percent%', style: AppTypography.body.copyWith(color: AppColors.accent)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppColors.bgElevated,
              color: goal.isComplete ? AppColors.success : AppColors.accent,
              minHeight: 8,
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '${_currencyFormat.format(goal.currentAmount)} / ${_currencyFormat.format(goal.targetAmount)}',
            style: AppTypography.small,
          ),
          if (goal.deadline != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Deadline: ${DateFormat('dd MMM yyyy').format(goal.deadline!)}',
              style: AppTypography.small.copyWith(color: AppColors.textMuted),
            ),
          ],
        ],
      ),
    );
  }
}
