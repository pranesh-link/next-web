import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_strings.dart';
import 'package:luvverse/features/finance/budget_planner/planner_constants.dart';
import 'package:luvverse/models/budget_plan.dart';

/// Bottom sheet for selecting items to import from previous month's budget plan.
class ImportSelectionSheet extends StatefulWidget {
  /// Creates an import selection sheet.
  ///
  /// :param items: Line items from previous month's plan.
  /// :param existingCategories: Categories already in current plan (lowercase).
  /// :return: Sheet widget instance.
  const ImportSelectionSheet({
    required this.items,
    required this.existingCategories,
    super.key,
  });

  final List<BudgetPlanLineItem> items;
  final Set<String> existingCategories;

  @override
  State<ImportSelectionSheet> createState() => _ImportSelectionSheetState();
}

class _ImportSelectionSheetState extends State<ImportSelectionSheet> {
  late final _SelectionNotifier _selectionNotifier;

  @override
  void initState() {
    super.initState();
    _selectionNotifier = _SelectionNotifier(widget.items.length);
  }

  @override
  void dispose() {
    _selectionNotifier.dispose();
    super.dispose();
  }

  void _onConfirm() {
    final selectedIndices = <int>[];
    for (var i = 0; i < _selectionNotifier.selected.length; i++) {
      if (_selectionNotifier.selected[i]) selectedIndices.add(i);
    }
    Navigator.pop(context, selectedIndices);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Handle bar ──────────────────────────────────────────
          Container(
            width: 36,
            height: 4,
            margin: const EdgeInsets.only(top: AppSpacing.sm),
            decoration: BoxDecoration(
              color: colors.cardBorder,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // ── Header ──────────────────────────────────────────────
          Padding(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg, AppSpacing.md, AppSpacing.sm, 0),
            child: Row(
              children: [
                const Text(BudgetPlannerStrings.clipboardIcon,
                    style: TextStyle(fontSize: 20)),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Text(
                    BudgetPlannerStrings.importFromLastMonth,
                    style: AppTypography.cardTitle,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          // ── Select All row ───────────────────────────────────────
          _SelectAllRow(notifier: _selectionNotifier),
          const Divider(height: 1),
          // ── Item list ────────────────────────────────────────────
          ConstrainedBox(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.sizeOf(context).height * 0.45,
            ),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: widget.items.length,
              itemBuilder: (ctx, i) {
                final item = widget.items[i];
                final alreadyExists = widget.existingCategories
                    .contains(item.category.toLowerCase());
                return _ImportCheckboxItem(
                  key: ValueKey(i),
                  item: item,
                  index: i,
                  notifier: _selectionNotifier,
                  alreadyExists: alreadyExists,
                );
              },
            ),
          ),
          const Divider(height: 1),
          // ── Action button ────────────────────────────────────────
          _ConfirmButton(
            notifier: _selectionNotifier,
            onConfirm: _onConfirm,
          ),
        ],
      ),
    );
  }
}

/// Manages selection state with granular notifications.
/// Only notifies listeners about count changes, not individual toggles.
class _SelectionNotifier extends ChangeNotifier {
  /// Creates a selection notifier.
  ///
  /// :param itemCount: Total number of items to track.
  /// :return: Notifier instance.
  _SelectionNotifier(int itemCount)
      : selected = List<bool>.filled(itemCount, false);

  final List<bool> selected;
  int _selectedCount = 0;

  int get selectedCount => _selectedCount;
  bool get allSelected => _selectedCount == selected.length;

  /// Toggles selection for the item at the given index.
  ///
  /// :param index: Index of the item to toggle.
  /// :return: None.
  void toggle(int index) {
    selected[index] = !selected[index];
    _selectedCount += selected[index] ? 1 : -1;
    notifyListeners(); // Only notify for count/all-selected changes
  }

  /// Selects or deselects all items.
  ///
  /// :param value: True to select all, false to deselect all.
  /// :return: None.
  void selectAll(bool value) {
    for (var i = 0; i < selected.length; i++) {
      selected[i] = value;
    }
    _selectedCount = value ? selected.length : 0;
    notifyListeners();
  }
}

