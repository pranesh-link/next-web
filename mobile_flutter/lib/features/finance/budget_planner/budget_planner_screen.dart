import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/budget_plan.dart';
import 'package:luvverse/shared/widgets/app_button.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:intl/intl.dart';

/// Budget planner screen for monthly/yearly planning.
class BudgetPlannerScreen extends ConsumerStatefulWidget {
  const BudgetPlannerScreen({super.key});

  @override
  ConsumerState<BudgetPlannerScreen> createState() =>
      _BudgetPlannerScreenState();
}

class _BudgetPlannerScreenState extends ConsumerState<BudgetPlannerScreen> {
  final _incomeCtrl = TextEditingController();
  final List<_LineItemEntry> _items = [];
  bool _saving = false;

  @override
  void dispose() {
    _incomeCtrl.dispose();
    for (final item in _items) {
      item.dispose();
    }
    super.dispose();
  }

  void _loadFromPlan(BudgetPlan plan) {
    _incomeCtrl.text = plan.income.toStringAsFixed(0);
    _items.clear();
    for (final item in plan.lineItems) {
      _items.add(_LineItemEntry.fromLineItem(item));
    }
    setState(() {});
  }

  void _addItem() {
    setState(() => _items.add(_LineItemEntry()));
  }

  void _removeItem(int index) {
    _items[index].dispose();
    setState(() => _items.removeAt(index));
  }

  Future<void> _save() async {
    final income = double.tryParse(_incomeCtrl.text);
    if (income == null || income <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter valid income')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final lineItems = _items
          .where((i) => i.category.isNotEmpty && i.amount > 0)
          .map((i) => BudgetPlanLineItem(
                category: i.category,
                amount: i.amount,
                note: i.note.isEmpty ? null : i.note,
                paid: i.paid,
              ))
          .toList();
      await ref.read(budgetPlanProvider.notifier).save(
            income: income,
            lineItems: lineItems,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Budget plan saved')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final planAsync = ref.watch(budgetPlanProvider);
    final month = ref.watch(budgetPlanMonthProvider);
    final mode = ref.watch(budgetPlanModeProvider);
    final currencyFmt = NumberFormat.currency(locale: 'en_IN', symbol: '₹');

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Budget Planner'),
        backgroundColor: AppColors.bg,
        elevation: 0,
        titleTextStyle: AppTypography.pageTitle,
      ),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            // Month + mode selector
            Row(
              children: [
                Expanded(child: _MonthSelector(month: month, ref: ref)),
                const SizedBox(width: AppSpacing.sm),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'monthly', label: Text('Monthly')),
                    ButtonSegment(value: 'yearly', label: Text('Yearly')),
                  ],
                  selected: {mode},
                  onSelectionChanged: (v) =>
                      ref.read(budgetPlanModeProvider.notifier).state =
                          v.first,
                  style: ButtonStyle(
                    textStyle: WidgetStatePropertyAll(AppTypography.xs),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            // Content
            Expanded(
              child: planAsync.when(
                loading: () => const LoadingSkeleton(type: SkeletonType.card),
                error: (e, _) => Center(child: Text('Error: $e')),
                data: (plan) {
                  // Auto-populate form if plan loaded and form is empty
                  if (plan != null && _items.isEmpty) {
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      _loadFromPlan(plan);
                    });
                  }
                  return _buildForm(currencyFmt);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildForm(NumberFormat currencyFmt) {
    final totalPlanned = _items.fold(0.0, (sum, i) => sum + i.amount);
    final income = double.tryParse(_incomeCtrl.text) ?? 0;
    final remaining = income - totalPlanned;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Monthly Income', style: AppTypography.label),
                const SizedBox(height: AppSpacing.sm),
                TextField(
                  controller: _incomeCtrl,
                  keyboardType: TextInputType.number,
                  onChanged: (_) => setState(() {}),
                  decoration: const InputDecoration(
                    prefixText: '₹ ',
                    hintText: '0',
                    isDense: true,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          // Summary row
          Row(
            children: [
              _SummaryChip(
                  'Planned', currencyFmt.format(totalPlanned), AppColors.accent),
              const SizedBox(width: AppSpacing.sm),
              _SummaryChip(
                'Remaining',
                currencyFmt.format(remaining),
                remaining >= 0 ? AppColors.success : AppColors.danger,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          // Line items
          ..._items.asMap().entries.map((entry) => Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: _LineItemRow(
                  item: entry.value,
                  onRemove: () => _removeItem(entry.key),
                  onChanged: () => setState(() {}),
                ),
              )),
          const SizedBox(height: AppSpacing.sm),
          OutlinedButton.icon(
            onPressed: _addItem,
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Add Item'),
          ),
          const SizedBox(height: AppSpacing.xl),
          AppButton(
            label: 'Save Plan',
            onPressed: _save,
            isLoading: _saving,
            fullWidth: true,
          ),
        ],
      ),
    );
  }
}

class _MonthSelector extends StatelessWidget {
  final String month;
  final WidgetRef ref;
  const _MonthSelector({required this.month, required this.ref});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(
          onPressed: () => _changeMonth(-1),
          icon: const Icon(Icons.chevron_left, size: 20),
        ),
        Text(month, style: AppTypography.bodyMedium),
        IconButton(
          onPressed: () => _changeMonth(1),
          icon: const Icon(Icons.chevron_right, size: 20),
        ),
      ],
    );
  }

  void _changeMonth(int delta) {
    final parts = month.split('-');
    final date = DateTime(int.parse(parts[0]), int.parse(parts[1]) + delta);
    ref.read(budgetPlanMonthProvider.notifier).state =
        '${date.year}-${date.month.toString().padLeft(2, '0')}';
  }
}

class _SummaryChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _SummaryChip(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: color.withAlpha(15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withAlpha(50)),
        ),
        child: Column(
          children: [
            Text(label, style: AppTypography.xs.copyWith(color: color)),
            const SizedBox(height: 4),
            Text(value,
                style: AppTypography.bodyMedium.copyWith(color: color)),
          ],
        ),
      ),
    );
  }
}

