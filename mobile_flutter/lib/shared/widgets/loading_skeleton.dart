import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';

enum SkeletonType { card, list, chart }

class LoadingSkeleton extends StatelessWidget {
  final SkeletonType type;
  final int count;

  const LoadingSkeleton({super.key, this.type = SkeletonType.card, this.count = 3});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final baseColor = isDark ? const Color(0xFF2A2D37) : const Color(0xFFE5E7EB);
    final highlightColor = isDark ? const Color(0xFF3A3D47) : const Color(0xFFF8FAFC);
    final blockColor = context.colors.bgElevated;
    return ClipRect(
      child: Shimmer.fromColors(
        baseColor: baseColor,
        highlightColor: highlightColor,
        child: switch (type) {
          SkeletonType.card => _buildCards(blockColor),
          SkeletonType.list => _buildList(blockColor),
          SkeletonType.chart => _buildChart(blockColor),
        },
      ),
    );
  }

  Widget _buildCards(Color color) => Column(
    mainAxisSize: MainAxisSize.min,
    children: List.generate(count, (_) => Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Container(height: 120, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(16))),
    )),
  );

  Widget _buildList(Color color) => Column(
    mainAxisSize: MainAxisSize.min,
    children: List.generate(count, (_) => Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Container(height: 56, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(10))),
    )),
  );

  Widget _buildChart(Color color) => Container(height: 240, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(16)));
}
