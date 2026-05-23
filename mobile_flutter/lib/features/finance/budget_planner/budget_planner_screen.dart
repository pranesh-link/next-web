import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_widgets.dart';
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
  final List<LineItemEntry> _items = [];
  bool _saving = false;
  String? _loadedPlanId;

  @override
  void dispose() {
    _incomeCtrl.dispose();
    for (final item in _items) {
      item.dispose();
    }
    super.dispose();
  }

  void _loadFromPlan(BudgetPlan? plan) {
    if (plan == null) {
      _incomeCtrl.clear();
      for (final item in _items) {
        item.dispose();
      }
      _items.clear();
      _loadedPlanId = null;
      setState(() {});
      return;
    }
    _incomeCtrl.text = plan.income.toStringAsFixed(0);
    for (final item in _items) {
      item.dispose();
    }
    _items.clear();
    for (final item in plan.lineItems) {
      _items.add(LineItemEntry.fromLineItem(item));
    }
    _loadedPlanId = plan.id;
    setState(() {});
  }

  void _addItem() {
    setState(() => _items.add(LineItemEntry()));
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
                Expanded(child: PlannerMonthSelector(month: month, ref: ref)),
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
                  // Re-populate form when plan changes (new month/mode)
                  final planId = plan?.id;
                  if (planId != _loadedPlanId) {
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
    final totalPaid = _items
        .where((i) => i.paid)
        .fold(0.0, (sum, i) => sum + i.amount);
    final income = double.tryParse(_incomeCtrl.text) ?? 0;
    final remaining = income - totalPaid;

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
              PlannerSummaryChip(
                  'Planned', currencyFmt.format(totalPlanned), AppColors.accent),
              const SizedBox(width: AppSpacing.sm),
              PlannerSummaryChip(
                  'Paid', currencyFmt.format(totalPaid), AppColors.success),
              const SizedBox(width: AppSpacing.sm),
              PlannerSummaryChip(
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
                child: PlannerLineItemRow(
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
