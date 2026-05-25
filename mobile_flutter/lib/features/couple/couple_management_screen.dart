import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/repositories/couple_repository.dart';
import 'package:luvverse/models/couple.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/app_input.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';

final _coupleRepoProvider = Provider<CoupleRepository>((ref) {
  return CoupleRepository(ref.read(apiClientProvider));
});

final _coupleProvider = FutureProvider<Couple?>((ref) async {
  return ref.read(_coupleRepoProvider).getCouple();
});

/// Screen for managing couple (create, invite, leave, disband).
class CoupleManagementScreen extends ConsumerStatefulWidget {
  const CoupleManagementScreen({super.key});

  @override
  ConsumerState<CoupleManagementScreen> createState() =>
      _CoupleManagementScreenState();
}

class _CoupleManagementScreenState
    extends ConsumerState<CoupleManagementScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _createCouple() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _loading = true);
    try {
      await ref
          .read(_coupleRepoProvider)
          .createCouple(name: _nameCtrl.text.trim());
      ref.invalidate(_coupleProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Couple created!')),
        );
        _nameCtrl.clear();
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

  Future<void> _invitePartner() async {
    if (_emailCtrl.text.trim().isEmpty) return;
    setState(() => _loading = true);
    try {
      await ref
          .read(_coupleRepoProvider)
          .invitePartner(email: _emailCtrl.text.trim());
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Invite sent!')),
        );
        _emailCtrl.clear();
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

  Future<void> _leaveCouple() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Leave Couple?'),
        content:
            const Text('You will no longer share financial data.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Leave',
                  style: TextStyle(color: AppColors.danger))),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _loading = true);
    try {
      await ref.read(_coupleRepoProvider).leaveCouple();
      ref.invalidate(_coupleProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Left couple')),
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

  Future<void> _disbandCouple() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Disband Couple?'),
        content: const Text(
            'This will permanently delete the couple. All shared data will be unlinked.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Disband',
                  style: TextStyle(color: AppColors.danger))),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _loading = true);
    try {
      await ref.read(_coupleRepoProvider).disbandCouple();
      ref.invalidate(_coupleProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Couple disbanded')),
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
    final coupleAsync = ref.watch(_coupleProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Couple'),
        backgroundColor: AppColors.bg,
        elevation: 0,
        titleTextStyle: AppTypography.pageTitle,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: coupleAsync.when(
          loading: () => const LoadingSkeleton(type: SkeletonType.card),
          error: (e, _) => Center(child: Text('Error: $e')),
          data: (couple) =>
              couple == null ? _buildCreateForm() : _buildCoupleInfo(couple),
        ),
      ),
    );
  }

  Widget _buildCreateForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppCard(
          child: Column(
            children: [
              const Icon(Icons.favorite, size: 48, color: AppColors.accent),
              const SizedBox(height: AppSpacing.md),
              Text(
                'Create a couple to share finances',
                style: AppTypography.body.copyWith(color: AppColors.textMuted),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xl),
              AppInput(
                label: 'Couple Name',
                hint: 'e.g. The Smiths',
                controller: _nameCtrl,
              ),
              const SizedBox(height: AppSpacing.lg),
              AppButton(
                label: 'Create Couple',
                onPressed: _createCouple,
                isLoading: _loading,
                fullWidth: true,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCoupleInfo(Couple couple) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.favorite, color: AppColors.accent),
                    const SizedBox(width: AppSpacing.sm),
                    Text(couple.name, style: AppTypography.cardTitle),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                ...couple.members.map((m) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 16,
                            backgroundImage: m.user.image != null
                                ? NetworkImage(m.user.image!)
                                : null,
                            child: m.user.image == null
                                ? Text(m.user.name[0])
                                : null,
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(m.user.name, style: AppTypography.bodyMedium),
                                Text(m.role,
                                    style: AppTypography.xs
                                        .copyWith(color: AppColors.textMuted)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          // Invite partner
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Invite Partner', style: AppTypography.cardTitle),
                const SizedBox(height: AppSpacing.md),
                AppInput(
                  label: 'Email',
                  hint: 'partner@email.com',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: AppSpacing.md),
                AppButton(
                  label: 'Send Invite',
                  onPressed: _invitePartner,
                  isLoading: _loading,
                  fullWidth: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.xxl),
          // Danger zone
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Danger Zone',
                    style: AppTypography.cardTitle.copyWith(color: AppColors.danger)),
                const SizedBox(height: AppSpacing.md),
                AppButton(
                  label: 'Leave Couple',
                  onPressed: _leaveCouple,
                  variant: ButtonVariant.secondary,
                  fullWidth: true,
                ),
                const SizedBox(height: AppSpacing.sm),
                AppButton(
                  label: 'Disband Couple',
                  onPressed: _disbandCouple,
                  variant: ButtonVariant.secondary,
                  fullWidth: true,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
