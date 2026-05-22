import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/account.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/currency_display.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/features/finance/forms/add_account_form.dart';

class AccountsScreen extends ConsumerWidget {
  const AccountsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncAccounts = ref.watch(accountsProvider);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [AppButton(label: 'Add Account', icon: Icons.add, size: ButtonSize.sm, onPressed: () => AddAccountForm.show(context))],
          ),
          const SizedBox(height: AppSpacing.lg),
          Expanded(
            child: asyncAccounts.when(
              loading: () => const LoadingSkeleton(type: SkeletonType.card, count: 3),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (accounts) => accounts.isEmpty
                  ? EmptyState(
                      icon: Icons.account_balance,
                      title: 'No accounts yet',
                      description: 'Add your bank accounts to start tracking',
                      actionLabel: 'Add Account',
                      onAction: () => AddAccountForm.show(context),
                    )
                  : ListView.separated(
                      itemCount: accounts.length,
                      separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.md),
                      itemBuilder: (_, i) => _buildAccountCard(accounts[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountCard(Account account) {
    return AppCard(
      onTap: () => debugPrint('Navigate to account: ${account.id}'),
      child: Row(
        children: [
          Icon(_iconForType(account.type), color: AppColors.accent),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(account.nickname ?? account.name, style: AppTypography.cardTitle),
                const SizedBox(height: AppSpacing.xs),
                Text(_labelForType(account.type), style: AppTypography.small),
              ],
            ),
          ),
          CurrencyDisplay(amount: account.balance, colorCoded: true),
        ],
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case AccountType.creditCard:
        return Icons.credit_card;
      case AccountType.recurringDeposit:
      case AccountType.fixedDeposit:
        return Icons.savings;
      default:
        return Icons.account_balance;
    }
  }

  String _labelForType(String type) {
    switch (type) {
      case AccountType.savingsAccount:
        return 'Savings';
      case AccountType.creditAccount:
        return 'Credit';
      case AccountType.creditCard:
        return 'Credit Card';
      case AccountType.recurringDeposit:
        return 'RD';
      case AccountType.fixedDeposit:
        return 'FD';
      default:
        return type;
    }
  }
}
