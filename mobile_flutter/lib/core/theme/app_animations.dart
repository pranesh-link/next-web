import 'package:flutter/animation.dart';

abstract final class AppAnimations {
  static const easing = Cubic(0.16, 1.0, 0.3, 1.0);

  static const standard = Duration(milliseconds: 200);
  static const medium = Duration(milliseconds: 300);
  static const slow = Duration(milliseconds: 400);

  static const modalOverlay = Duration(milliseconds: 200);
  static const modalScale = Duration(milliseconds: 300);
  static const sidebar = Duration(milliseconds: 300);
  static const skeletonShimmer = Duration(milliseconds: 1500);
  static const spinner = Duration(milliseconds: 750);
}
