import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';

const _accountTypes = {
  'SAVINGS_ACCOUNT': 'Savings Account',
  'CREDIT_ACCOUNT': 'Credit Account',
  'CREDIT_CARD': 'Credit Card',
  'RECURRING_DEPOSIT': 'Recurring Deposit',
  'FIXED_DEPOSIT': 'Fixed Deposit',
};

class AddAccountForm extends ConsumerStatefulWidget {
  const AddAccountForm({super.key});

  static void show(BuildContext context) {
    AppModal.show(
      context: context,
      title: 'Add Account',
      size: ModalSize.md,
      child: const AddAccountForm(),
    );
  }

  @override
  ConsumerState<AddAccountForm> createState() => _AddAccountFormState();
}

class _AddAccountFormState extends ConsumerState<AddAccountForm> {
  final _nameCtrl = TextEditingController();
  final _nicknameCtrl = TextEditingController();
  final _balanceCtrl = TextEditingController();
  String _type = 'SAVINGS_ACCOUNT';
  bool _loading = false;
  String? _nameError;
  String? _balanceError;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _nicknameCtrl.dispose();
    _balanceCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() {
      _nameError = _nameCtrl.text.trim().isEmpty ? 'Name is required' : null;
      _balanceError = double.tryParse(_balanceCtrl.text) == null
          ? 'Enter a valid number'
          : null;
    });
    return _nameError == null && _balanceError == null;
  }

  Future<void> _submit() async {
    if (!_validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(accountsProvider.notifier).create(
            name: _nameCtrl.text.trim(),
            type: _type,
            balance: double.parse(_balanceCtrl.text),
            nickname: _nicknameCtrl.text.trim().isEmpty
                ? null
                : _nicknameCtrl.text.trim(),
          );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Created successfully')),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppInput(label: 'Name', hint: 'Account name', controller: _nameCtrl, error: _nameError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'Nickname (optional)', hint: 'Short label', controller: _nicknameCtrl),
        const SizedBox(height: AppSpacing.lg),
        Text('Type', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: context.colors.textDim)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: _type,
          decoration: InputDecoration(
            filled: true,
            fillColor: context.colors.inputBg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.colors.cardBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.colors.cardBorder)),
          ),
          items: _accountTypes.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
          onChanged: (v) => setState(() => _type = v!),
        ),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'Balance', hint: '0.00', controller: _balanceCtrl, keyboardType: TextInputType.number, error: _balanceError),
        const SizedBox(height: AppSpacing.xl),
        AppButton(label: 'Create Account', onPressed: _submit, isLoading: _loading, fullWidth: true),
      ],
    );
  }
}