/// Select-all checkbox and counter.
/// Rebuilds only when selection count or all-selected state changes.
class _SelectAllRow extends StatelessWidget {
  /// Creates a select-all row.
  ///
  /// :param notifier: Selection notifier to listen to.
  /// :return: Widget instance.
  const _SelectAllRow({required this.notifier});

  final _SelectionNotifier notifier;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: notifier,
      builder: (ctx, _) {
        final colors = ctx.colors;
        final allSelected = notifier.allSelected;
        final selectedCount = notifier.selectedCount;
        final totalCount = notifier.selected.length;

        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Row(
            children: [
              Checkbox(
                value: allSelected,
                tristate: true,
                onChanged: (_) => notifier.selectAll(!allSelected),
                activeColor: colors.accent,
              ),
              Text(
                allSelected
                    ? BudgetPlannerStrings.deselectAll
                    : BudgetPlannerStrings.selectAll,
                style: AppTypography.small.copyWith(color: colors.textMuted),
              ),
              const Spacer(),
              Text(
                BudgetPlannerStrings.selectedCount(selectedCount, totalCount),
                style: AppTypography.xs.copyWith(color: colors.textMuted),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Individual checkbox item.
/// Uses ListenableBuilder to rebuild when selection changes.
class _ImportCheckboxItem extends StatelessWidget {
  /// Creates an import checkbox item.
  ///
  /// :param item: Budget plan line item to display.
  /// :param index: Index of the item in the list.
  /// :param notifier: Selection notifier to listen to.
  /// :param alreadyExists: Whether this item already exists in current plan.
  /// :return: Widget instance.
  const _ImportCheckboxItem({
    required this.item,
    required this.index,
    required this.notifier,
    required this.alreadyExists,
    super.key,
  });

  final BudgetPlanLineItem item;
  final int index;
  final _SelectionNotifier notifier;
  final bool alreadyExists;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final color = getCategoryColor(item.category);
    final currencyFmt =
        NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    // Only rebuild this item when its own selection changes.
    return ListenableBuilder(
      listenable: notifier,
      builder: (ctx, _) {
        final isSelected = notifier.selected[index];
        return CheckboxListTile(
          value: isSelected,
          enabled: !alreadyExists,
          onChanged: alreadyExists ? null : (_) => notifier.toggle(index),
          activeColor: colors.accent,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: 0,
          ),
          dense: true,
          title: Row(
            children: [
              Container(
                width: 10,
                height: 10,
                margin: const EdgeInsets.only(right: AppSpacing.sm),
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
              ),
              Expanded(
                child: Text(
                  item.category,
                  style: AppTypography.bodyMedium,
                ),
              ),
              Text(
                currencyFmt.format(item.amount),
                style: AppTypography.small.copyWith(color: colors.textMuted),
              ),
            ],
          ),
          subtitle: item.note != null && item.note!.isNotEmpty
              ? Text(
                  item.note!,
                  style: AppTypography.xs.copyWith(color: colors.textMuted),
                )
              : null,
          secondary: alreadyExists
              ? const Tooltip(
                  message: BudgetPlannerStrings.alreadyInPlanTooltip,
                  child: Text(BudgetPlannerStrings.crossMarkIcon,
                      style: TextStyle(fontSize: 16)),
                )
              : null,
        );
      },
    );
  }
}

/// Confirm button with dynamic text based on selection count.
/// Rebuilds only when selection count changes.
class _ConfirmButton extends StatelessWidget {
  /// Creates a confirm button.
  ///
  /// :param notifier: Selection notifier to listen to.
  /// :param onConfirm: Callback when button is pressed.
  /// :return: Widget instance.
  const _ConfirmButton({
    required this.notifier,
    required this.onConfirm,
  });

  final _SelectionNotifier notifier;
  final VoidCallback onConfirm;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return ListenableBuilder(
      listenable: notifier,
      builder: (ctx, _) {
        final selectedCount = notifier.selectedCount;
        return Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: selectedCount == 0 ? null : onConfirm,
              style: FilledButton.styleFrom(
                backgroundColor: colors.accent,
                disabledBackgroundColor: colors.accent.withAlpha(80),
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                selectedCount == 0
                    ? BudgetPlannerStrings.selectItemsToAdd
                    : BudgetPlannerStrings.addItems(selectedCount),
                style: AppTypography.bodyMedium.copyWith(color: Colors.white),
              ),
            ),
          ),
        );
      },
    );
  }
}
