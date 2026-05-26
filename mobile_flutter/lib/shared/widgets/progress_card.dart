import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/shared/widgets/app_card.dart';

class ProgressCard extends StatelessWidget {
  final String title;
  final double current;
  final double target;
  final String? deadline;

  const ProgressCard({
    super.key,
    required this.title,
    required this.current,
    required this.target,
    this.deadline,
  });

  double get _progress => target > 0 ? (current / target).clamp(0.0, 1.5) : 0;
  bool get _isOver => _progress > 1.0;

  @override
  Widget build(BuildContext context) {
    final percent = (_progress * 100).toStringAsFixed(0);
    final badgeColor = _isOver ? context.colors.danger : context.colors.accent;

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: Text(title, style: AppTypography.label.copyWith(color: context.colors.text))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: badgeColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(9999)),
                child: Text('$percent%', style: AppTypography.small.copyWith(color: badgeColor, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: SizedBox(
              height: 4,
              child: Stack(
                children: [
                  Container(color: context.colors.surface),
                  FractionallySizedBox(
                    widthFactor: _progress.clamp(0.0, 1.0),
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [context.colors.gradientStart, context.colors.gradientEnd]),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('₹${current.toStringAsFixed(0)}', style: AppTypography.small.copyWith(color: context.colors.textDim)),
              Text('₹${target.toStringAsFixed(0)}', style: AppTypography.small.copyWith(color: context.colors.textMuted)),
            ],
          ),
          if (deadline != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(deadline!, style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
          ],
        ],
      ),
    );
  }
}
