import 'package:flutter/material.dart';

abstract final class AppColors {
  // Backgrounds — warm ivory-white base
  static const bg = Color(0xFFFAFAF7);
  static const bgElevated = Color(0xFFFFFFFF);
  static const surface = Color(0x076366F1);     // violet-tinted surface
  static const surfaceHover = Color(0x0D6366F1);

  // Inputs
  static const inputBg = Color(0xFFFDFCFF);     // barely-there violet tint

  // Borders — violet-tinted, not grey
  static const border = Color(0x1E6366F1);
  static const borderStrong = Color(0x336366F1);
  static const cardBorder = Color(0xFFE0E0FF);  // periwinkle

  // Text — near-black with blue undertone
  static const text = Color(0xFF0D0D1A);
  static const textDim = Color(0xFF3D3D52);     // purple-grey
  static const textMuted = Color(0xFF9090B0);   // muted violet-grey

  // Semantic — luminous jewel tones
  static const accent = Color(0xFF6366F1);      // indigo (was flat blue)
  static const success = Color(0xFF059669);     // emerald
  static const danger = Color(0xFFE11D48);      // vivid rose-red
  static const warning = Color(0xFFD97706);     // amber (unchanged)

  // Chart
  static const chartIncome = Color(0xFF10B981); // emerald
  static const chartExpense = Color(0xFFF43F5E); // rose
  static const chartSavings = Color(0xFF6366F1); // indigo

  // Gradient — indigo → violet (rich premium purple)
  static const gradientStart = Color(0xFF6366F1);
  static const gradientEnd = Color(0xFF8B5CF6);

  // Chart palette — luminous jewel tones
  static const chartPalette = [
    Color(0xFF6366F1), // indigo
    Color(0xFF10B981), // emerald
    Color(0xFF8B5CF6), // violet
    Color(0xFFF43F5E), // rose
    Color(0xFFF59E0B), // amber
    Color(0xFF06B6D4), // cyan
    Color(0xFFEC4899), // pink
    Color(0xFF14B8A6), // teal
    Color(0xFFF97316), // orange
    Color(0xFFA855F7), // purple
  ];
}

abstract final class AppColorsDark {
  // Backgrounds — OLED black + near-black elevation
  static const bg = Color(0xFF000000);          // pure OLED black
  static const bgElevated = Color(0xFF0F0F0F);  // near-black card surface
  static const surface = Color(0x0DFFFFFF);     // slight glow on black
  static const surfaceHover = Color(0x17FFFFFF);

  // Inputs
  static const inputBg = Color(0xFF0F0F0F);     // matches bgElevated

  // Borders — slightly stronger for legibility on black
  static const border = Color(0x1AFFFFFF);
  static const borderStrong = Color(0x2EFFFFFF);
  static const cardBorder = Color(0xFF1C1C1C);  // subtle dark outline

  // Text
  static const text = Color(0xFFF0F0FF);        // faintly cool white
  static const textDim = Color(0xFF9090C0);      // violet-grey
  static const textMuted = Color(0xFF6060A0);

  // Semantic — luminous on black
  static const accent = Color(0xFF818CF8);      // indigo-400 (glowing)
  static const success = Color(0xFF34D399);     // emerald-400
  static const danger = Color(0xFFFB7185);      // rose-400
  static const warning = Color(0xFFFBBF24);     // amber (unchanged)

  // Chart
  static const chartIncome = Color(0xFF34D399); // emerald-400
  static const chartExpense = Color(0xFFFB7185); // rose-400
  static const chartSavings = Color(0xFF818CF8); // indigo-400

  // Gradient — indigo-400 → violet-400 (glowing on black)
  static const gradientStart = Color(0xFF818CF8);
  static const gradientEnd = Color(0xFFA78BFA);

  // Chart palette — luminous jewel tones on black
  static const chartPalette = [
    Color(0xFF818CF8), // indigo-400
    Color(0xFF34D399), // emerald-400
    Color(0xFFA78BFA), // violet-400
    Color(0xFFFB7185), // rose-400
    Color(0xFFFBBF24), // amber-400
    Color(0xFF22D3EE), // cyan-400
    Color(0xFFF472B6), // pink-400
    Color(0xFF2DD4BF), // teal-400
    Color(0xFFFB923C), // orange-400
    Color(0xFFC084FC), // purple-400
  ];
}

