import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/account.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/section_header.dart';

final _currencyFormat = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

const _typeLabels = <String, String>{
  AccountType.savingsAccount: 'Savings',
  AccountType.creditAccount: 'Credit',
  AccountType.creditCard: 'Credit Card',
  AccountType.recurringDeposit: 'Recurring Deposit',
  AccountType.fixedDeposit: 'Fixed Deposit',
};

const _typeIcons = <String, IconData>{
  AccountType.savingsAccount: Icons.savings_outlined,
  AccountType.creditAccount: Icons.credit_score_outlined,
  AccountType.creditCard: Icons.credit_card_outlined,
  AccountType.recurringDeposit: Icons.loop_outlined,
  AccountType.fixedDeposit: Icons.lock_clock_outlined,
};

const _typeColors = <String, Color>{
  AccountType.savingsAccount: Color(0xFF16A34A),
  AccountType.creditAccount: Color(0xFF3B82F6),
  AccountType.creditCard: Color(0xFFEC4899),
  AccountType.recurringDeposit: Color(0xFF8B5CF6),
  AccountType.fixedDeposit: Color(0xFFF59E0B),
};

/// Groups accounts by type showing count + subtotal per type.
class AccountBreakdownWidget extends ConsumerWidget {
  const AccountBreakdownWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accountsAsync = ref.watch(accountsProvider);

    return accountsAsync.when(
      loading: () => const LoadingSkeleton(type: SkeletonType.card),
      error: (_, __) => const SizedBox.shrink(),
      data: (accounts) {
        if (accounts.isEmpty) return const SizedBox.shrink();
        return _BreakdownContent(accounts: accounts);
      },
    );
  }
}

class _BreakdownContent extends StatelessWidget {
  final List<Account> accounts;
  const _BreakdownContent({required this.accounts});

  @override
  Widget build(BuildContext context) {
    final grouped = <String, List<Account>>{};
    for (final account in accounts) {
      grouped.putIfAbsent(account.type, () => []).add(account);
    }
    final entries = grouped.entries.toList()
      ..sort((a, b) => b.value.length.compareTo(a.value.length));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(title: 'Account Breakdown'),
        ...entries.map((entry) {
          final type = entry.key;
          final list = entry.value;
          final subtotal = list.fold(0.0, (sum, a) => sum + a.balance);
          final label = _typeLabels[type] ?? type;
          final icon = _typeIcons[type] ?? Icons.account_balance;
          final color = _typeColors[type] ?? context.colors.accent;

          return Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: AppCard(
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withAlpha(20),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(icon, color: color, size: 20),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(label, style: AppTypography.body.copyWith(fontWeight: FontWeight.w600)),
                        Text('${list.length} account${list.length > 1 ? 's' : ''}',
                            style: AppTypography.xs.copyWith(color: context.colors.textMuted)),
                      ],
                    ),
                  ),
                  Text(
                    _currencyFormat.format(subtotal),
                    style: AppTypography.body.copyWith(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
