import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_typography.dart';

class TrendPill extends StatelessWidget {
  final double percent;

  const TrendPill({super.key, required this.percent});

  bool get _isPositive => percent >= 0;

  @override
  Widget build(BuildContext context) {
    final color = _isPositive ? AppColors.success : AppColors.danger;
    final icon = _isPositive ? Icons.trending_up : Icons.trending_down;
    final text = '${_isPositive ? '+' : ''}${percent.toStringAsFixed(1)}%';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(9999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(text, style: AppTypography.small.copyWith(color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
