import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_widgets.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_strings.dart';
import 'package:luvverse/features/finance/budget_planner/import_selection_sheet.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/loan.dart';

/// Helper class for importing data into the budget planner.
class ImportHelper {
  /// Imports line items from the previous month's budget plan.
  ///
  /// :param context: Build context.
  /// :param ref: Widget ref for accessing providers.
  /// :param existingItems: Current budget line items.
  /// :param onItemsAdded: Callback invoked when items are added.
  /// :return: None.
  static Future<void> importFromLastMonth(
    BuildContext context,
    WidgetRef ref,
    List<LineItemEntry> existingItems,
    void Function(List<LineItemEntry> newItems) onItemsAdded,
  ) async {
    final prevPlan = await ref.read(prevBudgetPlanProvider.future);
    if (!context.mounted) return;
    
    if (prevPlan == null || prevPlan.lineItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(BudgetPlannerStrings.noPlanFoundForPreviousMonth)),
      );
      return;
    }
    
    // Track existing categories to disable duplicates.
    final existingCategories =
        existingItems.map((i) => i.category.toLowerCase()).toSet();

    showModalBottomSheet<List<int>>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: context.colors.bgElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => ImportSelectionSheet(
        items: prevPlan.lineItems,
        existingCategories: existingCategories,
      ),
    ).then((selectedIndices) {
      if (selectedIndices == null || selectedIndices.isEmpty) return;
      final newItems = <LineItemEntry>[];
      for (final i in selectedIndices) {
        newItems.add(
            LineItemEntry.fromLineItem(prevPlan.lineItems[i].copyWith(paid: false)));
      }
      onItemsAdded(newItems);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              BudgetPlannerStrings.addedItemsFromLastMonth(selectedIndices.length)),
        ),
      );
    });
  }

  /// Imports EMI line items from active loans.
  ///
  /// :param context: Build context.
  /// :param loans: List of active loans.
  /// :param existingItems: Current budget line items.
  /// :param onItemsAdded: Callback invoked when items are added.
  /// :return: None.
  static void importLoanEMIs(
    BuildContext context,
    List<Loan> loans,
    List<LineItemEntry> existingItems,
    void Function(List<LineItemEntry> newItems) onItemsAdded,
  ) {
    if (loans.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(BudgetPlannerStrings.noLoansFound)),
      );
      return;
    }
    
    final newItems = <LineItemEntry>[];
    for (final loan in loans) {
      // Check if EMI for this loan already exists by checking note field
      final alreadyExists = existingItems.any((i) =>
          i.category.toLowerCase() == BudgetPlannerStrings.emi.toLowerCase() &&
          i.note.toLowerCase().contains(loan.name.toLowerCase()));
      
      if (!alreadyExists) {
        final entry = LineItemEntry()
          ..categoryCtrl.text = BudgetPlannerStrings.emi
          ..amountCtrl.text = loan.emiAmount.toStringAsFixed(0)
          ..noteCtrl.text = '${loan.name}${loan.loanProvider != null ? ' - ${loan.loanProvider}' : ''}';
        newItems.add(entry);
      }
    }
    
    if (newItems.isNotEmpty) {
      onItemsAdded(newItems);
    }
    
    final label = newItems.isNotEmpty
        ? BudgetPlannerStrings.addedLoanEmis(newItems.length)
        : BudgetPlannerStrings.allLoanEmisAlreadyInPlan;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(label)));
  }
}
