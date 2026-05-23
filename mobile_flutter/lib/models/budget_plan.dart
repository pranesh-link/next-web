import 'package:flutter/foundation.dart';
import 'package:luvverse/models/user.dart';

/// A single line item within a budget plan.
@immutable
class BudgetPlanLineItem {
  final String category;
  final double amount;
  final String? note;
  final bool paid;

  const BudgetPlanLineItem({
    required this.category,
    required this.amount,
    this.note,
    required this.paid,
  });

  factory BudgetPlanLineItem.fromJson(Map<String, dynamic> json) {
    return BudgetPlanLineItem(
      category: json['category'] as String,
      amount: (json['amount'] as num).toDouble(),
      note: json['note'] as String?,
      paid: json['paid'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'category': category,
      'amount': amount,
      'note': note,
      'paid': paid,
    };
  }

  BudgetPlanLineItem copyWith({
    String? category,
    double? amount,
    String? note,
    bool? paid,
  }) {
    return BudgetPlanLineItem(
      category: category ?? this.category,
      amount: amount ?? this.amount,
      note: note ?? this.note,
      paid: paid ?? this.paid,
    );
  }
}

/// A budget plan (monthly or yearly) belonging to a user.
@immutable
class BudgetPlan {
  final String id;
  final String userId;
  final String monthAndYear;
  final String mode;
  final double income;
  final List<BudgetPlanLineItem> lineItems;
  final String? coupleId;
  final String? lastUpdatedById;
  final User? lastUpdatedBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  const BudgetPlan({
    required this.id,
    required this.userId,
    required this.monthAndYear,
    required this.mode,
    required this.income,
    required this.lineItems,
    this.coupleId,
    this.lastUpdatedById,
    this.lastUpdatedBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory BudgetPlan.fromJson(Map<String, dynamic> json) {
    return BudgetPlan(
      id: json['id'] as String,
      userId: json['userId'] as String,
      monthAndYear: json['monthAndYear'] as String,
      mode: json['mode'] as String,
      income: (json['income'] as num).toDouble(),
      lineItems: (json['lineItems'] as List)
          .map((e) => BudgetPlanLineItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      coupleId: json['coupleId'] as String?,
      lastUpdatedById: json['lastUpdatedById'] as String?,
      lastUpdatedBy: json['lastUpdatedBy'] != null
          ? User.fromJson(json['lastUpdatedBy'] as Map<String, dynamic>)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'monthAndYear': monthAndYear,
      'mode': mode,
      'income': income,
      'lineItems': lineItems.map((e) => e.toJson()).toList(),
      'coupleId': coupleId,
      'lastUpdatedById': lastUpdatedById,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Total planned spending across all line items.
  double get totalPlanned =>
      lineItems.fold(0.0, (sum, item) => sum + item.amount);

  /// Remaining budget after planned expenses.
  double get remaining => income - totalPlanned;

  /// Total amount marked as paid.
  double get totalPaid => lineItems
      .where((item) => item.paid)
      .fold(0.0, (sum, item) => sum + item.amount);

  /// Total amount still unpaid.
  double get totalUnpaid => lineItems
      .where((item) => !item.paid)
      .fold(0.0, (sum, item) => sum + item.amount);

  bool get isMonthly => mode == 'monthly';
  bool get isYearly => mode == 'yearly';
}
