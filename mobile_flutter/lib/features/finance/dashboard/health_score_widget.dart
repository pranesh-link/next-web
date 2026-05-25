import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/insight.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'dart:math' as math;

/// Health score widget displayed on the finance dashboard.
class HealthScoreWidget extends ConsumerWidget {
  const HealthScoreWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final scoreAsync = ref.watch(healthScoreProvider);

    return scoreAsync.when(
      loading: () => const LoadingSkeleton(type: SkeletonType.card),
      error: (_, __) => const SizedBox.shrink(),
      data: (score) => _HealthScoreCard(score: score),
    );
  }
}

class _HealthScoreCard extends StatelessWidget {
  final HealthScore score;
  const _HealthScoreCard({required this.score});

  Color _scoreColor(BuildContext context) {
    if (score.score >= 80) return context.colors.success;
    if (score.score >= 60) return const Color(0xFFF59E0B);
    return context.colors.danger;
  }

  @override
  Widget build(BuildContext context) {
    final scoreColor = _scoreColor(context);
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SizedBox(
                width: 60,
                height: 60,
                child: CustomPaint(
                  painter: _ScoreRingPainter(
                    progress: score.score / 100,
                    color: scoreColor,
                    bgColor: context.colors.border,
                  ),
                  child: Center(
                    child: Text(
                      '${score.score}',
                      style: AppTypography.cardTitle.copyWith(
                        color: scoreColor,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Financial Health', style: AppTypography.cardTitle),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: scoreColor.withAlpha(25),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        score.rating,
                        style: AppTypography.xs.copyWith(
                          color: scoreColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _BreakdownRow(
            label: 'Savings Rate',
            value: '${score.breakdown.savingsRate.toStringAsFixed(0)}%',
            progress: score.breakdown.savingsRate / 100,
          ),
          const SizedBox(height: AppSpacing.sm),
          _BreakdownRow(
            label: 'Debt-to-Income',
            value: '${score.breakdown.debtToIncomeRatio.toStringAsFixed(0)}%',
            progress: (100 - score.breakdown.debtToIncomeRatio) / 100,
            invertColor: true,
          ),
          const SizedBox(height: AppSpacing.sm),
          _BreakdownRow(
            label: 'Emergency Fund',
            value: '${score.breakdown.emergencyFundMonths.toStringAsFixed(1)} mo',
            progress: math.min(score.breakdown.emergencyFundMonths / 6, 1.0),
          ),
          const SizedBox(height: AppSpacing.sm),
          _BreakdownRow(
            label: 'Budget Adherence',
            value: '${score.breakdown.budgetAdherence.toStringAsFixed(0)}%',
            progress: score.breakdown.budgetAdherence / 100,
          ),
        ],
      ),
    );
  }
}

class _BreakdownRow extends StatelessWidget {
  final String label;
  final String value;
  final double progress;
  final bool invertColor;

  const _BreakdownRow({
    required this.label,
    required this.value,
    required this.progress,
    this.invertColor = false,
  });

  Color _color(BuildContext context) {
    final p = invertColor ? 1 - progress : progress;
    if (p >= 0.7) return context.colors.success;
    if (p >= 0.4) return const Color(0xFFF59E0B);
    return context.colors.danger;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: Text(label, style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
        ),
        Expanded(
          flex: 3,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              backgroundColor: context.colors.border,
              color: _color(context),
              minHeight: 5,
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        SizedBox(
          width: 45,
          child: Text(value,
              style: AppTypography.xs.copyWith(fontWeight: FontWeight.w600),
              textAlign: TextAlign.right),
        ),
      ],
    );
  }
}

class _ScoreRingPainter extends CustomPainter {
  final double progress;
  final Color color;
  final Color bgColor;

  _ScoreRingPainter({required this.progress, required this.color, required this.bgColor});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 4;

    // Background ring
    canvas.drawCircle(
      center,
      radius,
      Paint()
        ..color = bgColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6,
    );

    // Progress arc
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _ScoreRingPainter old) =>
      old.progress != progress || old.color != color;
}
