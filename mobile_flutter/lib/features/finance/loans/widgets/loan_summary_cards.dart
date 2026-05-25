import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/models/loan.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class LoanSummaryCards extends StatelessWidget {
  final List<Loan> loans;

  const LoanSummaryCards({super.key, required this.loans});

  @override
  Widget build(BuildContext context) {
    final totalOutstanding = loans.fold(0.0, (sum, l) => sum + l.remainingBalance);
    final monthlyEmi = loans.fold(0.0, (sum, l) => sum + l.emiAmount);

    return Row(
      children: [
        _SummaryCard(label: 'Total Loans', value: '${loans.length}', icon: Icons.receipt_long),
        const SizedBox(width: AppSpacing.sm),
        _SummaryCard(label: 'Outstanding', value: _currencyFormat.format(totalOutstanding), icon: Icons.account_balance),
        const SizedBox(width: AppSpacing.sm),
        _SummaryCard(label: 'Monthly EMI', value: _currencyFormat.format(monthlyEmi), icon: Icons.calendar_month),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _SummaryCard({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: context.colors.bgElevated,
          border: Border.all(color: context.colors.border),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 18, color: context.colors.accent),
            const SizedBox(height: AppSpacing.xs),
            Text(value, style: AppTypography.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(label, style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
          ],
        ),
      ),
    );
  }
}
