import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_widgets.dart';
import 'package:luvverse/features/finance/budget_planner/planner_item_card.dart';
import 'package:luvverse/features/finance/budget_planner/planner_item_edit_sheet.dart';
import 'package:luvverse/features/finance/budget_planner/planner_empty_state.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_strings.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_import_helpers.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_suggestions.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_stats.dart';
import 'package:luvverse/features/finance/budget_planner/import_selection_sheet.dart';
import 'package:luvverse/shared/widgets/app_card.dart';
import 'package:luvverse/shared/widgets/loading_skeleton.dart';
import 'package:luvverse/shared/widgets/offline_error_state.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/budget_plan.dart';
import 'package:luvverse/models/loan.dart';
import 'package:intl/intl.dart';

/// Budget planner screen with card-based layout, swipe gestures, and FAB.
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
  bool _isDirty = false;
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
      _isDirty = false;
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
    _isDirty = false;
    setState(() {});
  }

  void _markDirty() {
    if (!_isDirty) setState(() => _isDirty = true);
  }

  void _addItem() {
    setState(() {
      _items.add(LineItemEntry());
      _isDirty = true;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      PlannerItemEditSheet.show(
        context,
        item: _items[_items.length - 1],
        onSave: () {
          _markDirty();
          setState(() {});
        },
        onDelete: () => _removeItem(_items.length - 1),
        isNew: true,
      );
    });
  }

  void _removeItem(int index) {
    _items[index].dispose();
    setState(() {
      _items.removeAt(index);
      _isDirty = true;
    });
  }

  void _togglePaid(int index) {
    setState(() {
      _items[index].paid = !_items[index].paid;
      _isDirty = true;
    });
  }

  void _openEditSheet(int index) {
    PlannerItemEditSheet.show(
      context,
      item: _items[index],
      onSave: () {
        _markDirty();
        setState(() {});
      },
      onDelete: () => _removeItem(index),
      isNew: false,
    );
  }

  void _discard() {
    final plan = ref.read(budgetPlanProvider).valueOrNull;
    _loadFromPlan(plan);
  }

  Future<void> _save() async {
    final income = double.tryParse(_incomeCtrl.text);
    if (income == null || income <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(BudgetPlannerStrings.enterValidIncome)),
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
        setState(() => _isDirty = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text(BudgetPlannerStrings.budgetPlanSaved)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${BudgetPlannerStrings.errorPrefix}$e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  // ---------------------------------------------------------------------------
  // Import helpers
  // ---------------------------------------------------------------------------

  Future<void> _importFromLastMonth() async {
    await ImportHelper.importFromLastMonth(
      context,
      ref,
      _items,
      (newItems) {
        setState(() {
          _items.addAll(newItems);
          _isDirty = true;
        });
      },
    );
  }

  void _importLoanEMIs(List<Loan> loans) {
    ImportHelper.importLoanEMIs(
      context,
      loans,
      _items,
      (newItems) {
        setState(() {
          _items.addAll(newItems);
          _isDirty = true;
        });
      },
    );
  }

  Future<void> _deletePlan(String planId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(BudgetPlannerStrings.deletePlan),
        content: const Text(BudgetPlannerStrings.deletePlanConfirmation),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(BudgetPlannerStrings.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text(BudgetPlannerStrings.delete),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await ref.read(budgetPlanProvider.notifier).delete(planId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text(BudgetPlannerStrings.budgetPlanDeleted)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${BudgetPlannerStrings.errorPrefix}$e')),
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Suggestions & delta helpers
  // ---------------------------------------------------------------------------

  String? _computeDelta(double current, double? previous) {
    return StatsHelper.computeDelta(current, previous);
  }

  List<String> _computeSuggestions(
      BudgetPlan? prevPlan, List<Loan> loans, double income) {
    return SuggestionsHelper.computeSuggestions(
      prevPlan,
      loans,
      _items,
      income,
    );
  }

  void _showSuggestionsSheet(List<String> suggestions) {
    SuggestionsHelper.showSuggestionsSheet(context, suggestions);
  }

  @override
  Widget build(BuildContext context) {
    final planAsync = ref.watch(budgetPlanProvider);
    final month = ref.watch(budgetPlanMonthProvider);
    final mode = ref.watch(budgetPlanModeProvider);
    final prevPlanAsync = ref.watch(prevBudgetPlanProvider);
    final loansAsync = ref.watch(loansProvider);
    final loans = loansAsync.valueOrNull ?? [];
    final currencyFmt =
        NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Scaffold(
      backgroundColor: context.colors.bg,
      appBar: AppBar(
        title: const Text('Budget Planner'),
        backgroundColor: context.colors.bg,
        elevation: 0,
        titleTextStyle: AppTypography.pageTitle,
        actions: [
          IconButton(
            icon: const Icon(Icons.content_copy_outlined),
            tooltip: 'Import last month',
            onPressed: _importFromLastMonth,
          ),
          IconButton(
            icon: const Icon(Icons.credit_card_outlined),
            tooltip: 'Import loan EMIs',
            onPressed: () => _importLoanEMIs(loans),
          ),
          if (planAsync.valueOrNull?.id != null)
            PopupMenuButton<String>(
              onSelected: (v) {
                if (v == 'delete') {
                  _deletePlan(planAsync.valueOrNull!.id);
                }
              },
              itemBuilder: (_) => [
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete_outline, color: Colors.red, size: 20),
                      SizedBox(width: 8),
                      Text('Delete plan',
                          style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
            ),
        ],
      ),
      floatingActionButton: _isDirty
          ? null
          : FloatingActionButton(
              onPressed: _addItem,
              backgroundColor: context.colors.accent,
              child: const Icon(Icons.add, color: Colors.white),
            ),
      body: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                children: [
                  // Month + mode selector
                  Row(
                    children: [
                      Expanded(
                          child:
                              PlannerMonthSelector(month: month, ref: ref)),
                      const SizedBox(width: AppSpacing.sm),
                      _buildSegmentedControl(mode),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  // Content
                  Expanded(
                    child: planAsync.when(
                      loading: () =>
                          const LoadingSkeleton(type: SkeletonType.card),
                      error: (e, _) => OfflineErrorState(
                        error: e,
                        onRetry: () => ref.read(
                            budgetPlanProvider.notifier).refresh(),
                      ),
                      data: (plan) {
                        final planId = plan?.id;
                        if (planId != _loadedPlanId) {
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            _loadFromPlan(plan);
                          });
                        }
                        return _buildContent(
                          currencyFmt,
                          prevPlan: prevPlanAsync.valueOrNull,
                          loans: loans,
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_isDirty) _buildSaveBar(),
        ],
      ),
    );
  }

  Widget _buildSegmentedControl(String mode) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        color: context.colors.bg,
        border: Border.all(color: context.colors.cardBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: ['monthly', 'yearly'].map((m) {
          final isSelected = mode == m;
          return GestureDetector(
            onTap: () =>
                ref.read(budgetPlanModeProvider.notifier).state = m,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: isSelected ? context.colors.accent : Colors.transparent,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                m == 'monthly' ? 'Monthly' : 'Yearly',
                style: AppTypography.xs.copyWith(
                  color: isSelected ? Colors.white : context.colors.textMuted,
                  fontWeight:
                      isSelected ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildContent(
    NumberFormat currencyFmt, {
    BudgetPlan? prevPlan,
    List<Loan> loans = const [],
  }) {
    final totalPlanned = _items.fold(0.0, (sum, i) => sum + i.amount);
    final totalPaid =
        _items.where((i) => i.paid).fold(0.0, (sum, i) => sum + i.amount);
    final income = double.tryParse(_incomeCtrl.text) ?? 0;
    final remaining = income - totalPaid;

    // Deltas vs previous period (null when no previous plan exists)
    final prevPlanned = prevPlan == null ? null : prevPlan.lineItems
        .fold(0.0, (sum, i) => sum + i.amount);
    final prevPaid = prevPlan == null ? null : prevPlan.lineItems
        .where((i) => i.paid)
        .fold(0.0, (sum, i) => sum + i.amount);
    final prevIncome = prevPlan?.income;
    final prevRemaining =
        (prevIncome != null && prevPaid != null) ? prevIncome - prevPaid : null;

    final suggestions = _computeSuggestions(prevPlan, loans, income);

    return ListView(
      children: [
        // Income card
        AppCard(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Monthly Income',
                        style: AppTypography.xs
                            .copyWith(color: context.colors.textMuted)),
                    const SizedBox(height: 4),
                    TextField(
                      controller: _incomeCtrl,
                      keyboardType: TextInputType.number,
                      onChanged: (_) {
                        _markDirty();
                        setState(() {});
                      },
                      style: AppTypography.cardTitle,
                      decoration: const InputDecoration(
                        prefixText: '₹ ',
                        hintText: '0',
                        isDense: true,
                        border: InputBorder.none,
                      ),
                    ),
                  ],
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
              'Planned',
              currencyFmt.format(totalPlanned),
              context.colors.accent,
              delta: _computeDelta(totalPlanned, prevPlanned),
            ),
            const SizedBox(width: AppSpacing.sm),
            PlannerSummaryChip(
              'Paid',
              currencyFmt.format(totalPaid),
              context.colors.success,
              delta: _computeDelta(totalPaid, prevPaid),
            ),
            const SizedBox(width: AppSpacing.sm),
            PlannerSummaryChip(
              'Remaining',
              currencyFmt.format(remaining),
              remaining >= 0 ? context.colors.success : context.colors.danger,
              delta: _computeDelta(remaining, prevRemaining),
            ),
          ],
        ),
        // Suggestions chip — only when suggestions exist
        if (suggestions.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sm),
          Align(
            alignment: Alignment.centerRight,
            child: ActionChip(
              avatar: const Text('💡'),
              label: Text('${suggestions.length}'),
              onPressed: () => _showSuggestionsSheet(suggestions),
              visualDensity: VisualDensity.compact,
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.lg),
        // Items
        if (_items.isEmpty)
          PlannerEmptyState(
            onAdd: _addItem,
            onImportLastMonth:
                prevPlan != null && prevPlan.lineItems.isNotEmpty
                    ? _importFromLastMonth
                    : null,
            onImportLoans: loans.isNotEmpty ? () => _importLoanEMIs(loans) : null,
          )
        else
          ..._buildGroupedItems(),
        // Bottom spacer for FAB
        const SizedBox(height: 80),
      ],
    );
  }

  List<Widget> _buildGroupedItems() {
    final unpaid = <MapEntry<int, LineItemEntry>>[];
    final paid = <MapEntry<int, LineItemEntry>>[];

    for (final entry in _items.asMap().entries) {
      if (entry.value.paid) {
        paid.add(entry);
      } else {
        unpaid.add(entry);
      }
    }

    return [
      // Unpaid items first
      ...unpaid.map((entry) => Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: PlannerItemCard(
              item: entry.value,
              index: entry.key,
              onTap: () => _openEditSheet(entry.key),
              onDelete: () => _removeItem(entry.key),
              onTogglePaid: () => _togglePaid(entry.key),
            ),
          )),
      // Paid items in collapsible accordion
      if (paid.isNotEmpty)
        Padding(
          padding: const EdgeInsets.only(top: AppSpacing.md),
          child: Theme(
            data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
            child: ExpansionTile(
              initiallyExpanded: false,
              tilePadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              title: Text(
                'Paid (${paid.length})',
                style: AppTypography.bodyMedium.copyWith(
                  color: context.colors.success,
                  fontWeight: FontWeight.w600,
                ),
              ),
              leading: Icon(Icons.check_circle, color: context.colors.success, size: 20),
              children: paid
                  .map((entry) => Padding(
                        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                        child: PlannerItemCard(
                          item: entry.value,
                          index: entry.key,
                          onTap: () => _openEditSheet(entry.key),
                          onDelete: () => _removeItem(entry.key),
                          onTogglePaid: () => _togglePaid(entry.key),
                        ),
                      ))
                  .toList(),
            ),
          ),
        ),
    ];
  }

  Widget _buildSaveBar() {
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg, vertical: AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.bgElevated,
        border: Border(top: BorderSide(color: context.colors.cardBorder)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: Text(
                'Unsaved changes',
                style:
                    AppTypography.small.copyWith(color: context.colors.textMuted),
              ),
            ),
            TextButton(
              onPressed: _discard,
              child: Text('Discard',
                  style: TextStyle(color: context.colors.textMuted)),
            ),
            const SizedBox(width: AppSpacing.sm),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}
