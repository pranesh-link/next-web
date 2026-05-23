import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import 'package:luvverse/core/theme/app_spacing.dart';

enum SkeletonType { card, list, chart }

class LoadingSkeleton extends StatelessWidget {
  final SkeletonType type;
  final int count;

  const LoadingSkeleton({super.key, this.type = SkeletonType.card, this.count = 3});

  @override
  Widget build(BuildContext context) {
    return ClipRect(
      child: Shimmer.fromColors(
        baseColor: const Color(0xFFE5E7EB),
        highlightColor: const Color(0xFFF8FAFC),
        child: switch (type) {
          SkeletonType.card => _buildCards(),
          SkeletonType.list => _buildList(),
          SkeletonType.chart => _buildChart(),
        },
      ),
    );
  }

  Widget _buildCards() => Column(
    mainAxisSize: MainAxisSize.min,
    children: List.generate(count, (_) => Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.lg),
      child: Container(height: 120, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16))),
    )),
  );

  Widget _buildList() => Column(
    mainAxisSize: MainAxisSize.min,
    children: List.generate(count, (_) => Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Container(height: 56, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10))),
    )),
  );

  Widget _buildChart() => Container(height: 240, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)));
}
