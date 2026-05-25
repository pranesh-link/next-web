import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/trend_pill.dart';

class SummaryCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final IconData icon;
  final double? trendPercent;

  const SummaryCard({
    super.key,
    required this.title,
    required this.value,
    this.subtitle,
    required this.icon,
    this.trendPercent,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title.toUpperCase(), style: AppTypography.small.copyWith(color: context.colors.textMuted, letterSpacing: 1)),
                const SizedBox(height: AppSpacing.sm),
                Text(value, style: AppTypography.summaryValue.copyWith(color: context.colors.text)),
                if (trendPercent != null) ...[
                  const SizedBox(height: AppSpacing.sm),
                  TrendPill(percent: trendPercent!),
                ],
                if (subtitle != null) ...[
                  const SizedBox(height: AppSpacing.xs),
                  Text(subtitle!, style: AppTypography.small.copyWith(color: context.colors.textMuted)),
                ],
              ],
            ),
          ),
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: context.colors.accent.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: Icon(icon, size: 22, color: context.colors.accent),
          ),
        ],
      ),
    );
  }
}
