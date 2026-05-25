import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/budget.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/section_header.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

/// Shows top budgets with progress bars and on-track summary.
class BudgetsStatusWidget extends ConsumerWidget {
  const BudgetsStatusWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final budgetsAsync = ref.watch(budgetsProvider);

    return budgetsAsync.when(
      loading: () => const LoadingSkeleton(type: SkeletonType.card),
      error: (_, __) => const SizedBox.shrink(),
      data: (budgets) {
        if (budgets.isEmpty) return const SizedBox.shrink();
        return _BudgetsContent(budgets: budgets);
      },
    );
  }
}

class _BudgetsContent extends StatelessWidget {
  final List<Budget> budgets;
  const _BudgetsContent({required this.budgets});

  @override
  Widget build(BuildContext context) {
    final onTrack = budgets.where((b) => !b.isOverBudget).length;
    final sorted = [...budgets]..sort((a, b) => b.progress.compareTo(a.progress));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Budgets'),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: context.colors.success.withAlpha(20),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '$onTrack of ${budgets.length} on track',
                      style: AppTypography.xs.copyWith(
                        color: context.colors.success,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.lg),
              ...sorted.take(5).map((budget) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.md),
                    child: _BudgetRow(budget: budget),
                  )),
            ],
          ),
        ),
      ],
    );
  }
}

class _BudgetRow extends StatelessWidget {
  final Budget budget;
  const _BudgetRow({required this.budget});

  Color _progressColor(BuildContext context) {
    if (budget.isOverBudget) return context.colors.danger;
    if (budget.progress > 0.8) return const Color(0xFFF59E0B);
    return context.colors.success;
  }

  @override
  Widget build(BuildContext context) {
    final spent = budget.spent ?? 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(budget.category, style: AppTypography.small.copyWith(fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
            const SizedBox(width: AppSpacing.sm),
            Flexible(
              child: Text(
                '${_currencyFormat.format(spent)} / ${_currencyFormat.format(budget.limit)}',
                style: AppTypography.xs.copyWith(color: context.colors.textMuted),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: LinearProgressIndicator(
            value: budget.progress.clamp(0.0, 1.0),
            backgroundColor: context.colors.border,
            color: _progressColor(context),
            minHeight: 6,
          ),
        ),
      ],
    );
  }
}
