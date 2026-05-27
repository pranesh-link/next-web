import 'package:intl/intl.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/account.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';

/// Bottom sheet modal to add income (increment balance) on salary accounts.
class AddIncomeModal extends ConsumerStatefulWidget {
  final Account account;
  final VoidCallback onSuccess;

  const AddIncomeModal({
    super.key,
    required this.account,
    required this.onSuccess,
  });

  static void show({
    required BuildContext context,
    required Account account,
    required VoidCallback onSuccess,
  }) {
    AppModal.show(
      context: context,
      title: 'Add Income',
      size: ModalSize.md,
      child: AddIncomeModal(account: account, onSuccess: onSuccess),
    );
  }

  @override
  ConsumerState<AddIncomeModal> createState() => _AddIncomeModalState();
}

class _AddIncomeModalState extends ConsumerState<AddIncomeModal> {
  final _amountCtrl = TextEditingController();
  late final TextEditingController _noteCtrl;
  bool _loading = false;
  String? _error;
  String? _noteError;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _noteCtrl = TextEditingController(
      text: 'Salary ${DateFormat('MMMM yyyy').format(now)}',
    );
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  /// Retry API call with exponential backoff.
  Future<T> _retryApiCall<T>(
    Future<T> Function() apiCall, {
    int maxAttempts = 3,
  }) async {
    for (int attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await apiCall();
      } catch (e) {
        if (attempt == maxAttempts) rethrow;
        await Future.delayed(Duration(seconds: attempt));
      }
    }
    throw Exception('Max retries exceeded');
  }

  Future<void> _submit() async {
    final amount = double.tryParse(_amountCtrl.text.trim());
    final note = _noteCtrl.text.trim();
    if (amount == null || amount <= 0) {
      setState(() => _error = 'Enter a valid amount');
      return;
    }
    if (note.isEmpty) {
      setState(() => _noteError = 'Note is required');
      return;
    }
    setState(() {
      _error = null;
      _noteError = null;
      _loading = true;
    });

    // Store original balance for rollback
    final originalBalance = widget.account.balance;
    final newBalance = originalBalance + amount;

    try {
      // Optimistic update: UI updates immediately
      ref.read(accountsProvider.notifier).updateAccountOptimistic(
        widget.account.id,
        {'balance': newBalance},
      );

      // API call with retry in background
      final data = <String, dynamic>{'balance': newBalance, 'note': note};
      await _retryApiCall(() =>
        ref.read(accountsProvider.notifier).updateAccountData(
          widget.account.id,
          data,
        ),
      );

      widget.onSuccess();
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Income added')),
        );
      }
    } catch (e) {
      // Rollback on failure after retries
      ref.read(accountsProvider.notifier).revertAccountOptimistic(
        widget.account.id,
        {'balance': originalBalance},
      );
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
        AppInput(
          label: 'Income Amount',
          hint: 'Enter amount to add',
          controller: _amountCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          error: _error,
        ),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
          label: 'Note',
          hint: 'e.g. Salary, Freelance',
          controller: _noteCtrl,
          error: _noteError,
        ),
        const SizedBox(height: AppSpacing.xxl),
        AppButton(
          label: _loading ? 'Adding...' : 'Add Income',
          onPressed: _loading ? null : _submit,
        ),
      ],
    );
  }
}
