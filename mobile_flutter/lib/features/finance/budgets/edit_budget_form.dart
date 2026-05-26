import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/budget.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';

const _categories = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
  'Health', 'Education', 'Salary', 'Freelance', 'Investment', 'Gift', 'Other',
];

class EditBudgetForm extends ConsumerStatefulWidget {
  final Budget budget;
  const EditBudgetForm({super.key, required this.budget});

  static void show(BuildContext context, Budget budget) {
    AppModal.show(
      context: context,
      title: 'Edit Budget',
      size: ModalSize.md,
      child: EditBudgetForm(budget: budget),
    );
  }

  @override
  ConsumerState<EditBudgetForm> createState() => _EditBudgetFormState();
}

class _EditBudgetFormState extends ConsumerState<EditBudgetForm> {
  late final TextEditingController _limitCtrl;
  late String _category;
  late String _month;
  bool _loading = false;
  String? _limitError;

  @override
  void initState() {
    super.initState();
    _limitCtrl = TextEditingController(text: widget.budget.limit.toStringAsFixed(0));
    _category = widget.budget.category;
    _month = widget.budget.month;
  }

  @override
  void dispose() {
    _limitCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() {
      _limitError =
          double.tryParse(_limitCtrl.text) == null ? 'Enter a valid number' : null;
    });
    return _limitError == null;
  }

  Future<void> _pickMonth() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.parse('$_month-01'),
      firstDate: DateTime(2020),
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) {
      setState(() => _month = DateFormat('yyyy-MM').format(picked));
    }
  }

  Future<void> _submit() async {
    if (!_validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(budgetsProvider.notifier).updateBudget(
            id: widget.budget.id,
            category: _category,
            limit: double.parse(_limitCtrl.text),
            month: _month,
          );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Budget updated')),
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
        Text(
          'Category',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: context.colors.textDim,
          ),
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: _category,
          decoration: InputDecoration(
            filled: true,
            fillColor: context.colors.inputBg,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: context.colors.cardBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: context.colors.cardBorder),
            ),
          ),
          items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
          onChanged: (v) => setState(() => _category = v!),
        ),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
          label: 'Limit',
          hint: '0.00',
          controller: _limitCtrl,
          keyboardType: TextInputType.number,
          error: _limitError,
        ),
        const SizedBox(height: AppSpacing.lg),
        GestureDetector(
          onTap: _pickMonth,
          child: AbsorbPointer(
            child: AppInput(label: 'Month', hint: _month, readOnly: true),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        AppButton(
          label: 'Update Budget',
          onPressed: _submit,
          isLoading: _loading,
          fullWidth: true,
        ),
      ],
    );
  }
}
