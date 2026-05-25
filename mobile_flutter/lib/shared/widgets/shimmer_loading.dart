import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';

/// Returns the (base, highlight) shimmer colors for the current brightness.
({Color base, Color highlight}) _shimmerColors(BuildContext context) {
  final isDark = Theme.of(context).brightness == Brightness.dark;
  if (isDark) {
    return (
      base: const Color(0xFF2A2D37),
      highlight: const Color(0xFF3A3D47),
    );
  }
  return (
    base: const Color(0xFFE5E7EB),
    highlight: const Color(0xFFF8FAFC),
  );
}

/// A single card-shaped shimmer placeholder.
class ShimmerCard extends StatelessWidget {
  final double height;
  final double borderRadius;

  const ShimmerCard({super.key, this.height = 120, this.borderRadius = 16});

  @override
  Widget build(BuildContext context) {
    final colors = _shimmerColors(context);
    return Shimmer.fromColors(
      baseColor: colors.base,
      highlightColor: colors.highlight,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: context.colors.bgElevated,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// Multiple card-shaped shimmer placeholders stacked vertically.
class ShimmerList extends StatelessWidget {
  final int itemCount;
  final double height;
  final double spacing;

  const ShimmerList({
    super.key,
    this.itemCount = 5,
    this.height = 72,
    this.spacing = AppSpacing.md,
  });

  @override
  Widget build(BuildContext context) {
    final colors = _shimmerColors(context);
    return Shimmer.fromColors(
      baseColor: colors.base,
      highlightColor: colors.highlight,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(
          itemCount,
          (i) => Padding(
            padding: EdgeInsets.only(bottom: i < itemCount - 1 ? spacing : 0),
            child: Container(
              height: height,
              decoration: BoxDecoration(
                color: context.colors.bgElevated,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
