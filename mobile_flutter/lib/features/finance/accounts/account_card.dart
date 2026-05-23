import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/models/account.dart';
import 'package:luvverse/shared/widgets/currency_display.dart';

/// A rich account card displaying badges, pin status, and action row.
class AccountCard extends StatelessWidget {
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
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        decoration: BoxDecoration(
          color: AppColors.bgElevated,
          border: Border.all(
            color: account.isPinned
                ? const Color(0xFFD4AF37)
                : AppColors.cardBorder,
            width: account.isPinned ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: AppSpacing.md),
            _buildBadges(),
            const SizedBox(height: AppSpacing.md),
            _buildTypeRow(),
            const SizedBox(height: AppSpacing.md),
            CurrencyDisplay(amount: account.balance, colorCoded: true),
            const SizedBox(height: AppSpacing.sm),
            _buildLastUpdated(),
            const SizedBox(height: AppSpacing.lg),
            _buildActionRow(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
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
                    color: AppColors.accent.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    account.nickname!,
                    style: AppTypography.xs.copyWith(
                      color: AppColors.accent,
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

  Widget _buildTypeRow() {
    return Row(
      children: [
        Icon(_iconForType(account.type), size: 16, color: AppColors.accent),
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

  Widget _buildActionRow() {
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.xs,
      children: [
        _actionChip('✏️ Nickname', onEditNickname),
        _actionChip('💰 Balance', onUpdateBalance),
        if (account.isSalaryAccount && onAddIncome != null)
          _actionChip('💰 Add Income', onAddIncome!),
      ],
    );
  }

  Widget _actionChip(String label, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.cardBorder),
        ),
        child: Text(label, style: AppTypography.xs.copyWith(
          color: AppColors.textDim,
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
