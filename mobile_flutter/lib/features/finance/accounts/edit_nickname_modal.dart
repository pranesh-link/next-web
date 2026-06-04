import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/account.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/app_modal.dart';

/// Bottom sheet modal to edit an account's nickname.
class EditNicknameModal extends ConsumerStatefulWidget {
  final Account account;
  final VoidCallback onSuccess;

  const EditNicknameModal({
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
      title: 'Edit Nickname',
      size: ModalSize.sm,
      child: EditNicknameModal(account: account, onSuccess: onSuccess),
    );
  }

  @override
  ConsumerState<EditNicknameModal> createState() => _EditNicknameModalState();
}

class _EditNicknameModalState extends ConsumerState<EditNicknameModal> {
  late final TextEditingController _controller;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.account.nickname ?? '');
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final value = _controller.text.trim();
    if (value.isEmpty) return;
    setState(() => _loading = true);

    // updateAccountData applies optimistic internally — modal closes immediately.
    final messenger = ScaffoldMessenger.of(context);
    widget.onSuccess();
    if (mounted) Navigator.pop(context);

    ref
        .read(accountsProvider.notifier)
        .updateAccountData(widget.account.id, {'nickname': value})
        .catchError((Object e) {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Nickname update failed. Please try again.'),
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
        AppInput(
          label: 'Nickname',
          hint: 'Enter new nickname',
          controller: _controller,
        ),
        const SizedBox(height: AppSpacing.xxl),
        AppButton(
          label: _loading ? 'Saving...' : 'Save',
          onPressed: _loading ? null : _submit,
        ),
      ],
    );
  }
}
