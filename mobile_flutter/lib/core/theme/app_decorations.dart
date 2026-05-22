import 'package:flutter/material.dart';
import 'app_colors.dart';

abstract final class AppRadii {
  static const double sm = 6;
  static const double md = 8;
  static const double lg = 10;
  static const double xl = 12;
  static const double xxl = 16;
  static const double full = 9999;
}

abstract final class AppShadows {
  static const cardHover = [
    BoxShadow(
      offset: Offset(0, 8),
      blurRadius: 24,
      color: Color(0x143B82F6),
    ),
  ];

  static const buttonHover = [
    BoxShadow(
      offset: Offset(0, 4),
      blurRadius: 12,
      color: Color(0x403B82F6),
    ),
  ];

  static const modal = [
    BoxShadow(
      offset: Offset(0, 20),
      blurRadius: 60,
      color: Color(0x1F000000),
    ),
    BoxShadow(
      offset: Offset(0, 4),
      blurRadius: 16,
      color: Color(0x0F000000),
    ),
  ];

  static const tooltip = [
    BoxShadow(
      offset: Offset(0, 8),
      blurRadius: 32,
      color: Color(0x1F000000),
    ),
  ];
}

abstract final class AppGradients {
  static const primary = LinearGradient(
    begin: Alignment(-0.7, -0.7),
    end: Alignment(0.7, 0.7),
    colors: [AppColors.gradientStart, AppColors.gradientEnd],
  );

  static const progress = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [AppColors.gradientStart, AppColors.gradientEnd],
  );
}

abstract final class AppDecorations {
  static final card = BoxDecoration(
    color: AppColors.bgElevated,
    border: Border.all(color: AppColors.cardBorder),
    borderRadius: BorderRadius.circular(AppRadii.xxl),
  );

  static final cardHover = BoxDecoration(
    color: AppColors.bgElevated,
    border: Border.all(color: AppColors.cardBorder),
    borderRadius: BorderRadius.circular(AppRadii.xxl),
    boxShadow: AppShadows.cardHover,
  );
}
