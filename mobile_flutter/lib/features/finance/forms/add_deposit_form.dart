import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/deposit.dart';

const _depositTypes = {
  'RECURRING_DEPOSIT': 'Recurring Deposit',
  'FIXED_DEPOSIT': 'Fixed Deposit',
};

const _frequencies = {
  'MONTHLY': 'Monthly',
  'QUARTERLY': 'Quarterly',
  'HALF_YEARLY': 'Half Yearly',
  'YEARLY': 'Yearly',
};

/// Form to create a new deposit instrument (FD/RD).
class AddDepositForm extends ConsumerStatefulWidget {
  const AddDepositForm({super.key});

  static void show(BuildContext context) {
    AppModal.show(
      context: context,
      title: 'Add Deposit',
      size: ModalSize.lg,
      child: const AddDepositForm(),
    );
  }

  @override
  ConsumerState<AddDepositForm> createState() => _AddDepositFormState();
}

class _AddDepositFormState extends ConsumerState<AddDepositForm> {
  final _nameCtrl = TextEditingController();
  final _providerCtrl = TextEditingController();
  final _principalCtrl = TextEditingController();
  final _rateCtrl = TextEditingController();
  final _tenureCtrl = TextEditingController();
  final _installmentCtrl = TextEditingController();
  final _maturityCtrl = TextEditingController();
  String _type = DepositType.recurringDeposit;
  String _frequency = DepositInstallmentFrequency.monthly;
  bool _loading = false;
  String? _nameError;
  String? _principalError;
  String? _rateError;
  String? _tenureError;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _providerCtrl.dispose();
    _principalCtrl.dispose();
    _rateCtrl.dispose();
    _tenureCtrl.dispose();
    _installmentCtrl.dispose();
    _maturityCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() {
      _nameError = _nameCtrl.text.trim().isEmpty ? 'Name required' : null;
      _principalError = double.tryParse(_principalCtrl.text) == null
          ? 'Enter valid amount'
          : null;
      _rateError =
          double.tryParse(_rateCtrl.text) == null ? 'Enter valid rate' : null;
      _tenureError =
          int.tryParse(_tenureCtrl.text) == null ? 'Enter months' : null;
    });
    return _nameError == null &&
        _principalError == null &&
        _rateError == null &&
        _tenureError == null;
  }

  Future<void> _submit() async {
    if (!_validate()) return;
    setState(() => _loading = true);
    try {
      final tenure = int.parse(_tenureCtrl.text);
      final startDate = DateTime.now();
      final maturityDate =
          DateTime(startDate.year, startDate.month + tenure, startDate.day);
      final maturityAmount =
          double.tryParse(_maturityCtrl.text) ?? double.parse(_principalCtrl.text);

      await ref.read(depositsProvider.notifier).create(
            name: _nameCtrl.text.trim(),
            type: _type,
            principalAmount: double.parse(_principalCtrl.text),
            interestRate: double.parse(_rateCtrl.text),
            tenureMonths: tenure,
            startDate: startDate,
            maturityDate: maturityDate,
            maturityAmount: maturityAmount,
            provider: _providerCtrl.text.trim().isEmpty
                ? null
                : _providerCtrl.text.trim(),
            installmentAmount: double.tryParse(_installmentCtrl.text),
            installmentFrequency: _frequency,
            totalInstallments:
                _type == DepositType.recurringDeposit ? tenure : null,
          );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Deposit created')),
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
    final isRD = _type == DepositType.recurringDeposit;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppInput(
            label: 'Name', hint: 'e.g. SBI RD', controller: _nameCtrl, error: _nameError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
            label: 'Provider (optional)', hint: 'Bank name', controller: _providerCtrl),
        const SizedBox(height: AppSpacing.lg),
        const Text('Type',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: _type,
          decoration: InputDecoration(
            filled: true,
            fillColor: context.colors.inputBg,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
          items: _depositTypes.entries
              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
              .toList(),
          onChanged: (v) => setState(() => _type = v!),
        ),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
            label: 'Principal Amount',
            hint: '0',
            controller: _principalCtrl,
            keyboardType: TextInputType.number,
            error: _principalError),
        const SizedBox(height: AppSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AppInput(
                  label: 'Rate %',
                  hint: '6.5',
                  controller: _rateCtrl,
                  keyboardType: TextInputType.number,
                  error: _rateError),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: AppInput(
                  label: 'Tenure (months)',
                  hint: '60',
                  controller: _tenureCtrl,
                  keyboardType: TextInputType.number,
                  error: _tenureError),
            ),
          ],
        ),
        if (isRD) ...[
          const SizedBox(height: AppSpacing.lg),
          AppInput(
              label: 'Installment Amount',
              hint: '5000',
              controller: _installmentCtrl,
              keyboardType: TextInputType.number),
          const SizedBox(height: AppSpacing.lg),
          const Text('Frequency',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: _frequency,
            decoration: InputDecoration(
              filled: true,
              fillColor: context.colors.inputBg,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              border:
                  OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            ),
            items: _frequencies.entries
                .map(
                    (e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                .toList(),
            onChanged: (v) => setState(() => _frequency = v!),
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        AppInput(
            label: 'Maturity Amount (optional)',
            hint: 'Auto-calculated if blank',
            controller: _maturityCtrl,
            keyboardType: TextInputType.number),
        const SizedBox(height: AppSpacing.xl),
        AppButton(
            label: 'Create Deposit',
            onPressed: _submit,
            isLoading: _loading,
            fullWidth: true),
      ],
    );
  }
}
