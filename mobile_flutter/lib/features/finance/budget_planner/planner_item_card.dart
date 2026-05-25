import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/budget_planner/planner_constants.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_widgets.dart';
import 'package:intl/intl.dart';

final _currencyFormat =
    NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

/// View-mode card for a budget planner line item.
class PlannerItemCard extends StatelessWidget {
  final LineItemEntry item;
  final int index;
  final VoidCallback onTap;
  final VoidCallback onDelete;
  final VoidCallback onTogglePaid;

  const PlannerItemCard({
    super.key,
    required this.item,
    required this.index,
    required this.onTap,
    required this.onDelete,
    required this.onTogglePaid,
  });

  @override
  Widget build(BuildContext context) {
    final color = getCategoryColor(item.category);
    final isPaid = item.paid;

    return Dismissible(
      key: ValueKey('planner-item-$index'),
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 20),
        decoration: BoxDecoration(
          color: context.colors.success.withAlpha(30),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(
          isPaid ? Icons.remove_circle_outline : Icons.check_circle,
          color: context.colors.success,
        ),
      ),
      secondaryBackground: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: context.colors.danger.withAlpha(30),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(Icons.delete_outline, color: context.colors.danger),
      ),
      confirmDismiss: (direction) async {
        if (direction == DismissDirection.endToStart) {
          onDelete();
          return false;
        } else {
          onTogglePaid();
          return false;
        }
      },
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 100),
          decoration: BoxDecoration(
            color: context.colors.bgElevated,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isPaid
                  ? context.colors.success.withAlpha(40)
                  : context.colors.cardBorder,
            ),
          ),
          child: Row(
            children: [
              // Left accent strip
              Container(
                width: 3,
                constraints: const BoxConstraints(minHeight: 100),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(12),
                    bottomLeft: Radius.circular(12),
                  ),
                ),
              ),
              // Content
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top row: category chip + paid indicator
                      Row(
                        children: [
                          if (item.category.isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: color.withAlpha(25),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                item.category.toUpperCase(),
                                style: AppTypography.xs.copyWith(
                                  color: color,
                                  fontWeight: FontWeight.w500,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          const Spacer(),
                          if (isPaid)
                            Icon(Icons.check_circle,
                                size: 18, color: context.colors.success),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      // Title
                      Text(
                        item.note.isEmpty ? 'Untitled' : item.note,
                        style: AppTypography.bodyMedium.copyWith(
                          fontWeight: FontWeight.w600,
                          decoration:
                              isPaid ? TextDecoration.lineThrough : null,
                          color: isPaid ? context.colors.textMuted : context.colors.text,
                        ),
                      ),
                      const SizedBox(height: 4),
                      // Amount
                      Text(
                        _currencyFormat.format(item.amount),
                        style: AppTypography.cardTitle.copyWith(
                          fontSize: 18,
                          color: isPaid ? context.colors.textMuted : context.colors.text,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
