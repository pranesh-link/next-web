import 'package:flutter/material.dart';

extension ContextExtensions on BuildContext {
  double get screenWidth => MediaQuery.sizeOf(this).width;
  double get screenHeight => MediaQuery.sizeOf(this).height;
  bool get isMobile => screenWidth < 480;
  bool get isTablet => screenWidth >= 480 && screenWidth < 1024;
  EdgeInsets get viewPadding => MediaQuery.viewPaddingOf(this);
}

extension StringExtensions on String {
  String get capitalize => isEmpty ? this : '${this[0].toUpperCase()}${substring(1)}';
}

extension DoubleExtensions on double {
  String toCompactCurrency() {
    if (abs() >= 10000000) return '₹${(this / 10000000).toStringAsFixed(2)}Cr';
    if (abs() >= 100000) return '₹${(this / 100000).toStringAsFixed(2)}L';
    if (abs() >= 1000) return '₹${(this / 1000).toStringAsFixed(1)}K';
    return '₹${toStringAsFixed(2)}';
  }
}
