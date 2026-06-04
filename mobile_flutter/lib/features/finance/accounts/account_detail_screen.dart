import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/account.dart';
import 'package:luvverse/models/transaction.dart';
import 'package:luvverse/shared/widgets/currency_display.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';

class AccountDetailScreen extends ConsumerStatefulWidget {
  final String accountId;

  const AccountDetailScreen({super.key, required this.accountId});

  @override
  ConsumerState<AccountDetailScreen> createState() => _AccountDetailScreenState();
}

class _AccountDetailScreenState extends ConsumerState<AccountDetailScreen> {
  bool _showBalanceHistory = false;

  @override
  Widget build(BuildContext context) {
    final accountsAsync = ref.watch(accountsProvider);
    final txnsAsync = ref.watch(transactionsProvider);

    return Scaffold(
      backgroundColor: context.colors.bg,
      appBar: AppBar(
        title: accountsAsync.whenOrNull(
              data: (accounts) => Text(
                accounts.where((a) => a.id == widget.accountId).firstOrNull?.name ?? 'Account',
              ),
            ) ??
            const Text('Account Details'),
      ),
      body: accountsAsync.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: LoadingSkeleton(type: SkeletonType.card, count: 2),
        ),
        error: (e, _) => OfflineErrorState(
          error: e,
          onRetry: () => ref.read(accountsProvider.notifier).refresh(),
        ),
        data: (accounts) {
          final account = accounts.where((a) => a.id == widget.accountId).firstOrNull;
          if (account == null) {
            return const Center(child: Text('Account not found'));
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context, account.name, account.nickname, account.type, account.balance),
                const SizedBox(height: AppSpacing.xxl),
                Text('Recent Transactions', style: AppTypography.sectionTitle),
                const SizedBox(height: AppSpacing.md),
                txnsAsync.when(
                  loading: () => const LoadingSkeleton(type: SkeletonType.list, count: 3),
                  error: (e, _) => OfflineErrorState(
                    error: e,
                    onRetry: () => ref.read(transactionsProvider.notifier).refresh(),
                  ),
                  data: (txns) {
                    final filtered = txns.where((t) => t.accountId == widget.accountId).toList();
                    if (filtered.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.xxl),
                        child: Center(
                          child: Text('No transactions yet', style: AppTypography.body.copyWith(color: context.colors.textMuted)),
                        ),
                      );
                    }
                    return Column(children: filtered.take(10).map((tx) => _buildTxTile(context, tx)).toList());
                  },
                ),
                const SizedBox(height: AppSpacing.lg),
                _buildBalanceHistorySection(context),
                const SizedBox(height: AppSpacing.xxl),
                _buildDeleteButton(context),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildBalanceHistorySection(BuildContext context) {
    final historyAsync = ref.watch(accountBalanceHistoryProvider(widget.accountId));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Balance History', style: AppTypography.sectionTitle),
            TextButton.icon(
              onPressed: () => setState(() => _showBalanceHistory = !_showBalanceHistory),
              icon: Icon(_showBalanceHistory ? Icons.expand_less : Icons.expand_more, size: 18),
              label: Text(_showBalanceHistory ? 'Hide' : 'Show'),
            ),
          ],
        ),
        if (_showBalanceHistory)
          historyAsync.when(
            loading: () => const LoadingSkeleton(type: SkeletonType.list, count: 3),
            error: (_, __) => Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              child: Text('Could not load balance history', style: AppTypography.small.copyWith(color: context.colors.textMuted)),
            ),
            data: (history) {
              if (history.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                  child: Text('No balance history yet', style: AppTypography.small.copyWith(color: context.colors.textMuted)),
                );
              }
              return Column(
                children: history.map((entry) => _buildHistoryTile(context, entry)).toList(),
              );
            },
          ),
      ],
    );
  }

  Widget _buildHeader(BuildContext context, String name, String? nickname, String type, double balance) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (nickname != null) Text(nickname, style: AppTypography.body.copyWith(color: context.colors.textMuted)),
        const SizedBox(height: AppSpacing.xs),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
          decoration: BoxDecoration(color: context.colors.accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
          child: Text(type.replaceAll('_', ' '), style: AppTypography.xs.copyWith(color: context.colors.accent)),
        ),
        const SizedBox(height: AppSpacing.lg),
        Text('Current Balance', style: AppTypography.label.copyWith(color: context.colors.textMuted)),
        const SizedBox(height: AppSpacing.xs),
        CurrencyDisplay(amount: balance, colorCoded: false, style: AppTypography.pageTitle),
      ],
    );
  }

  Widget _buildTxTile(BuildContext context, Transaction tx) {
    final isIncome = tx.type == TransactionType.income;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(isIncome ? Icons.arrow_downward : Icons.arrow_upward, color: isIncome ? context.colors.success : context.colors.danger),
      title: Text(tx.description ?? tx.category, style: AppTypography.body),
      subtitle: Text(DateFormat('dd MMM yyyy').format(tx.date), style: AppTypography.small),
      trailing: CurrencyDisplay(amount: isIncome ? tx.amount : -tx.amount, colorCoded: true, showSign: true, style: AppTypography.body),
    );
  }

  Widget _buildDeleteButton(BuildContext context) {
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
                TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('Delete', style: TextStyle(color: context.colors.danger))),
              ],
            ),
          );
          if (confirm == true && context.mounted) {
            await ref.read(accountsProvider.notifier).delete(widget.accountId);
            if (context.mounted) Navigator.pop(context);
          }
        },
        style: TextButton.styleFrom(foregroundColor: context.colors.danger),
        child: const Text('Delete Account'),
      ),
    );
  }

  Widget _buildHistoryTile(BuildContext context, BalanceHistoryEntry entry) {
    final isPositive = entry.change >= 0;
    final fmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹');
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(
        isPositive ? Icons.arrow_upward : Icons.arrow_downward,
        color: isPositive ? context.colors.success : context.colors.danger,
        size: 18,
      ),
      title: Text(
        entry.note ?? (isPositive ? 'Balance increased' : 'Balance decreased'),
        style: AppTypography.small,
      ),
      subtitle: Text(
        DateFormat('dd MMM yyyy').format(entry.createdAt),
        style: AppTypography.xs.copyWith(color: context.colors.textMuted),
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            '${isPositive ? '+' : ''}${fmt.format(entry.change)}',
            style: AppTypography.small.copyWith(
              color: isPositive ? context.colors.success : context.colors.danger,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(fmt.format(entry.balance), style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
        ],
      ),
    );
  }
}
