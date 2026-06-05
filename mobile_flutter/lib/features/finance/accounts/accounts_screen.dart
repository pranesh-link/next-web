import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/accounts/account_card.dart';
import 'package:luvverse/features/finance/accounts/add_income_modal.dart';
import 'package:luvverse/features/finance/accounts/edit_nickname_modal.dart';
import 'package:luvverse/features/finance/accounts/update_balance_modal.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/account.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';
import 'package:luvverse/core/finance/balance_masked_provider.dart';
import 'package:luvverse/features/finance/forms/add_account_form.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';

class AccountsScreen extends ConsumerStatefulWidget {
  const AccountsScreen({super.key});

  @override
  ConsumerState<AccountsScreen> createState() => _AccountsScreenState();
}

class _AccountsScreenState extends ConsumerState<AccountsScreen> {
  bool _showHistory = false;

  static final _currencyFmt = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  );

  @override
  Widget build(BuildContext context) {
    final asyncAccounts = ref.watch(accountsProvider);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              AppButton(
                label: 'Add Account',
                icon: Icons.add,
                size: ButtonSize.sm,
                onPressed: () {
                  HapticFeedback.mediumImpact();
                  AddAccountForm.show(context);
                },
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Expanded(
            child: asyncAccounts.when(
              loading: () => const LoadingSkeleton(
                type: SkeletonType.card,
                count: 3,
              ),
              error: (e, _) => OfflineErrorState(
                error: e,
                onRetry: () => ref.read(accountsProvider.notifier).refresh(),
              ),
              data: (accounts) => accounts.isEmpty
                  ? EmptyState(
                      icon: Icons.account_balance,
                      title: 'No accounts yet',
                      description: 'Add your bank accounts to start tracking',
                      actionLabel: 'Add Account',
                      onAction: () => AddAccountForm.show(context),
                    )
                  : _buildAccountsList(context, ref, accounts),
            ),
          ),
          _buildHistorySection(context, ref),
        ],
      ),
    );
  }

  Widget _buildAccountsList(
    BuildContext context,
    WidgetRef ref,
    List<Account> accounts,
  ) {
    final currentUserId = ref.watch(dbUserIdProvider);
    final sorted = List<Account>.from(accounts)
      ..sort((a, b) {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.updatedAt.compareTo(a.updatedAt);
      });

    final totalBalance = accounts.fold<double>(
      0,
      (sum, a) => sum + a.balance,
    );
    final masked = ref.watch(balanceMaskedProvider);

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(accountsProvider.notifier).refresh();
        // Also refresh overall balance history so pull-to-refresh shows new entries.
        ref.invalidate(overallBalanceHistoryProvider);
      },
      child: ListView(
        children: [
          _buildTotalBalanceBar(context, totalBalance, masked),
          const SizedBox(height: AppSpacing.lg),
          ...sorted.map(
            (account) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
              child: Dismissible(
                key: Key(account.id),
                direction: DismissDirection.endToStart,
                background: Container(
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: 20),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Icon(Icons.delete, color: Colors.white),
                ),
                confirmDismiss: (_) => _confirmDeleteAccount(context, account),
                onDismissed: (_) {
                  HapticFeedback.mediumImpact();
                  ref.read(accountsProvider.notifier).delete(account.id);
                },
                child: AccountCard(
                  account: account,
                  currentUserId: currentUserId,
                  onTap: () =>
                      context.go('/finance/accounts/${account.id}'),
                  onTogglePin: () => ref
                      .read(accountsProvider.notifier)
                      .togglePin(account.id, account.isPinned),
                  onEditNickname: () => EditNicknameModal.show(
                    context: context,
                    account: account,
                    onSuccess: () =>
                        ref.read(accountsProvider.notifier).refresh(),
                  ),
                  onUpdateBalance: () => UpdateBalanceModal.show(
                    context: context,
                    account: account,
                    onSuccess: () =>
                        ref.read(accountsProvider.notifier).refresh(),
                  ),
                  onAddIncome: () => AddIncomeModal.show(
                    context: context,
                    account: account,
                    onSuccess: () =>
                        ref.read(accountsProvider.notifier).refresh(),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<bool?> _confirmDeleteAccount(
      BuildContext context, Account account) {
    return showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Account'),
        content: Text('Delete "${account.name}"? This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete',
                style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Widget _buildHistorySection(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(overallBalanceHistoryProvider);
    final masked = ref.watch(balanceMaskedProvider);
    final fmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: AppSpacing.xl),
        InkWell(
          onTap: () => setState(() => _showHistory = !_showHistory),
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
            child: Row(
              children: [
                Text(
                  'Balance History',
                  style: AppTypography.sectionTitle,
                ),
                const Spacer(),
                Icon(
                  _showHistory ? Icons.expand_less : Icons.expand_more,
                  size: 20,
                  color: context.colors.textMuted,
                ),
              ],
            ),
          ),
        ),
        if (_showHistory)
          historyAsync.when(
            loading: () => const LoadingSkeleton(
                type: SkeletonType.list, count: 4),
            error: (_, __) => Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              child: Text('Could not load history',
                  style: AppTypography.small
                      .copyWith(color: context.colors.textMuted)),
            ),
            data: (items) {
              if (items.isEmpty) {
                return Padding(
                  padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.md),
                  child: Text('No balance history yet',
                      style: AppTypography.small
                          .copyWith(color: context.colors.textMuted)),
                );
              }
              return Column(
                children: items.map((e) {
                  final isPositive = e.change >= 0;
                  final reasonLabel = switch (e.reason) {
                    'ACCOUNT_ADDED' => 'Account added',
                    'ACCOUNT_REMOVED' => 'Account removed',
                    _ => 'Balance updated',
                  };
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Container(
                      width: 8,
                      height: 8,
                      margin: const EdgeInsets.only(top: 4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isPositive
                            ? context.colors.success
                            : context.colors.danger,
                      ),
                    ),
                    title: Row(
                      children: [
                        Expanded(
                          child: Text(reasonLabel,
                              style: AppTypography.small.copyWith(
                                  fontWeight: FontWeight.w600)),
                        ),
                        Text(
                          masked
                              ? '₹ ••••'
                              : '${isPositive ? '+' : ''}${fmt.format(e.change)}',
                          style: AppTypography.small.copyWith(
                            color: isPositive
                                ? context.colors.success
                                : context.colors.danger,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                    subtitle: Row(
                      children: [
                        Expanded(
                          child: Text(
                            e.accountName,
                            style: AppTypography.xs.copyWith(
                                color: context.colors.textMuted),
                          ),
                        ),
                        Text(
                          masked
                              ? '₹ ••••'
                              : fmt.format(e.totalBalance),
                          style: AppTypography.xs.copyWith(
                              color: context.colors.textMuted),
                        ),
                      ],
                    ),
                    trailing: Text(
                      _fmtDate(e.createdAt),
                      style: AppTypography.xs
                          .copyWith(color: context.colors.textMuted),
                    ),
                  );
                }).toList(),
              );
            },
          ),
        const SizedBox(height: AppSpacing.xxl),
      ],
    );
  }

  String _fmtDate(DateTime d) {
    final now = DateTime.now();
    if (d.year == now.year && d.month == now.month && d.day == now.day) {
      return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    }
    return '${d.day} ${_monthAbbr(d.month)}';
  }

  String _monthAbbr(int m) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return months[m - 1];
  }

  Widget _buildTotalBalanceBar(BuildContext context, double total, bool masked) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.xxl,
        vertical: AppSpacing.lg,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [context.colors.gradientStart, context.colors.gradientEnd],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'TOTAL BALANCE',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.5,
              color: Colors.white70,
            ),
          ),
          Text(
            masked ? '₹ ••••' : _currencyFmt.format(total),
            style: AppTypography.summaryValue.copyWith(
              color: Colors.white,
              fontSize: 22,
            ),
          ),
        ],
      ),
    );
  }
}
