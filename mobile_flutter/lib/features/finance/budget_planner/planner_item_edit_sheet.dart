import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/budget_planner/planner_constants.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_widgets.dart';

/// Bottom sheet for editing a budget planner line item.
class PlannerItemEditSheet extends StatefulWidget {
  final LineItemEntry item;
  final VoidCallback onSave;
  final VoidCallback onDelete;

  const PlannerItemEditSheet({
    super.key,
    required this.item,
    required this.onSave,
    required this.onDelete,
  });

  @override
  State<PlannerItemEditSheet> createState() => _PlannerItemEditSheetState();

  /// Show as a modal bottom sheet.
  static Future<void> show(
    BuildContext context, {
    required LineItemEntry item,
    required VoidCallback onSave,
    required VoidCallback onDelete,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.colors.bgElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(sheetContext).viewInsets.bottom,
        ),
        child: PlannerItemEditSheet(
          item: item,
          onSave: onSave,
          onDelete: onDelete,
        ),
      ),
    );
  }
}

class _PlannerItemEditSheetState extends State<PlannerItemEditSheet> {
  @override
  Widget build(BuildContext context) {
    final categories = plannerCategoryColors.keys.toList();

    return Padding(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: context.colors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          // Title
          Text('Edit Item', style: AppTypography.pageTitle),
          const SizedBox(height: AppSpacing.xl),
          // Category chips
          Text('Category', style: AppTypography.label),
          const SizedBox(height: AppSpacing.sm),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: categories.map((cat) {
              final isSelected = widget.item.category == cat;
              final color = getCategoryColor(cat);
              return GestureDetector(
                onTap: () {
                  setState(() => widget.item.categoryCtrl.text = cat);
                },
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color:
                        isSelected ? color.withAlpha(30) : Colors.transparent,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isSelected ? color : context.colors.cardBorder,
                    ),
                  ),
                  child: Text(
                    cat,
                    style: AppTypography.small.copyWith(
                      color: isSelected ? color : context.colors.textMuted,
                      fontWeight:
                          isSelected ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: AppSpacing.lg),
          // Note/title field
          Text('Title / Note', style: AppTypography.label),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: widget.item.noteCtrl,
            decoration: const InputDecoration(
              hintText: 'e.g. Insurance Premium',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          // Amount field
          Text('Amount', style: AppTypography.label),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: widget.item.amountCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(
              prefixText: '₹ ',
              hintText: '0',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          // Paid toggle
          SwitchListTile(
            value: widget.item.paid,
            onChanged: (v) => setState(() => widget.item.paid = v),
            title: const Text('Marked as paid'),
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: AppSpacing.xl),
          // Action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    widget.onDelete();
                    Navigator.pop(context);
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: context.colors.danger,
                    side: BorderSide(color: context.colors.danger),
                  ),
                  child: const Text('Delete'),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: FilledButton(
                  onPressed: () {
                    widget.onSave();
                    Navigator.pop(context);
                  },
                  child: const Text('Done'),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
        ],
      ),
    );
  }
}
