import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:luvverse/core/theme/app_spacing.dart';

/// A single card-shaped shimmer placeholder.
class ShimmerCard extends StatelessWidget {
  final double height;
  final double borderRadius;

  const ShimmerCard({super.key, this.height = 120, this.borderRadius = 16});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: const Color(0xFFE5E7EB),
      highlightColor: const Color(0xFFF8FAFC),
      child: Container(
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
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
    return Shimmer.fromColors(
      baseColor: const Color(0xFFE5E7EB),
      highlightColor: const Color(0xFFF8FAFC),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(
          itemCount,
          (i) => Padding(
            padding: EdgeInsets.only(bottom: i < itemCount - 1 ? spacing : 0),
            child: Container(
              height: height,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
