import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/transaction.dart';

const _categories = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
  'Health', 'Education', 'Salary', 'Freelance', 'Investment', 'Gift', 'Other',
];

class EditTransactionForm extends ConsumerStatefulWidget {
  final Transaction transaction;

  const EditTransactionForm({super.key, required this.transaction});

  static void show(BuildContext context, Transaction transaction) {
    AppModal.show(
      context: context,
      title: 'Edit Transaction',
      size: ModalSize.lg,
      child: EditTransactionForm(transaction: transaction),
    );
  }

  @override
  ConsumerState<EditTransactionForm> createState() =>
      _EditTransactionFormState();
}

class _EditTransactionFormState extends ConsumerState<EditTransactionForm> {
  late final TextEditingController _amountCtrl;
  late final TextEditingController _descCtrl;
  late String _type;
  late String _category;
  late String _accountId;
  late DateTime _date;
  bool _loading = false;
  String? _amountError;

  @override
  void initState() {
    super.initState();
    final tx = widget.transaction;
    _amountCtrl = TextEditingController(text: tx.amount.toStringAsFixed(2));
    _descCtrl = TextEditingController(text: tx.description ?? '');
    _type = tx.type;
    _category = tx.category;
    _accountId = tx.accountId;
    _date = tx.date;
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() {
      _amountError = double.tryParse(_amountCtrl.text) == null
          ? 'Enter a valid amount'
          : null;
    });
    return _amountError == null;
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

    final original = widget.transaction;
    final patch = <String, dynamic>{
      'accountId': _accountId,
      'amount': double.parse(_amountCtrl.text),
      'type': _type,
      'category': _category,
      'date': _date.toIso8601String(),
      'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
    };

    // Optimistic update — dismiss modal immediately.
    ref.read(transactionsProvider.notifier).updateOptimistic(original.id, patch);
    final messenger = ScaffoldMessenger.of(context);
    if (mounted) Navigator.pop(context);

    // API fires in background; roll back on failure.
    ref
        .read(transactionsProvider.notifier)
        .updateTransaction(
          id: original.id,
          accountId: _accountId,
          amount: double.parse(_amountCtrl.text),
          type: _type,
          category: _category,
          date: _date,
          description:
              _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
        )
        .catchError((Object e) {
      ref.read(transactionsProvider.notifier).updateOptimistic(original.id, original.toJson());
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Transaction update failed. Please try again.'),
          duration: Duration(seconds: 5),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final accounts = ref.watch(accountsProvider).valueOrNull ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppInput(
          label: 'Amount',
          hint: '0.00',
          controller: _amountCtrl,
          keyboardType: TextInputType.number,
          error: _amountError,
        ),
        const SizedBox(height: AppSpacing.lg),
        const Text('Type',
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        Row(
          children: [
            Expanded(
              child: AppButton(
                label: 'Expense',
                variant: _type == 'EXPENSE'
                    ? ButtonVariant.primary
                    : ButtonVariant.secondary,
                size: ButtonSize.sm,
                onPressed: () => setState(() => _type = 'EXPENSE'),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: AppButton(
                label: 'Income',
                variant: _type == 'INCOME'
                    ? ButtonVariant.primary
                    : ButtonVariant.secondary,
                size: ButtonSize.sm,
                onPressed: () => setState(() => _type = 'INCOME'),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.lg),
        _dropdown('Category', _category, _categories,
            (v) => setState(() => _category = v!)),
        const SizedBox(height: AppSpacing.lg),
        _dropdown(
          'Account',
          _accountId,
          accounts.map((a) => a.id).toList(),
          (v) => setState(() => _accountId = v!),
          labels: {for (final a in accounts) a.id: a.nickname ?? a.name},
        ),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
            label: 'Description (optional)',
            hint: 'Notes',
            controller: _descCtrl),
        const SizedBox(height: AppSpacing.lg),
        GestureDetector(
          onTap: _pickDate,
          child: AbsorbPointer(
            child: AppInput(
              label: 'Date',
              hint: DateFormat('yyyy-MM-dd').format(_date),
              readOnly: true,
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        AppButton(
          label: 'Update Transaction',
          onPressed: _submit,
          isLoading: _loading,
          fullWidth: true,
        ),
      ],
    );
  }

  Widget _dropdown(String label, String? value, List<String> items,
      ValueChanged<String?> onChanged,
      {Map<String, String>? labels, String? error}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          initialValue: value,
          decoration: InputDecoration(
            filled: true,
            fillColor: context.colors.inputBg,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: context.colors.cardBorder)),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: context.colors.cardBorder)),
            errorText: error,
          ),
          items: items
              .map((v) => DropdownMenuItem(
                  value: v, child: Text(labels?[v] ?? v)))
              .toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }
}
