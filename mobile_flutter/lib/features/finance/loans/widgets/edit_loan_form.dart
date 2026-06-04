import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/loan.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';

class EditLoanForm extends ConsumerStatefulWidget {
  final Loan loan;

  const EditLoanForm({super.key, required this.loan});

  static void show(BuildContext context, Loan loan) {
    AppModal.show(
      context: context,
      title: 'Edit Loan',
      size: ModalSize.lg,
      child: EditLoanForm(loan: loan),
    );
  }

  @override
  ConsumerState<EditLoanForm> createState() => _EditLoanFormState();
}

class _EditLoanFormState extends ConsumerState<EditLoanForm> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _principalCtrl;
  late final TextEditingController _rateCtrl;
  late final TextEditingController _tenureCtrl;
  late final TextEditingController _emiCtrl;
  late final TextEditingController _providerCtrl;
  late final TextEditingController _accountNumCtrl;
  late DateTime _startDate;
  bool _loading = false;
  String? _nameError;
  String? _principalError;
  String? _rateError;
  String? _tenureError;
  String? _emiError;

  @override
  void initState() {
    super.initState();
    final loan = widget.loan;
    _nameCtrl = TextEditingController(text: loan.name);
    _principalCtrl = TextEditingController(text: loan.principal.toStringAsFixed(0));
    _rateCtrl = TextEditingController(text: loan.interestRate.toString());
    _tenureCtrl = TextEditingController(text: loan.tenureMonths.toString());
    _emiCtrl = TextEditingController(text: loan.emiAmount.toStringAsFixed(0));
    _providerCtrl = TextEditingController(text: loan.loanProvider ?? '');
    _accountNumCtrl = TextEditingController(text: loan.loanAccountNumber ?? '');
    _startDate = loan.startDate;
  }

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

    final original = widget.loan;
    final patch = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'principal': double.parse(_principalCtrl.text),
      'interestRate': double.parse(_rateCtrl.text),
      'tenureMonths': int.parse(_tenureCtrl.text),
      'emiAmount': double.parse(_emiCtrl.text),
      'startDate': _startDate.toIso8601String(),
      if (_providerCtrl.text.trim().isNotEmpty) 'loanProvider': _providerCtrl.text.trim(),
      if (_accountNumCtrl.text.trim().isNotEmpty) 'loanAccountNumber': _accountNumCtrl.text.trim(),
    };

    // Optimistic update — dismiss modal immediately.
    ref.read(loansProvider.notifier).updateOptimistic(original.id, patch);
    final messenger = ScaffoldMessenger.of(context);
    if (mounted) Navigator.pop(context);

    // API fires in background; roll back on failure.
    ref
        .read(loansProvider.notifier)
        .updateLoan(
          id: original.id,
          name: _nameCtrl.text.trim(),
          principal: double.parse(_principalCtrl.text),
          interestRate: double.parse(_rateCtrl.text),
          tenureMonths: int.parse(_tenureCtrl.text),
          emiAmount: double.parse(_emiCtrl.text),
          startDate: _startDate,
          loanProvider: _providerCtrl.text.trim().isEmpty ? null : _providerCtrl.text.trim(),
          loanAccountNumber: _accountNumCtrl.text.trim().isEmpty ? null : _accountNumCtrl.text.trim(),
        )
        .catchError((Object e) {
      ref.read(loansProvider.notifier).updateOptimistic(original.id, original.toJson());
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Loan update failed. Please try again.'),
          duration: Duration(seconds: 5),
        ),
      );
    });
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
        AppButton(label: 'Update Loan', onPressed: _submit, isLoading: _loading, fullWidth: true),
      ],
    );
  }
}
