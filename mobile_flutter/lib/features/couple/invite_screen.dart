import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/router/pending_invite_provider.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/chat/services/chat_key_bootstrap.dart';
import 'package:luvverse/features/couple/couple_status_provider.dart';
import 'package:luvverse/features/finance/repositories/couple_repository.dart';
import 'package:luvverse/shared/widgets/app_button.dart';

final _inviteRepoProvider = Provider<CoupleRepository>((ref) {
  return CoupleRepository(ref.read(apiClientProvider));
});

class InviteScreen extends ConsumerStatefulWidget {
  final String token;

  const InviteScreen({super.key, required this.token});

  @override
  ConsumerState<InviteScreen> createState() => _InviteScreenState();
}

class _InviteScreenState extends ConsumerState<InviteScreen> {
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    // Clear any stored pending token — user dismissed or completed the invite.
    // Guard with try/catch: dispose() may be called after the provider scope
    // is torn down during hot-restart or fast widget removal.
    try {
      ref.read(pendingInviteTokenProvider.notifier).state = null;
    } catch (_) {}
    super.dispose();
  }

  Future<void> _accept() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(_inviteRepoProvider).acceptInvite(token: widget.token);
      // Bootstrap E2E keys immediately so the husband can derive the shared
      // secret as soon as his COUPLE_FORMED push arrives.
      await ref.read(chatKeyBootstrapProvider).ensureBootstrapped().catchError((_) => false);
      // Invalidate couple state so Chat tab appears and couple management refreshes
      ref.invalidate(hasCoupleProvider);
      if (mounted) context.go('/home');
    } catch (e) {
      final msg = e.toString();
      setState(() {
        _error = msg;
        _loading = false;
      });
      // Terminal error — clear stored token so it is not replayed on next launch
      const terminalErrors = [
        'Invite not found',
        'Invite is no longer pending',
        'Couple already has two members',
        'You are already in a couple',
      ];
      if (terminalErrors.any((err) => (_error ?? '').contains(err))) {
        ref.read(pendingInviteTokenProvider.notifier).state = null;
      }
      debugPrint('[InviteScreen] Accept error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.colors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxxxl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(color: context.colors.accent.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: Icon(Icons.people, size: 32, color: context.colors.accent),
              ),
              const SizedBox(height: AppSpacing.xxl),
              Text('Couple Invite', style: AppTypography.pageTitle.copyWith(color: context.colors.text)),
              const SizedBox(height: AppSpacing.sm),
              Text('You\'ve been invited to join a couple', style: AppTypography.body.copyWith(color: context.colors.textMuted), textAlign: TextAlign.center),
              if (_error != null) ...[
                const SizedBox(height: AppSpacing.md),
                Text(_error!, style: AppTypography.body.copyWith(color: Colors.red), textAlign: TextAlign.center),
              ],
              const SizedBox(height: AppSpacing.xxxxl),
              AppButton(label: 'Accept Invite', fullWidth: true, isLoading: _loading, onPressed: _loading ? null : _accept),
            ],
          ),
        ),
      ),
    );
  }
}

