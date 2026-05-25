import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final bool showAccentBar;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.showAccentBar = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: padding ?? const EdgeInsets.all(AppSpacing.xxl),
        decoration: BoxDecoration(
          color: context.colors.bgElevated,
          border: Border.all(color: context.colors.cardBorder),
          borderRadius: BorderRadius.circular(16),
        ),
        child: showAccentBar
            ? Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 3,
                    height: 20,
                    margin: const EdgeInsets.only(right: AppSpacing.md),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(2),
                      gradient: LinearGradient(
                        begin: Alignment(-0.7, -0.7),
                        end: Alignment(0.7, 0.7),
                        colors: [context.colors.gradientStart, context.colors.gradientEnd],
                      ),
                    ),
                  ),
                  Expanded(child: child),
                ],
              )
            : child,
      ),
    );
  }
}
