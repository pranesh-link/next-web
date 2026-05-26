import 'package:flutter/material.dart';
import 'app_colors.dart';

/// ThemeExtension holding all custom LuvVerse colors.
class LuvVerseColors extends ThemeExtension<LuvVerseColors> {
  final Color text;
  final Color textDim;
  final Color textMuted;
  final Color bg;
  final Color bgElevated;
  final Color surface;
  final Color surfaceHover;
  final Color inputBg;
  final Color border;
  final Color borderStrong;
  final Color cardBorder;
  final Color accent;
  final Color success;
  final Color danger;
  final Color warning;
  final Color chartIncome;
  final Color chartExpense;
  final Color chartSavings;
  final Color gradientStart;
  final Color gradientEnd;
  final List<Color> chartPalette;

  const LuvVerseColors({
    required this.text,
    required this.textDim,
    required this.textMuted,
    required this.bg,
    required this.bgElevated,
    required this.surface,
    required this.surfaceHover,
    required this.inputBg,
    required this.border,
    required this.borderStrong,
    required this.cardBorder,
    required this.accent,
    required this.success,
    required this.danger,
    required this.warning,
    required this.chartIncome,
    required this.chartExpense,
    required this.chartSavings,
    required this.gradientStart,
    required this.gradientEnd,
    required this.chartPalette,
  });

  static const light = LuvVerseColors(
    text: AppColors.text,
    textDim: AppColors.textDim,
    textMuted: AppColors.textMuted,
    bg: AppColors.bg,
    bgElevated: AppColors.bgElevated,
    surface: AppColors.surface,
    surfaceHover: AppColors.surfaceHover,
    inputBg: AppColors.inputBg,
    border: AppColors.border,
    borderStrong: AppColors.borderStrong,
    cardBorder: AppColors.cardBorder,
    accent: AppColors.accent,
    success: AppColors.success,
    danger: AppColors.danger,
    warning: AppColors.warning,
    chartIncome: AppColors.chartIncome,
    chartExpense: AppColors.chartExpense,
    chartSavings: AppColors.chartSavings,
    gradientStart: AppColors.gradientStart,
    gradientEnd: AppColors.gradientEnd,
    chartPalette: AppColors.chartPalette,
  );

  static const dark = LuvVerseColors(
    text: AppColorsDark.text,
    textDim: AppColorsDark.textDim,
    textMuted: AppColorsDark.textMuted,
    bg: AppColorsDark.bg,
    bgElevated: AppColorsDark.bgElevated,
    surface: AppColorsDark.surface,
    surfaceHover: AppColorsDark.surfaceHover,
    inputBg: AppColorsDark.inputBg,
    border: AppColorsDark.border,
    borderStrong: AppColorsDark.borderStrong,
    cardBorder: AppColorsDark.cardBorder,
    accent: AppColorsDark.accent,
    success: AppColorsDark.success,
    danger: AppColorsDark.danger,
    warning: AppColorsDark.warning,
    chartIncome: AppColorsDark.chartIncome,
    chartExpense: AppColorsDark.chartExpense,
    chartSavings: AppColorsDark.chartSavings,
    gradientStart: AppColorsDark.gradientStart,
    gradientEnd: AppColorsDark.gradientEnd,
    chartPalette: AppColorsDark.chartPalette,
  );

  @override
  LuvVerseColors copyWith({
    Color? text,
    Color? textDim,
    Color? textMuted,
    Color? bg,
    Color? bgElevated,
    Color? surface,
    Color? surfaceHover,
    Color? inputBg,
    Color? border,
    Color? borderStrong,
    Color? cardBorder,
    Color? accent,
    Color? success,
    Color? danger,
    Color? warning,
    Color? chartIncome,
    Color? chartExpense,
    Color? chartSavings,
    Color? gradientStart,
    Color? gradientEnd,
    List<Color>? chartPalette,
  }) {
    return LuvVerseColors(
      text: text ?? this.text,
      textDim: textDim ?? this.textDim,
      textMuted: textMuted ?? this.textMuted,
      bg: bg ?? this.bg,
      bgElevated: bgElevated ?? this.bgElevated,
      surface: surface ?? this.surface,
      surfaceHover: surfaceHover ?? this.surfaceHover,
      inputBg: inputBg ?? this.inputBg,
      border: border ?? this.border,
      borderStrong: borderStrong ?? this.borderStrong,
      cardBorder: cardBorder ?? this.cardBorder,
      accent: accent ?? this.accent,
      success: success ?? this.success,
      danger: danger ?? this.danger,
      warning: warning ?? this.warning,
      chartIncome: chartIncome ?? this.chartIncome,
      chartExpense: chartExpense ?? this.chartExpense,
      chartSavings: chartSavings ?? this.chartSavings,
      gradientStart: gradientStart ?? this.gradientStart,
      gradientEnd: gradientEnd ?? this.gradientEnd,
      chartPalette: chartPalette ?? this.chartPalette,
    );
  }

  @override
  LuvVerseColors lerp(LuvVerseColors? other, double t) {
    if (other == null) return this;
    return LuvVerseColors(
      text: Color.lerp(text, other.text, t)!,
      textDim: Color.lerp(textDim, other.textDim, t)!,
      textMuted: Color.lerp(textMuted, other.textMuted, t)!,
      bg: Color.lerp(bg, other.bg, t)!,
      bgElevated: Color.lerp(bgElevated, other.bgElevated, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceHover: Color.lerp(surfaceHover, other.surfaceHover, t)!,
      inputBg: Color.lerp(inputBg, other.inputBg, t)!,
      border: Color.lerp(border, other.border, t)!,
      borderStrong: Color.lerp(borderStrong, other.borderStrong, t)!,
      cardBorder: Color.lerp(cardBorder, other.cardBorder, t)!,
      accent: Color.lerp(accent, other.accent, t)!,
      success: Color.lerp(success, other.success, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
      chartIncome: Color.lerp(chartIncome, other.chartIncome, t)!,
      chartExpense: Color.lerp(chartExpense, other.chartExpense, t)!,
      chartSavings: Color.lerp(chartSavings, other.chartSavings, t)!,
      gradientStart: Color.lerp(gradientStart, other.gradientStart, t)!,
      gradientEnd: Color.lerp(gradientEnd, other.gradientEnd, t)!,
      chartPalette: List.generate(
        light.chartPalette.length,
        (i) => Color.lerp(chartPalette[i], other.chartPalette[i], t)!,
      ),
    );
  }
}

/// Convenience extension for accessing LuvVerse colors from BuildContext.
extension LuvVerseColorsExtension on BuildContext {
  LuvVerseColors get colors => Theme.of(this).extension<LuvVerseColors>()!;
}
