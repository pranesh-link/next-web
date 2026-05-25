import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/features/finance/transactions/edit_transaction_form.dart';
import 'package:luvverse/features/finance/transactions/transaction_list_widgets.dart';
import 'package:luvverse/models/transaction.dart';
import 'package:luvverse/shared/widgets/empty_state.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';
import 'package:luvverse/features/finance/forms/add_transaction_form.dart';

const _filterCategories = [
  'All', 'Food', 'Transport', 'Shopping', 'Bills',
  'Entertainment', 'Health', 'Education', 'Other',
];

final _categoryFilterProvider = StateProvider<String>((ref) => 'All');
final _accountFilterProvider = StateProvider<String?>((ref) => null);

class TransactionsScreen extends ConsumerWidget {
  const TransactionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedMonth = ref.watch(selectedMonthProvider);
    final categoryFilter = ref.watch(_categoryFilterProvider);
    final accountFilter = ref.watch(_accountFilterProvider);
    final asyncTxns = ref.watch(transactionsProvider);
    final accounts = ref.watch(accountsProvider).valueOrNull ?? [];

    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          children: [
            _MonthSelector(
              current: selectedMonth,
              onChanged: (m) =>
                  ref.read(selectedMonthProvider.notifier).state = m,
            ),
            const SizedBox(height: AppSpacing.md),
            _FilterBar(
              categoryFilter: categoryFilter,
              accountFilter: accountFilter,
              accounts: accounts,
              onCategoryChanged: (v) =>
                  ref.read(_categoryFilterProvider.notifier).state = v,
              onAccountChanged: (v) =>
                  ref.read(_accountFilterProvider.notifier).state = v,
            ),
            const SizedBox(height: AppSpacing.lg),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () =>
                    ref.read(transactionsProvider.notifier).refresh(),
                child: asyncTxns.when(
                  loading: () => const LoadingSkeleton(
                      type: SkeletonType.list, count: 6),
                  error: (e, _) => OfflineErrorState(
                  error: e,
                  onRetry: () => ref.read(transactionsProvider.notifier).refresh(),
                ),
                  data: (txns) {
                    final filtered =
                        _applyFilters(txns, categoryFilter, accountFilter);
                    return filtered.isEmpty
                        ? _buildEmpty(context)
                        : TransactionGroupedList(
                            transactions: filtered,
                            onEdit: (tx) =>
                                EditTransactionForm.show(context, tx),
                            onDelete: (tx) =>
                                _confirmDelete(context, ref, tx),
                          );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton.small(
            heroTag: 'scan',
            onPressed: () => _scanReceipt(context),
            backgroundColor: AppColors.accent,
            child: const Icon(Icons.document_scanner, color: Colors.white),
          ),
          const SizedBox(height: AppSpacing.sm),
          FloatingActionButton(
            heroTag: 'add',
            onPressed: () => AddTransactionForm.show(context),
            backgroundColor: AppColors.accent,
            child: const Icon(Icons.add, color: Colors.white),
          ),
        ],
      ),
    );
  }

  List<Transaction> _applyFilters(
      List<Transaction> txns, String category, String? accountId) {
    var result = txns;
    if (category != 'All') {
      result = result.where((t) => t.category == category).toList();
    }
    if (accountId != null) {
      result = result.where((t) => t.accountId == accountId).toList();
    }
    return result;
  }

  Widget _buildEmpty(BuildContext context) {
    return ListView(
      children: [
        const SizedBox(height: 100),
        EmptyState(
          icon: Icons.receipt_long,
          title: 'No transactions',
          description: 'Your transactions will appear here',
          actionLabel: 'Add Transaction',
          onAction: () => AddTransactionForm.show(context),
        ),
      ],
    );
  }

  void _scanReceipt(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Receipt scanning coming soon')),
    );
  }

  Future<void> _confirmDelete(
      BuildContext context, WidgetRef ref, Transaction tx) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Transaction'),
        content: Text(
            'Delete "${tx.description ?? tx.category}" for \$${tx.amount.toStringAsFixed(2)}?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Delete',
                  style: TextStyle(color: AppColors.danger))),
        ],
      ),
    );
    if (confirmed == true) {
      try {
        await ref.read(transactionsProvider.notifier).delete(tx.id);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Transaction deleted')),
          );
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      }
    }
  }
}

class _FilterBar extends StatelessWidget {
  final String categoryFilter;
  final String? accountFilter;
  final List accounts;
  final ValueChanged<String> onCategoryChanged;
  final ValueChanged<String?> onAccountChanged;

  const _FilterBar({
    required this.categoryFilter,
    required this.accountFilter,
    required this.accounts,
    required this.onCategoryChanged,
    required this.onAccountChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _chipDropdown(
            value: categoryFilter,
            items: _filterCategories,
            onChanged: (v) => onCategoryChanged(v ?? 'All'),
            hint: 'Category',
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: _chipDropdown(
            value: accountFilter ?? 'All',
            items: ['All', ...accounts.map((a) => a.id as String)],
            labels: {
              'All': 'All Accounts',
              for (final a in accounts) a.id as String: a.nickname ?? a.name,
            },
            onChanged: (v) => onAccountChanged(v == 'All' ? null : v),
            hint: 'Account',
          ),
        ),
      ],
    );
  }

  Widget _chipDropdown({
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    required String hint,
    Map<String, String>? labels,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(
        filled: true,
        fillColor: AppColors.bgElevated,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.border),
        ),
      ),
      style: AppTypography.small,
      items: items
          .map((v) =>
              DropdownMenuItem(value: v, child: Text(labels?[v] ?? v)))
          .toList(),
      onChanged: onChanged,
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
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          icon: const Icon(Icons.chevron_left),
          onPressed: () {
            final prev = DateTime(date.year, date.month - 1);
            onChanged(
                '${prev.year}-${prev.month.toString().padLeft(2, '0')}');
          },
        ),
        Text(DateFormat('MMM yyyy').format(date),
            style: AppTypography.cardTitle),
        IconButton(
          icon: const Icon(Icons.chevron_right),
          onPressed: () {
            final next = DateTime(date.year, date.month + 1);
            onChanged(
                '${next.year}-${next.month.toString().padLeft(2, '0')}');
          },
        ),
      ],
    );
  }
}


