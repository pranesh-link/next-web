import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/account.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';

/// Bottom sheet modal to update an account's balance.
class UpdateBalanceModal extends ConsumerStatefulWidget {
  final Account account;
  final VoidCallback onSuccess;

  const UpdateBalanceModal({
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
      title: 'Update Balance',
      size: ModalSize.md,
      child: UpdateBalanceModal(account: account, onSuccess: onSuccess),
    );
  }

  @override
  ConsumerState<UpdateBalanceModal> createState() =>
      _UpdateBalanceModalState();
}

class _UpdateBalanceModalState extends ConsumerState<UpdateBalanceModal> {
  late final TextEditingController _balanceCtrl;
  final _noteCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _balanceCtrl = TextEditingController(
      text: widget.account.balance.toStringAsFixed(2),
    );
  }

  @override
  void dispose() {
    _balanceCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final parsed = double.tryParse(_balanceCtrl.text.trim());
    if (parsed == null) {
      setState(() => _error = 'Enter a valid number');
      return;
    }
    setState(() {
      _error = null;
      _loading = true;
    });
    try {
      final data = <String, dynamic>{'balance': parsed};
      final note = _noteCtrl.text.trim();
      if (note.isNotEmpty) data['note'] = note;
      await ref.read(accountsProvider.notifier).updateAccountData(
        widget.account.id,
        data,
      );
      widget.onSuccess();
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Balance updated')),
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
        AppInput(
          label: 'New Balance',
          hint: 'Enter amount',
          controller: _balanceCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          error: _error,
        ),
        const SizedBox(height: AppSpacing.lg),
        AppInput(
          label: 'Note (optional)',
          hint: 'Reason for update',
          controller: _noteCtrl,
        ),
        const SizedBox(height: AppSpacing.xxl),
        AppButton(
          label: _loading ? 'Saving...' : 'Update',
          onPressed: _loading ? null : _submit,
        ),
      ],
    );
  }
}
