import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/transaction.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/currency_display.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/features/finance/forms/add_transaction_form.dart';

class TransactionsScreen extends ConsumerWidget {
  const TransactionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedMonth = ref.watch(selectedMonthProvider);
    final asyncTxns = ref.watch(transactionsProvider);

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          Row(
            children: [
              _MonthSelector(
                current: selectedMonth,
                onChanged: (m) => ref.read(selectedMonthProvider.notifier).state = m,
              ),
              const Spacer(),
              AppButton(label: 'Add', icon: Icons.add, size: ButtonSize.sm, onPressed: () => AddTransactionForm.show(context)),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Expanded(
            child: asyncTxns.when(
              loading: () => const LoadingSkeleton(type: SkeletonType.list, count: 6),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (txns) => txns.isEmpty
                  ? EmptyState(
                      icon: Icons.receipt_long,
                      title: 'No transactions',
                      description: 'Your transactions will appear here',
                      actionLabel: 'Add Transaction',
                      onAction: () => AddTransactionForm.show(context),
                    )
                  : _buildGroupedList(txns),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGroupedList(List<Transaction> txns) {
    final grouped = <String, List<Transaction>>{};
    for (final tx in txns) {
      final key = DateFormat('dd MMM yyyy').format(tx.date);
      grouped.putIfAbsent(key, () => []).add(tx);
    }
    return ListView.builder(
      itemCount: grouped.length,
      itemBuilder: (_, i) {
        final date = grouped.keys.elementAt(i);
        final items = grouped[date]!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              child: Text(date, style: AppTypography.small),
            ),
            ...items.map(_buildTxTile),
          ],
        );
      },
    );
  }

  Widget _buildTxTile(Transaction tx) {
    final isIncome = tx.type == TransactionType.income;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(
        isIncome ? Icons.arrow_downward : Icons.arrow_upward,
        color: isIncome ? AppColors.success : AppColors.danger,
      ),
      title: Text(tx.description ?? tx.category, style: AppTypography.body),
      subtitle: Text(tx.category, style: AppTypography.small),
      trailing: CurrencyDisplay(amount: tx.amount, colorCoded: true, showSign: true),
    );
  }
}

class _MonthSelector extends StatelessWidget {
  final String current;
  final ValueChanged<String> onChanged;
  const _MonthSelector({required this.current, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final date = DateTime.parse('$current-01');
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: () {
            final prev = DateTime(date.year, date.month - 1);
            onChanged('${prev.year}-${prev.month.toString().padLeft(2, '0')}');
          },
        ),
        Text(DateFormat('MMM yyyy').format(date), style: AppTypography.cardTitle),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: () {
            final next = DateTime(date.year, date.month + 1);
            onChanged('${next.year}-${next.month.toString().padLeft(2, '0')}');
          },
        ),
      ],
    );
  }
}
