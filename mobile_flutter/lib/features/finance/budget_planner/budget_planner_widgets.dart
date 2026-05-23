import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/models/budget_plan.dart';
import 'package:luvverse/shared/widgets/app_card.dart';

/// Month selector with left/right arrows.
class PlannerMonthSelector extends StatelessWidget {
  final String month;
  final WidgetRef ref;
  const PlannerMonthSelector({super.key, required this.month, required this.ref});

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

/// Small colored chip displaying a label and value.
class PlannerSummaryChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const PlannerSummaryChip(this.label, this.value, this.color, {super.key});

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

/// A single budget line item row with note, category badge, amount, tick/remove.
class PlannerLineItemRow extends StatelessWidget {
  final LineItemEntry item;
  final VoidCallback onRemove;
  final VoidCallback onChanged;

  const PlannerLineItemRow({
    super.key,
    required this.item,
    required this.onRemove,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isPaid = item.paid;
    return AppCard(
      child: Row(
        children: [
          if (item.category.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              margin: const EdgeInsets.only(right: 8),
              decoration: BoxDecoration(
                color: AppColors.accent.withAlpha(20),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                item.category,
                style: AppTypography.xs.copyWith(color: AppColors.accent),
              ),
            ),
          Expanded(
            flex: 3,
            child: TextField(
              controller: item.noteCtrl,
              decoration: const InputDecoration(
                hintText: 'Note',
                isDense: true,
                border: InputBorder.none,
              ),
              style: AppTypography.small.copyWith(
                decoration: isPaid ? TextDecoration.lineThrough : null,
                color: isPaid ? AppColors.textMuted : null,
              ),
              onChanged: (_) => onChanged(),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            flex: 2,
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
          const SizedBox(width: 12),
          SizedBox(
            width: 32,
            height: 32,
            child: IconButton(
              onPressed: () {
                item.paid = !item.paid;
                onChanged();
              },
              icon: Icon(
                isPaid ? Icons.check_circle : Icons.circle_outlined,
                size: 22,
              ),
              color: isPaid ? AppColors.success : AppColors.textMuted,
              padding: EdgeInsets.zero,
            ),
          ),
          const SizedBox(width: 4),
          SizedBox(
            width: 32,
            height: 32,
            child: IconButton(
              onPressed: onRemove,
              icon: const Icon(Icons.delete_outline, size: 20),
              color: AppColors.danger,
              padding: EdgeInsets.zero,
            ),
          ),
        ],
      ),
    );
  }
}

/// Mutable entry model for a budget plan line item (UI state).
class LineItemEntry {
  final TextEditingController categoryCtrl;
  final TextEditingController amountCtrl;
  final TextEditingController noteCtrl;
  bool paid;

  LineItemEntry()
      : categoryCtrl = TextEditingController(),
        amountCtrl = TextEditingController(),
        noteCtrl = TextEditingController(),
        paid = false;

  factory LineItemEntry.fromLineItem(BudgetPlanLineItem item) {
    return LineItemEntry()
      ..categoryCtrl.text = item.category
      ..amountCtrl.text = item.amount.toStringAsFixed(0)
      ..noteCtrl.text = item.note ?? ''
      ..paid = item.paid;
  }

  String get category => categoryCtrl.text.trim();
  double get amount => double.tryParse(amountCtrl.text) ?? 0;
  String get note => noteCtrl.text.trim();

  void dispose() {
    categoryCtrl.dispose();
    amountCtrl.dispose();
    noteCtrl.dispose();
  }
}
