import 'package:flutter/material.dart';

abstract final class AppColors {
  // Backgrounds
  static const bg = Color(0xFFF8FAFC);
  static const bgElevated = Color(0xFFFFFFFF);
  static const surface = Color(0x08000000);
  static const surfaceHover = Color(0x0D000000);

  // Inputs
  static const inputBg = Color(0xFFFFFFFF);

  // Borders
  static const border = Color(0x1A000000);
  static const borderStrong = Color(0x26000000);
  static const cardBorder = Color(0xFFE5E7EB);

  // Text
  static const text = Color(0xFF1A1A2E);
  static const textDim = Color(0xFF52525B);
  static const textMuted = Color(0xFF94A3B8);

  // Semantic
  static const accent = Color(0xFF3B82F6);
  static const success = Color(0xFF16A34A);
  static const danger = Color(0xFFDC2626);
  static const warning = Color(0xFFD97706);

  // Chart
  static const chartIncome = Color(0xFF22C55E);
  static const chartExpense = Color(0xFFEF4444);
  static const chartSavings = Color(0xFF3B82F6);

  // Gradient endpoints
  static const gradientStart = Color(0xFF3B82F6);
  static const gradientEnd = Color(0xFF06B6D4);

  // Chart palette
  static const chartPalette = [
    Color(0xFF3B82F6),
    Color(0xFF22C55E),
    Color(0xFFF59E0B),
    Color(0xFFEF4444),
    Color(0xFF8B5CF6),
    Color(0xFF06B6D4),
    Color(0xFFEC4899),
    Color(0xFFF97316),
    Color(0xFF14B8A6),
    Color(0xFFA855F7),
  ];
}

abstract final class AppColorsDark {
  // Backgrounds
  static const bg = Color(0xFF0F1117);
  static const bgElevated = Color(0xFF1A1D27);
  static const surface = Color(0x0AFFFFFF);
  static const surfaceHover = Color(0x14FFFFFF);

  // Inputs
  static const inputBg = Color(0xFF1A1D27);

  // Borders
  static const border = Color(0x14FFFFFF);
  static const borderStrong = Color(0x26FFFFFF);
  static const cardBorder = Color(0xFF2A2D37);

  // Text
  static const text = Color(0xFFE4E4E7);
  static const textDim = Color(0xFFA1A1AA);
  static const textMuted = Color(0xFF71717A);

  // Semantic
  static const accent = Color(0xFF60A5FA);
  static const success = Color(0xFF4ADE80);
  static const danger = Color(0xFFF87171);
  static const warning = Color(0xFFFBBF24);

  // Chart
  static const chartIncome = Color(0xFF4ADE80);
  static const chartExpense = Color(0xFFF87171);
  static const chartSavings = Color(0xFF60A5FA);

  // Gradient endpoints
  static const gradientStart = Color(0xFF60A5FA);
  static const gradientEnd = Color(0xFF22D3EE);

  // Chart palette
  static const chartPalette = [
    Color(0xFF60A5FA),
    Color(0xFF4ADE80),
    Color(0xFFFBBF24),
    Color(0xFFF87171),
    Color(0xFFA78BFA),
    Color(0xFF22D3EE),
    Color(0xFFF472B6),
    Color(0xFFFB923C),
    Color(0xFF2DD4BF),
    Color(0xFFC084FC),
  ];
}
