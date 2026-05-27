import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_widgets.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_strings.dart';
import 'package:luvverse/models/budget_plan.dart';
import 'package:luvverse/models/loan.dart';

/// Helper class for budget planner suggestions and insights.
class SuggestionsHelper {
  /// Computes a list of actionable suggestions based on current plan state.
  ///
  /// :param prevPlan: Previous month's budget plan (nullable).
  /// :param loans: List of active loans.
  /// :param items: Current budget line items.
  /// :param income: Monthly income.
  /// :return: List of suggestion strings to display to the user.
  static List<String> computeSuggestions(
    BudgetPlan? prevPlan,
    List<Loan> loans,
    List<LineItemEntry> items,
    double income,
  ) {
    final suggestions = <String>[];
    final totalPlanned = items.fold(0.0, (sum, i) => sum + i.amount);
    
    if (income > 0 && totalPlanned > income) {
      final overBy = (totalPlanned - income).round();
      suggestions.add(BudgetPlannerStrings.expensesExceedIncome(overBy));
    }
    
    if (loans.isNotEmpty && items.isNotEmpty) {
      final hasEmi = items.any((i) =>
          i.category.toLowerCase().contains('emi') ||
          i.note.toLowerCase().contains('emi'));
      if (!hasEmi) {
        suggestions.add(BudgetPlannerStrings.loanEmisNotAdded(loans.length));
      }
    }
    
    if (income <= 0 && items.isNotEmpty) {
      suggestions.add(BudgetPlannerStrings.setIncomeToTrack);
    }
    
    return suggestions;
  }

  /// Shows a bottom sheet displaying budget suggestions.
  ///
  /// :param context: Build context.
  /// :param suggestions: List of suggestion strings to display.
  /// :return: None.
  static void showSuggestionsSheet(
    BuildContext context,
    List<String> suggestions,
  ) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('💡', style: TextStyle(fontSize: 20)),
                const SizedBox(width: AppSpacing.sm),
                Text('Suggestions', style: AppTypography.cardTitle),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            ...suggestions.map((s) => Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.info_outline,
                          size: 16, color: ctx.colors.textMuted),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(child: Text(s, style: AppTypography.small)),
                    ],
                  ),
                )),
          ],
        ),
      ),
    );
  }
}
