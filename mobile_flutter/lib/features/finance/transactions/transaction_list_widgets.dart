import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/models/transaction.dart';
import 'package:luvverse/shared/widgets/currency_display.dart';

class TransactionGroupedList extends StatelessWidget {
  final List<Transaction> transactions;
  final ValueChanged<Transaction> onEdit;
  final ValueChanged<Transaction> onDelete;

  const TransactionGroupedList({
    super.key,
    required this.transactions,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final grouped = <String, List<Transaction>>{};
    for (final tx in transactions) {
      final key = DateFormat('dd MMM yyyy').format(tx.date);
      grouped.putIfAbsent(key, () => []).add(tx);
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      itemCount: grouped.length,
      itemBuilder: (_, i) {
        final date = grouped.keys.elementAt(i);
        final items = grouped[date]!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding:
                  const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              child: Text(date, style: AppTypography.small),
            ),
            ...items.map((tx) => TransactionTile(
                  transaction: tx,
                  onTap: () => onEdit(tx),
                  onDismissed: () => onDelete(tx),
                )),
          ],
        );
      },
    );
  }
}

class TransactionTile extends StatelessWidget {
  final Transaction transaction;
  final VoidCallback onTap;
  final VoidCallback onDismissed;

  const TransactionTile({
    super.key,
    required this.transaction,
    required this.onTap,
    required this.onDismissed,
  });

  @override
  Widget build(BuildContext context) {
    final isIncome = transaction.type == TransactionType.income;
    return Dismissible(
      key: ValueKey(transaction.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: AppSpacing.xl),
        color: AppColors.danger,
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      confirmDismiss: (_) async => true,
      onDismissed: (_) {
        HapticFeedback.mediumImpact();
        onDismissed();
      },
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        onTap: onTap,
        leading: Icon(
          isIncome ? Icons.arrow_downward : Icons.arrow_upward,
          color: isIncome ? AppColors.success : AppColors.danger,
        ),
        title: Text(transaction.description ?? transaction.category,
            style: AppTypography.body, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Text(transaction.category, style: AppTypography.small, maxLines: 1, overflow: TextOverflow.ellipsis),
        trailing: CurrencyDisplay(
            amount: transaction.amount, colorCoded: true, showSign: true),
      ),
    );
  }
}
