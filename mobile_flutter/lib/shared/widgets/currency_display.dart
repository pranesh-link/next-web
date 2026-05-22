import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_typography.dart';

class CurrencyDisplay extends StatelessWidget {
  final double amount;
  final bool colorCoded;
  final bool showSign;
  final TextStyle? style;

  const CurrencyDisplay({
    super.key,
    required this.amount,
    this.colorCoded = true,
    this.showSign = false,
    this.style,
  });

  static final _formatter = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

  @override
  Widget build(BuildContext context) {
    Color color = AppColors.text;
    if (colorCoded) {
      if (amount > 0) color = AppColors.success;
      if (amount < 0) color = AppColors.danger;
    }
    final prefix = showSign && amount > 0 ? '+' : '';
    final text = '$prefix${_formatter.format(amount)}';
    return Text(text, style: (style ?? AppTypography.summaryValue).copyWith(color: color));
  }
}
