import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
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
import 'package:luvverse/features/finance/forms/add_account_form.dart';

class AccountsScreen extends ConsumerWidget {
  const AccountsScreen({super.key});

  static final _currencyFmt = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
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
                onPressed: () => AddAccountForm.show(context),
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

    return RefreshIndicator(
      onRefresh: () => ref.read(accountsProvider.notifier).refresh(),
      child: ListView(
        children: [
          _buildTotalBalanceBar(totalBalance),
          const SizedBox(height: AppSpacing.lg),
          ...sorted.map(
            (account) => Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.md),
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
        ],
      ),
    );
  }

  Widget _buildTotalBalanceBar(double total) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.xxl,
        vertical: AppSpacing.lg,
      ),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.gradientStart, AppColors.gradientEnd],
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
            _currencyFmt.format(total),
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
