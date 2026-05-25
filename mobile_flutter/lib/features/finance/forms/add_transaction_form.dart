import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';

const _categories = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
  'Health', 'Education', 'Salary', 'Freelance', 'Investment', 'Gift', 'Other',
];

class AddTransactionForm extends ConsumerStatefulWidget {
  const AddTransactionForm({super.key});

  static void show(BuildContext context) {
    AppModal.show(
      context: context,
      title: 'Add Transaction',
      size: ModalSize.lg,
      child: const AddTransactionForm(),
    );
  }

  @override
  ConsumerState<AddTransactionForm> createState() => _AddTransactionFormState();
}

class _AddTransactionFormState extends ConsumerState<AddTransactionForm> {
  final _amountCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _type = 'EXPENSE';
  String _category = 'Food';
  String? _accountId;
  DateTime _date = DateTime.now();
  bool _loading = false;
  String? _amountError;
  String? _accountError;

  @override
  void dispose() {
    _amountCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() {
      _amountError = double.tryParse(_amountCtrl.text) == null ? 'Enter a valid amount' : null;
      _accountError = _accountId == null ? 'Select an account' : null;
    });
    return _amountError == null && _accountError == null;
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _submit() async {
    if (!_validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(transactionsProvider.notifier).create(
            accountId: _accountId!,
            amount: double.parse(_amountCtrl.text),
            type: _type,
            category: _category,
            date: _date,
            description: _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
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
    final accounts = ref.watch(accountsProvider).valueOrNull ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppInput(label: 'Amount', hint: '0.00', controller: _amountCtrl, keyboardType: TextInputType.number, error: _amountError),
        const SizedBox(height: AppSpacing.lg),
        Text('Type', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: context.colors.textDim)),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(
              child: AppButton(
                label: 'Expense',
                variant: _type == 'EXPENSE' ? ButtonVariant.primary : ButtonVariant.secondary,
                size: ButtonSize.sm,
                onPressed: () => setState(() => _type = 'EXPENSE'),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: AppButton(
                label: 'Income',
                variant: _type == 'INCOME' ? ButtonVariant.primary : ButtonVariant.secondary,
                size: ButtonSize.sm,
                onPressed: () => setState(() => _type = 'INCOME'),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        _dropdown('Category', _category, _categories, (v) => setState(() => _category = v!)),
        const SizedBox(height: AppSpacing.lg),
        _dropdown('Account', _accountId, accounts.map((a) => a.id).toList(), (v) => setState(() => _accountId = v), labels: {for (final a in accounts) a.id: a.nickname ?? a.name}, error: _accountError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'Description (optional)', hint: 'Notes', controller: _descCtrl),
        const SizedBox(height: AppSpacing.lg),
        GestureDetector(
          onTap: _pickDate,
          child: AbsorbPointer(child: AppInput(label: 'Date', hint: DateFormat('yyyy-MM-dd').format(_date), readOnly: true)),
        ),
        const SizedBox(height: AppSpacing.xl),
        AppButton(label: 'Create Transaction', onPressed: _submit, isLoading: _loading, fullWidth: true),
      ],
    );
  }

  Widget _dropdown(String label, String? value, List<String> items, ValueChanged<String?> onChanged, {Map<String, String>? labels, String? error}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: context.colors.textDim)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: value,
          decoration: InputDecoration(
            filled: true, fillColor: context.colors.inputBg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.colors.cardBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: context.colors.cardBorder)),
            errorText: error,
          ),
          items: items.map((v) => DropdownMenuItem(value: v, child: Text(labels?[v] ?? v))).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
