import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/budget_planner/planner_constants.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_widgets.dart';

/// Bottom sheet for adding or editing a budget planner line item.
class PlannerItemEditSheet extends StatefulWidget {
  final LineItemEntry item;
  final VoidCallback onSave;
  final VoidCallback? onDelete;
  final bool isNew;

  const PlannerItemEditSheet({
    super.key,
    required this.item,
    required this.onSave,
    this.onDelete,
    this.isNew = false,
  });

  @override
  State<PlannerItemEditSheet> createState() => _PlannerItemEditSheetState();

  /// Show as a modal bottom sheet.
  static Future<void> show(
    BuildContext context, {
    required LineItemEntry item,
    required VoidCallback onSave,
    VoidCallback? onDelete,
    bool isNew = false,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: context.colors.bgElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => PlannerItemEditSheet(
        item: item,
        onSave: onSave,
        onDelete: onDelete,
        isNew: isNew,
      ),
    );
  }
}

class _PlannerItemEditSheetState extends State<PlannerItemEditSheet> {
  @override
  Widget build(BuildContext context) {
    final categories = plannerCategoryColors.keys.toList();
    final viewInsets = MediaQuery.viewInsetsOf(context);

    return SingleChildScrollView(
      padding: EdgeInsets.only(
        left: AppSpacing.xl,
        right: AppSpacing.xl,
        top: AppSpacing.xl,
        bottom: AppSpacing.xl + viewInsets.bottom,
      ),
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
          Text(widget.isNew ? 'Add Item' : 'Edit Item', style: AppTypography.pageTitle),
          const SizedBox(height: AppSpacing.xl),
          // Category dropdown
          Text('Category', style: AppTypography.label),
          const SizedBox(height: AppSpacing.sm),
          Builder(
            builder: (context) {
              // Ensure current category is in the list
              final displayCategories = [...categories];
              final currentCategory = widget.item.category;
              if (currentCategory.isNotEmpty &&
                  !displayCategories.contains(currentCategory)) {
                displayCategories.add(currentCategory);
              }
              return DropdownButtonFormField<String>(
                value: currentCategory.isEmpty ? null : currentCategory,
                decoration: const InputDecoration(
                  hintText: 'Select category',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
                items: displayCategories.map((cat) {
                  final color = getCategoryColor(cat);
                  return DropdownMenuItem(
                    value: cat,
                    child: Row(
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: color,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(cat),
                      ],
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() => widget.item.categoryCtrl.text = val);
                  }
                },
              );
            },
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
            title: const Text('Mark as paid'),
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: AppSpacing.xl),
          // Action buttons
          Row(
            children: [
              if (!widget.isNew && widget.onDelete != null) ...[
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      widget.onDelete!();
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
              ] else ...[
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Close'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
              ],
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
