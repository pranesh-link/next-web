import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';

const _categories = [
  'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment',
  'Health', 'Education', 'Salary', 'Freelance', 'Investment', 'Gift', 'Other',
];

class AddBudgetForm extends ConsumerStatefulWidget {
  const AddBudgetForm({super.key});

  static void show(BuildContext context) {
    AppModal.show(
      context: context,
      title: 'Add Budget',
      size: ModalSize.md,
      child: const AddBudgetForm(),
    );
  }

  @override
  ConsumerState<AddBudgetForm> createState() => _AddBudgetFormState();
}

class _AddBudgetFormState extends ConsumerState<AddBudgetForm> {
  final _limitCtrl = TextEditingController();
  String _category = 'Food';
  late String _month;
  bool _loading = false;
  String? _limitError;

  @override
  void initState() {
    super.initState();
    _month = DateFormat('yyyy-MM').format(DateTime.now());
  }

  @override
  void dispose() {
    _limitCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() {
      _limitError = double.tryParse(_limitCtrl.text) == null ? 'Enter a valid number' : null;
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
      await ref.read(budgetsProvider.notifier).create(
            category: _category,
            limit: double.parse(_limitCtrl.text),
            month: _month,
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
        const Text('Category', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: _category,
          decoration: InputDecoration(
            filled: true, fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD1D5DB))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFD1D5DB))),
          ),
          items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
          onChanged: (v) => setState(() => _category = v!),
        ),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'Limit', hint: '0.00', controller: _limitCtrl, keyboardType: TextInputType.number, error: _limitError),
        const SizedBox(height: AppSpacing.lg),
        GestureDetector(
          onTap: _pickMonth,
          child: AbsorbPointer(child: AppInput(label: 'Month', hint: _month, readOnly: true)),
        ),
        const SizedBox(height: AppSpacing.xl),
        AppButton(label: 'Create Budget', onPressed: _submit, isLoading: _loading, fullWidth: true),
      ],
    );
  }
}
