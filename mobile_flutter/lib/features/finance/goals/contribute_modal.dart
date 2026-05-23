import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/goal.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';

final _currencyFormat =
    NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

class ContributeModal extends ConsumerStatefulWidget {
  final Goal goal;
  const ContributeModal({super.key, required this.goal});

  static void show(BuildContext context, Goal goal) {
    AppModal.show(
      context: context,
      title: 'Contribute to Goal',
      size: ModalSize.sm,
      child: ContributeModal(goal: goal),
    );
  }

  @override
  ConsumerState<ContributeModal> createState() => _ContributeModalState();
}

class _ContributeModalState extends ConsumerState<ContributeModal> {
  final _amountCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _amountCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    final amount = double.tryParse(_amountCtrl.text);
    setState(() {
      if (amount == null || amount <= 0) {
        _error = 'Enter a valid positive amount';
      } else {
        _error = null;
      }
    });
    return _error == null;
  }

  Future<void> _submit() async {
    if (!_validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(goalsProvider.notifier).contribute(
            id: widget.goal.id,
            amount: double.parse(_amountCtrl.text),
          );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Contribution added')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final goal = widget.goal;
    final remaining = goal.targetAmount - goal.currentAmount;
    final percent = (goal.progress * 100).toStringAsFixed(0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(goal.name, style: AppTypography.cardTitle),
        const SizedBox(height: AppSpacing.sm),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${_currencyFormat.format(goal.currentAmount)} / ${_currencyFormat.format(goal.targetAmount)}',
              style: AppTypography.small,
            ),
            Text('$percent%', style: AppTypography.body.copyWith(color: AppColors.accent)),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: goal.progress.clamp(0.0, 1.0),
            backgroundColor: AppColors.bgElevated,
            color: AppColors.accent,
            minHeight: 6,
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          '${_currencyFormat.format(remaining > 0 ? remaining : 0)} remaining',
          style: AppTypography.small.copyWith(color: AppColors.textMuted),
        ),
        const SizedBox(height: AppSpacing.xl),
        AppInput(
          label: 'Amount',
          hint: '0.00',
          controller: _amountCtrl,
          keyboardType: TextInputType.number,
          error: _error,
        ),
        const SizedBox(height: AppSpacing.xl),
        AppButton(
          label: 'Contribute',
          onPressed: _submit,
          isLoading: _loading,
          fullWidth: true,
        ),
      ],
    );
  }
}
