import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/account.dart';
import 'package:luvverse/shared/widgets/currency_display.dart';

/// A rich account card displaying badges, pin status, and action row.
class AccountCard extends ConsumerWidget {
  final Account account;
  final String? currentUserId;
  final VoidCallback onTap;
  final VoidCallback onTogglePin;
  final VoidCallback onEditNickname;
  final VoidCallback onUpdateBalance;
  final VoidCallback? onAddIncome;

  const AccountCard({
    super.key,
    required this.account,
    this.currentUserId,
    required this.onTap,
    required this.onTogglePin,
    required this.onEditNickname,
    required this.onUpdateBalance,
    this.onAddIncome,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        decoration: BoxDecoration(
          color: context.colors.bgElevated,
          border: Border.all(
            color: account.isPinned
                ? const Color(0xFFD4AF37)
                : context.colors.cardBorder,
            width: account.isPinned ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(context),
            const SizedBox(height: AppSpacing.md),
            _buildBadges(),
            const SizedBox(height: AppSpacing.md),
            _buildTypeRow(context),
            const SizedBox(height: AppSpacing.md),
            CurrencyDisplay(amount: account.balance, colorCoded: true),
            const SizedBox(height: AppSpacing.xs),
            _BalanceHistoryMini(accountId: account.id),
            const SizedBox(height: AppSpacing.sm),
            _buildLastUpdated(),
            const SizedBox(height: AppSpacing.lg),
            _buildActionRow(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Row(
            children: [
              Flexible(
                child: Text(
                  account.name,
                  style: AppTypography.cardTitle.copyWith(fontSize: 16),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (account.nickname != null) ...[
                const SizedBox(width: AppSpacing.sm),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: context.colors.accent.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    account.nickname!,
                    style: AppTypography.xs.copyWith(
                      color: context.colors.accent,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        GestureDetector(
          onTap: onTogglePin,
          child: Text(
            '📌',
            style: TextStyle(
              fontSize: 18,
              color: account.isPinned ? null : Colors.grey,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBadges() {
    final badges = <Widget>[];
    if (account.isSalaryAccount) {
      badges.add(_badge('💼 Salary', const Color(0xFF16A34A)));
    }
    if (account.isEmergencyFund) {
      badges.add(_badge('🛡️ Emergency', const Color(0xFFD97706)));
    }
    if (badges.isEmpty) return const SizedBox.shrink();
    return Wrap(spacing: AppSpacing.sm, children: badges);
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 3,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        text,
        style: AppTypography.xs.copyWith(color: color),
      ),
    );
  }

  Widget _buildTypeRow(BuildContext context) {
    return Row(
      children: [
        Icon(_iconForType(account.type), size: 16, color: context.colors.accent),
        const SizedBox(width: AppSpacing.xs),
        Text(_labelForType(account.type), style: AppTypography.small),
      ],
    );
  }

  Widget _buildLastUpdated() {
    final who = _resolveUpdatedBy();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0x1F22C55E),
        border: Border.all(color: const Color(0x6622C55E)),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '✓ Updated by $who · ${_relativeTime(account.updatedAt)}',
        style: AppTypography.xs.copyWith(
          color: const Color(0xFF16A34A),
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
      ),
    );
  }

  String _resolveUpdatedBy() {
    if (currentUserId != null && account.userId == currentUserId) return 'You';
    if (account.user?.name != null) return account.user!.name!;
    return 'Partner';
  }

  Widget _buildActionRow(BuildContext context) {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.xs,
      children: [
        _actionChip(context, '✏️ Nickname', onEditNickname),
        _actionChip(context, '💰 Balance', onUpdateBalance),
        if (account.isSalaryAccount && onAddIncome != null)
          _actionChip(context, '💰 Add Income', onAddIncome!),
      ],
    );
  }

  Widget _actionChip(BuildContext context, String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: context.colors.cardBorder),
        ),
        child: Text(label, style: AppTypography.xs.copyWith(
          color: context.colors.textDim,
        )),
      ),
    );
  }

  String _relativeTime(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return DateFormat('MMM d').format(dateTime);
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

/// Compact last-3 balance history shown directly on the account card in the list.
class _BalanceHistoryMini extends ConsumerWidget {
  final String accountId;
  const _BalanceHistoryMini({required this.accountId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(accountBalanceHistoryProvider(accountId));
    return historyAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (history) {
        if (history.isEmpty) return const SizedBox.shrink();
        final recent = history.take(3).toList();
        final fmt = NumberFormat.compactCurrency(locale: 'en_IN', symbol: '₹');
        return Wrap(
          spacing: AppSpacing.sm,
          children: recent.map((entry) {
            final isPositive = entry.balance >= 0;
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: context.colors.surface,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: context.colors.cardBorder),
              ),
              child: Text(
                '${DateFormat('d MMM').format(entry.createdAt)}  ${fmt.format(entry.balance)}',
                style: AppTypography.xs.copyWith(
                  color: isPositive ? context.colors.success : context.colors.danger,
                ),
              ),
            );
          }).toList(),
        );
      },
    );
  }
}
