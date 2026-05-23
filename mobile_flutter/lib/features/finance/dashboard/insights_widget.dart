import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/insight.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';

/// Dashboard alerts and insights widget.
class InsightsWidget extends ConsumerWidget {
  const InsightsWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final insightsAsync = ref.watch(dashboardInsightsProvider);

    return insightsAsync.when(
      loading: () => const LoadingSkeleton(type: SkeletonType.card),
      error: (_, __) => const SizedBox.shrink(),
      data: (insights) => _InsightsContent(insights: insights),
    );
  }
}

class _InsightsContent extends StatelessWidget {
  final DashboardInsights insights;
  const _InsightsContent({required this.insights});

  @override
  Widget build(BuildContext context) {
    if (insights.alerts.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...insights.alerts.take(3).map((alert) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: _AlertCard(alert: alert),
            )),
      ],
    );
  }
}

class _AlertCard extends StatelessWidget {
  final DashboardAlert alert;
  const _AlertCard({required this.alert});

  IconData get _icon {
    switch (alert.severity) {
      case 'warning':
        return Icons.warning_amber_rounded;
      case 'error':
        return Icons.error_outline;
      case 'success':
        return Icons.check_circle_outline;
      default:
        return Icons.info_outline;
    }
  }

  Color get _color {
    switch (alert.severity) {
      case 'warning':
        return const Color(0xFFF59E0B);
      case 'error':
        return AppColors.danger;
      case 'success':
        return AppColors.success;
      default:
        return AppColors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: alert.actionUrl != null
          ? () => context.go(alert.actionUrl!)
          : null,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: _color.withAlpha(20),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(_icon, color: _color, size: 20),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Text(
              alert.message,
              style: AppTypography.small,
            ),
          ),
          if (alert.actionUrl != null)
            Icon(Icons.chevron_right, color: AppColors.textMuted, size: 20),
        ],
      ),
    );
  }
}

/// Monthly trends mini chart (bar-style).
class MonthlyTrendsWidget extends ConsumerWidget {
  const MonthlyTrendsWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final insightsAsync = ref.watch(dashboardInsightsProvider);

    return insightsAsync.when(
      loading: () => const LoadingSkeleton(type: SkeletonType.chart),
      error: (_, __) => const SizedBox.shrink(),
      data: (insights) {
        if (insights.monthlyTrends.isEmpty) return const SizedBox.shrink();
        return _TrendsChart(trends: insights.monthlyTrends);
      },
    );
  }
}

class _TrendsChart extends StatelessWidget {
  final List<MonthlyTrend> trends;
  const _TrendsChart({required this.trends});

  @override
  Widget build(BuildContext context) {
    final maxVal = trends.fold(
        0.0, (m, t) => [m, t.income, t.expenses].reduce((a, b) => a > b ? a : b));

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Monthly Trends', style: AppTypography.cardTitle),
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            height: 120,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: trends.take(6).map((t) {
                final incomeH = maxVal > 0 ? (t.income / maxVal) * 100 : 0.0;
                final expenseH = maxVal > 0 ? (t.expenses / maxVal) * 100 : 0.0;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Container(
                              width: 8,
                              height: incomeH,
                              decoration: BoxDecoration(
                                color: AppColors.success,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            const SizedBox(width: 2),
                            Container(
                              width: 8,
                              height: expenseH,
                              decoration: BoxDecoration(
                                color: AppColors.danger,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          t.month.substring(5),
                          style: AppTypography.xs.copyWith(color: AppColors.textDim),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _Legend(color: AppColors.success, label: 'Income'),
              const SizedBox(width: AppSpacing.lg),
              _Legend(color: AppColors.danger, label: 'Expense'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  const _Legend({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 10, height: 10, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 4),
        Text(label, style: AppTypography.xs),
      ],
    );
  }
}
