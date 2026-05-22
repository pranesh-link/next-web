import 'package:flutter/material.dart';

abstract final class AppSpacing {
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 12;
  static const double lg = 16;
  static const double xl = 20;
  static const double xxl = 24;
  static const double xxxl = 28;
  static const double xxxxl = 32;
  static const double xxxxxl = 40;

  // Page padding (horizontal, vertical)
  static const pagePaddingDesktop = EdgeInsets.symmetric(horizontal: 40, vertical: 24);
  static const pagePaddingTablet = EdgeInsets.symmetric(horizontal: 24, vertical: 16);
  static const pagePaddingMobile = EdgeInsets.symmetric(horizontal: 20, vertical: 12);
}
