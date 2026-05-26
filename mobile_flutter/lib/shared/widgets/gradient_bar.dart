import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';

class GradientBar extends StatelessWidget {
  final double width;
  final double height;

  const GradientBar({super.key, this.width = 3, this.height = 20});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(2),
        gradient: LinearGradient(
          begin: Alignment(-0.7, -0.7),
          end: Alignment(0.7, 0.7),
          colors: [context.colors.gradientStart, context.colors.gradientEnd],
        ),
      ),
    );
  }
}
