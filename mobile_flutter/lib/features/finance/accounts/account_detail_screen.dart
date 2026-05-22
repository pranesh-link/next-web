import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/transaction.dart';
import 'package:luvverse/shared/widgets/currency_display.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';

class AccountDetailScreen extends ConsumerWidget {
  final String accountId;

  const AccountDetailScreen({super.key, required this.accountId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accountsAsync = ref.watch(accountsProvider);
    final txnsAsync = ref.watch(transactionsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: accountsAsync.whenOrNull(
              data: (accounts) => Text(
                accounts.where((a) => a.id == accountId).firstOrNull?.name ?? 'Account',
              ),
            ) ??
            const Text('Account Details'),
      ),
      body: accountsAsync.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: LoadingSkeleton(type: SkeletonType.card, count: 2),
        ),
        error: (e, _) => Center(child: Text('Error: $e', style: AppTypography.body)),
        data: (accounts) {
          final account = accounts.where((a) => a.id == accountId).firstOrNull;
          if (account == null) {
            return const Center(child: Text('Account not found'));
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(account.name, account.nickname, account.type, account.balance),
                const SizedBox(height: AppSpacing.xxl),
                Text('Recent Transactions', style: AppTypography.sectionTitle),
                const SizedBox(height: AppSpacing.md),
                txnsAsync.when(
                  loading: () => const LoadingSkeleton(type: SkeletonType.list, count: 3),
                  error: (e, _) => Text('Error: $e'),
                  data: (txns) {
                    final filtered = txns.where((t) => t.accountId == accountId).toList();
                    if (filtered.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxl),
                        child: Center(
                          child: Text('No transactions yet', style: AppTypography.body.copyWith(color: AppColors.textMuted)),
                        ),
                      );
                    }
                    return Column(children: filtered.take(10).map(_buildTxTile).toList());
                  },
                ),
                const SizedBox(height: AppSpacing.xxl),
                _buildDeleteButton(context, ref),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(String name, String? nickname, String type, double balance) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (nickname != null) Text(nickname, style: AppTypography.body.copyWith(color: AppColors.textMuted)),
        const SizedBox(height: AppSpacing.xs),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
          decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
          child: Text(type.replaceAll('_', ' '), style: AppTypography.xs.copyWith(color: AppColors.accent)),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text('Current Balance', style: AppTypography.label.copyWith(color: AppColors.textMuted)),
        const SizedBox(height: AppSpacing.xs),
        CurrencyDisplay(amount: balance, colorCoded: false, style: AppTypography.pageTitle),
      ],
    );
  }

  Widget _buildTxTile(Transaction tx) {
    final isIncome = tx.type == TransactionType.income;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(isIncome ? Icons.arrow_downward : Icons.arrow_upward, color: isIncome ? AppColors.success : AppColors.danger),
      title: Text(tx.description ?? tx.category, style: AppTypography.body),
      subtitle: Text(DateFormat('dd MMM yyyy').format(tx.date), style: AppTypography.small),
      trailing: CurrencyDisplay(amount: isIncome ? tx.amount : -tx.amount, colorCoded: true, showSign: true, style: AppTypography.body),
    );
  }

  Widget _buildDeleteButton(BuildContext context, WidgetRef ref) {
    return SizedBox(
      width: double.infinity,
      child: TextButton(
        onPressed: () async {
          final confirm = await showDialog<bool>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Delete Account'),
              content: const Text('Are you sure? This cannot be undone.'),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('Delete', style: TextStyle(color: AppColors.danger))),
              ],
            ),
          );
          if (confirm == true && context.mounted) {
            await ref.read(accountsProvider.notifier).delete(accountId);
            if (context.mounted) Navigator.pop(context);
          }
        },
        style: TextButton.styleFrom(foregroundColor: AppColors.danger),
        child: const Text('Delete Account'),
      ),
    );
  }
}
