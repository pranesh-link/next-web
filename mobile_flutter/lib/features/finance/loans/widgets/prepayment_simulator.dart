import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/models/loan.dart';

final _fmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class PrepaymentSimulator extends StatefulWidget {
  final Loan loan;

  const PrepaymentSimulator({super.key, required this.loan});

  @override
  State<PrepaymentSimulator> createState() => _PrepaymentSimulatorState();
}

class _PrepaymentSimulatorState extends State<PrepaymentSimulator> {
  final _controller = TextEditingController();
  double? _monthsSaved;
  double? _interestSaved;

  void _calculate() {
    final amount = double.tryParse(_controller.text);
    if (amount == null || amount <= 0 || widget.loan.emiAmount <= 0) {
      setState(() {
        _monthsSaved = null;
        _interestSaved = null;
      });
      return;
    }

    final monthsSaved = amount / widget.loan.emiAmount;
    final monthlyRate = widget.loan.interestRate / 12 / 100;
    final interestSaved = monthsSaved * widget.loan.remainingBalance * monthlyRate;

    setState(() {
      _monthsSaved = monthsSaved;
      _interestSaved = interestSaved;
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.bgElevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Prepayment Simulator', style: AppTypography.sectionTitle),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Enter an amount to see how much time and interest you could save.',
            style: AppTypography.small.copyWith(color: AppColors.textMuted),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _controller,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    hintText: 'Enter amount (₹)',
                    hintStyle: AppTypography.small.copyWith(color: AppColors.textMuted),
                    filled: true,
                    fillColor: AppColors.bg,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: AppColors.border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide(color: AppColors.border),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                  ),
                  onChanged: (_) => _calculate(),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              ElevatedButton(
                onPressed: _calculate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
                ),
                child: const Text('Calculate'),
              ),
            ],
          ),
          if (_monthsSaved != null && _interestSaved != null) ...[
            const SizedBox(height: AppSpacing.lg),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.success.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      children: [
                        Text('~${_monthsSaved!.toStringAsFixed(1)}', style: AppTypography.cardTitle.copyWith(color: AppColors.success)),
                        Text('months saved', style: AppTypography.xs.copyWith(color: AppColors.textMuted)),
                      ],
                    ),
                  ),
                  Container(width: 1, height: 36, color: AppColors.border),
                  Expanded(
                    child: Column(
                      children: [
                        Text(_fmt.format(_interestSaved!), style: AppTypography.cardTitle.copyWith(color: AppColors.success)),
                        Text('interest saved', style: AppTypography.xs.copyWith(color: AppColors.textMuted)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
