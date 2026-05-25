import 'package:flutter/material.dart';

/// Category-to-color mapping for budget planner items.
const plannerCategoryColors = <String, Color>{
  'Food': Color(0xFFF59E0B),
  'Bills': Color(0xFF3B82F6),
  'Health': Color(0xFF10B981),
  'Transport': Color(0xFF8B5CF6),
  'Shopping': Color(0xFFEC4899),
  'Entertainment': Color(0xFF06B6D4),
  'Education': Color(0xFF6366F1),
  'Rent': Color(0xFFEF4444),
  'Insurance': Color(0xFF14B8A6),
  'EMI': Color(0xFFDC2626),
  'Other': Color(0xFF94A3B8),
};

/// Get color for a category, defaulting to gray.
Color getCategoryColor(String category) {
  return plannerCategoryColors[category] ?? const Color(0xFF94A3B8);
}
