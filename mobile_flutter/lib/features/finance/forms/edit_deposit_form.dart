import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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

/// Bottom sheet form to edit an existing deposit.
class EditDepositForm extends ConsumerStatefulWidget {
  final Deposit deposit;
  const EditDepositForm({super.key, required this.deposit});

  static void show(BuildContext context, Deposit deposit) {
    AppModal.show(
      context: context,
      title: 'Edit Deposit',
      size: ModalSize.lg,
      child: EditDepositForm(deposit: deposit),
    );
  }

  @override
  ConsumerState<EditDepositForm> createState() => _EditDepositFormState();
}

class _EditDepositFormState extends ConsumerState<EditDepositForm> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _providerCtrl;
  late final TextEditingController _principalCtrl;
  late final TextEditingController _rateCtrl;
  late final TextEditingController _tenureCtrl;
  late final TextEditingController _installmentCtrl;
  late final TextEditingController _maturityCtrl;
  late final TextEditingController _paidCtrl;
  late String _type;
  late String _frequency;
  late String _status;
  bool _loading = false;
  String? _nameError;
  String? _principalError;
  String? _rateError;
  String? _tenureError;

  @override
  void initState() {
    super.initState();
    final d = widget.deposit;
    _nameCtrl = TextEditingController(text: d.name);
    _providerCtrl = TextEditingController(text: d.provider ?? '');
    _principalCtrl =
        TextEditingController(text: d.principalAmount.toStringAsFixed(0));
    _rateCtrl = TextEditingController(text: d.interestRate.toString());
    _tenureCtrl = TextEditingController(text: d.tenureMonths.toString());
    _installmentCtrl = TextEditingController(
        text: d.installmentAmount?.toStringAsFixed(0) ?? '');
    _maturityCtrl =
        TextEditingController(text: d.maturityAmount.toStringAsFixed(0));
    _paidCtrl = TextEditingController(text: d.paidInstallments.toString());
    _type = d.type;
    _frequency = d.installmentFrequency;
    _status = d.status;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _providerCtrl.dispose();
    _principalCtrl.dispose();
    _rateCtrl.dispose();
    _tenureCtrl.dispose();
    _installmentCtrl.dispose();
    _maturityCtrl.dispose();
    _paidCtrl.dispose();
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
      await ref.read(depositsProvider.notifier).updateDeposit(
            id: widget.deposit.id,
            name: _nameCtrl.text.trim(),
            provider: _providerCtrl.text.trim().isEmpty
                ? null
                : _providerCtrl.text.trim(),
            principalAmount: double.parse(_principalCtrl.text),
            interestRate: double.parse(_rateCtrl.text),
            tenureMonths: int.parse(_tenureCtrl.text),
            installmentAmount: double.tryParse(_installmentCtrl.text),
            installmentFrequency: _frequency,
            paidInstallments: int.tryParse(_paidCtrl.text),
            totalInstallments: _type == DepositType.recurringDeposit
                ? int.parse(_tenureCtrl.text)
                : null,
            maturityAmount: double.tryParse(_maturityCtrl.text),
            status: _status,
          );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Deposit updated')),
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
            label: 'Name', controller: _nameCtrl, error: _nameError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
            label: 'Provider', controller: _providerCtrl),
        const SizedBox(height: AppSpacing.lg),
        _buildDropdown('Type', _type, _depositTypes,
            (v) => setState(() => _type = v!)),
        const SizedBox(height: AppSpacing.lg),
        _buildDropdown('Status', _status,
            {'ACTIVE': 'Active', 'MATURED': 'Matured'},
            (v) => setState(() => _status = v!)),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
            label: 'Principal Amount',
            controller: _principalCtrl,
            keyboardType: TextInputType.number,
            error: _principalError),
        const SizedBox(height: AppSpacing.lg),
        Row(
          children: [
            Expanded(
              child: AppInput(
                  label: 'Rate %',
                  controller: _rateCtrl,
                  keyboardType: TextInputType.number,
                  error: _rateError),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: AppInput(
                  label: 'Tenure (months)',
                  controller: _tenureCtrl,
                  keyboardType: TextInputType.number,
                  error: _tenureError),
            ),
          ],
        ),
        if (isRD) ...[
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: AppInput(
                    label: 'Installment Amt',
                    controller: _installmentCtrl,
                    keyboardType: TextInputType.number),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: AppInput(
                    label: 'Paid Installments',
                    controller: _paidCtrl,
                    keyboardType: TextInputType.number),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          _buildDropdown('Frequency', _frequency, _frequencies,
              (v) => setState(() => _frequency = v!)),
        ],
        const SizedBox(height: AppSpacing.lg),
        AppInput(
            label: 'Maturity Amount',
            controller: _maturityCtrl,
            keyboardType: TextInputType.number),
        const SizedBox(height: AppSpacing.xl),
        AppButton(
            label: 'Save Changes',
            onPressed: _submit,
            isLoading: _loading,
            fullWidth: true),
      ],
    );
  }

  Widget _buildDropdown(String label, String value,
      Map<String, String> options, ValueChanged<String?> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border:
                OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
          ),
          items: options.entries
              .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
              .toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
