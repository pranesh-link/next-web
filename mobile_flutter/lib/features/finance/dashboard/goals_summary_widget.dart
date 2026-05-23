import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/goal.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/section_header.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

/// Shows total saved vs total target, progress, goal count.
class GoalsSummaryWidget extends ConsumerWidget {
  const GoalsSummaryWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goalsAsync = ref.watch(goalsProvider);

    return goalsAsync.when(
      loading: () => const LoadingSkeleton(type: SkeletonType.card),
      error: (_, __) => const SizedBox.shrink(),
      data: (goals) {
        if (goals.isEmpty) return const SizedBox.shrink();
        return _GoalsContent(goals: goals);
      },
    );
  }
}

class _GoalsContent extends StatelessWidget {
  final List<Goal> goals;
  const _GoalsContent({required this.goals});

  @override
  Widget build(BuildContext context) {
    final totalSaved = goals.fold(0.0, (sum, g) => sum + g.currentAmount);
    final totalTarget = goals.fold(0.0, (sum, g) => sum + g.targetAmount);
    final overallProgress = totalTarget > 0 ? totalSaved / totalTarget : 0.0;
    final completedCount = goals.where((g) => g.isComplete).length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Goals'),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withAlpha(20),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.flag_outlined, color: AppColors.accent, size: 20),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${_currencyFormat.format(totalSaved)} / ${_currencyFormat.format(totalTarget)}',
                          style: AppTypography.body.copyWith(fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '$completedCount of ${goals.length} goals completed',
                          style: AppTypography.xs.copyWith(color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: overallProgress.clamp(0.0, 1.0),
                  backgroundColor: AppColors.border,
                  color: AppColors.accent,
                  minHeight: 8,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                '${(overallProgress * 100).toStringAsFixed(0)}% overall progress',
                style: AppTypography.xs.copyWith(color: AppColors.textMuted),
              ),
              const SizedBox(height: AppSpacing.lg),
              ...goals.take(3).map((goal) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: _GoalRow(goal: goal),
                  )),
            ],
          ),
        ),
      ],
    );
  }
}

class _GoalRow extends StatelessWidget {
  final Goal goal;
  const _GoalRow({required this.goal});

  @override
  Widget build(BuildContext context) {
    final deadlineStr = goal.deadline != null
        ? DateFormat('MMM yyyy').format(goal.deadline!)
        : null;

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(goal.name, style: AppTypography.small.copyWith(fontWeight: FontWeight.w500)),
              if (deadlineStr != null)
                Text('Target: $deadlineStr', style: AppTypography.xs.copyWith(color: AppColors.textMuted)),
            ],
          ),
        ),
        Text(
          '${(goal.progress * 100).toStringAsFixed(0)}%',
          style: AppTypography.small.copyWith(
            fontWeight: FontWeight.w600,
            color: goal.isComplete ? AppColors.success : AppColors.accent,
          ),
        ),
      ],
    );
  }
}
