import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';

class AddLoanForm extends ConsumerStatefulWidget {
  const AddLoanForm({super.key});

  static void show(BuildContext context) {
    AppModal.show(
      context: context,
      title: 'Add Loan',
      size: ModalSize.lg,
      child: const AddLoanForm(),
    );
  }

  @override
  ConsumerState<AddLoanForm> createState() => _AddLoanFormState();
}

class _AddLoanFormState extends ConsumerState<AddLoanForm> {
  final _nameCtrl = TextEditingController();
  final _principalCtrl = TextEditingController();
  final _rateCtrl = TextEditingController();
  final _tenureCtrl = TextEditingController();
  final _emiCtrl = TextEditingController();
  final _providerCtrl = TextEditingController();
  final _accountNumCtrl = TextEditingController();
  DateTime _startDate = DateTime.now();
  bool _loading = false;
  String? _nameError;
  String? _principalError;
  String? _rateError;
  String? _tenureError;
  String? _emiError;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _principalCtrl.dispose();
    _rateCtrl.dispose();
    _tenureCtrl.dispose();
    _emiCtrl.dispose();
    _providerCtrl.dispose();
    _accountNumCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() {
      _nameError = _nameCtrl.text.trim().isEmpty ? 'Name is required' : null;
      _principalError = double.tryParse(_principalCtrl.text) == null ? 'Enter a valid number' : null;
      _rateError = double.tryParse(_rateCtrl.text) == null ? 'Enter a valid rate' : null;
      _tenureError = int.tryParse(_tenureCtrl.text) == null ? 'Enter valid months' : null;
      _emiError = double.tryParse(_emiCtrl.text) == null ? 'Enter a valid amount' : null;
    });
    return _nameError == null && _principalError == null && _rateError == null && _tenureError == null && _emiError == null;
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime(2010),
      lastDate: DateTime(2040),
    );
    if (picked != null) setState(() => _startDate = picked);
  }

  Future<void> _submit() async {
    if (!_validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(loansProvider.notifier).createLoan(
            name: _nameCtrl.text.trim(),
            principal: double.parse(_principalCtrl.text),
            interestRate: double.parse(_rateCtrl.text),
            tenureMonths: int.parse(_tenureCtrl.text),
            emiAmount: double.parse(_emiCtrl.text),
            startDate: _startDate,
            loanProvider: _providerCtrl.text.trim().isEmpty ? null : _providerCtrl.text.trim(),
            loanAccountNumber: _accountNumCtrl.text.trim().isEmpty ? null : _accountNumCtrl.text.trim(),
          );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Created successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppInput(label: 'Name', hint: 'Loan name', controller: _nameCtrl, error: _nameError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'Principal', hint: '0.00', controller: _principalCtrl, keyboardType: TextInputType.number, error: _principalError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'Interest Rate (%)', hint: '7.5', controller: _rateCtrl, keyboardType: TextInputType.number, error: _rateError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'Tenure (months)', hint: '36', controller: _tenureCtrl, keyboardType: TextInputType.number, error: _tenureError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'EMI Amount', hint: '0.00', controller: _emiCtrl, keyboardType: TextInputType.number, error: _emiError),
        const SizedBox(height: AppSpacing.lg),
        GestureDetector(
          onTap: _pickDate,
          child: AbsorbPointer(child: AppInput(label: 'Start Date', hint: DateFormat('yyyy-MM-dd').format(_startDate), readOnly: true)),
        ),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'Loan Provider (optional)', hint: 'Bank name', controller: _providerCtrl),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'Account Number (optional)', hint: 'XXXX-XXXX', controller: _accountNumCtrl),
        const SizedBox(height: AppSpacing.xl),
        AppButton(label: 'Create Loan', onPressed: _submit, isLoading: _loading, fullWidth: true),
      ],
    );
  }
}
