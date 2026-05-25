import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';

/// Empty state shown when no budget plan items exist.
class PlannerEmptyState extends StatelessWidget {
  final VoidCallback onAdd;
  const PlannerEmptyState({super.key, required this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.event_note_outlined,
                size: 56, color: AppColors.textMuted.withAlpha(100)),
            const SizedBox(height: AppSpacing.lg),
            Text(
              'No plans yet',
              style:
                  AppTypography.cardTitle.copyWith(color: AppColors.textMuted),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Start planning your month',
              style: AppTypography.small.copyWith(color: AppColors.textMuted),
            ),
            const SizedBox(height: AppSpacing.xl),
            FilledButton.icon(
              onPressed: onAdd,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add first item'),
            ),
          ],
        ),
      ),
    );
  }
}