class _LineItemRow extends StatelessWidget {
  final _LineItemEntry item;
  final VoidCallback onRemove;
  final VoidCallback onChanged;

  const _LineItemRow({
    required this.item,
    required this.onRemove,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          Checkbox(
            value: item.paid,
            onChanged: (v) {
              item.paid = v ?? false;
              onChanged();
            },
            activeColor: AppColors.success,
          ),
          Expanded(
            flex: 2,
            child: TextField(
              controller: item.categoryCtrl,
              decoration: const InputDecoration(
                hintText: 'Category',
                isDense: true,
                border: InputBorder.none,
              ),
              style: AppTypography.small,
              onChanged: (_) => onChanged(),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: TextField(
              controller: item.amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                hintText: '₹0',
                isDense: true,
                border: InputBorder.none,
              ),
              style: AppTypography.small,
              onChanged: (_) => onChanged(),
            ),
          ),
          IconButton(
            onPressed: onRemove,
            icon: const Icon(Icons.close, size: 16),
            color: AppColors.danger,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }
}

class _LineItemEntry {
  final TextEditingController categoryCtrl;
  final TextEditingController amountCtrl;
  bool paid;

  _LineItemEntry()
      : categoryCtrl = TextEditingController(),
        amountCtrl = TextEditingController(),
        paid = false;

  factory _LineItemEntry.fromLineItem(BudgetPlanLineItem item) {
    return _LineItemEntry()
      ..categoryCtrl.text = item.category
      ..amountCtrl.text = item.amount.toStringAsFixed(0)
      ..paid = item.paid;
  }

  String get category => categoryCtrl.text.trim();
  double get amount => double.tryParse(amountCtrl.text) ?? 0;
  String get note => '';

  void dispose() {
    categoryCtrl.dispose();
    amountCtrl.dispose();
  }
}
