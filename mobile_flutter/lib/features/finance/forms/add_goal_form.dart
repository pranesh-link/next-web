import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';

class AddGoalForm extends ConsumerStatefulWidget {
  const AddGoalForm({super.key});

  static void show(BuildContext context) {
    AppModal.show(
      context: context,
      title: 'Add Goal',
      size: ModalSize.md,
      child: const AddGoalForm(),
    );
  }

  @override
  ConsumerState<AddGoalForm> createState() => _AddGoalFormState();
}

class _AddGoalFormState extends ConsumerState<AddGoalForm> {
  final _nameCtrl = TextEditingController();
  final _targetCtrl = TextEditingController();
  final _currentCtrl = TextEditingController(text: '0');
  DateTime? _deadline;
  bool _loading = false;
  String? _nameError;
  String? _targetError;
  String? _currentError;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _targetCtrl.dispose();
    _currentCtrl.dispose();
    super.dispose();
  }

  bool _validate() {
    setState(() {
      _nameError = _nameCtrl.text.trim().isEmpty ? 'Name is required' : null;
      _targetError = double.tryParse(_targetCtrl.text) == null ? 'Enter a valid amount' : null;
      _currentError = _currentCtrl.text.isNotEmpty && double.tryParse(_currentCtrl.text) == null
          ? 'Enter a valid number'
          : null;
    });
    return _nameError == null && _targetError == null && _currentError == null;
  }

  Future<void> _pickDeadline() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _deadline ?? DateTime.now().add(const Duration(days: 365)),
      firstDate: DateTime.now(),
      lastDate: DateTime(2040),
    );
    if (picked != null) setState(() => _deadline = picked);
  }

  Future<void> _submit() async {
    if (!_validate()) return;
    setState(() => _loading = true);
    try {
      await ref.read(goalsProvider.notifier).create(
            name: _nameCtrl.text.trim(),
            targetAmount: double.parse(_targetCtrl.text),
            currentAmount: _currentCtrl.text.isEmpty ? 0 : double.parse(_currentCtrl.text),
            deadline: _deadline,
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
        AppInput(label: 'Name', hint: 'Goal name', controller: _nameCtrl, error: _nameError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'Target Amount', hint: '0.00', controller: _targetCtrl, keyboardType: TextInputType.number, error: _targetError),
        const SizedBox(height: AppSpacing.lg),
        AppInput(label: 'Current Amount', hint: '0', controller: _currentCtrl, keyboardType: TextInputType.number, error: _currentError),
        const SizedBox(height: AppSpacing.lg),
        GestureDetector(
          onTap: _pickDeadline,
          child: AbsorbPointer(
            child: AppInput(
              label: 'Deadline (optional)',
              hint: _deadline != null ? DateFormat('yyyy-MM-dd').format(_deadline!) : 'Select date',
              readOnly: true,
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        AppButton(label: 'Create Goal', onPressed: _submit, isLoading: _loading, fullWidth: true),
      ],
    );
  }
}
