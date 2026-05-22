import 'package:flutter/foundation.dart';

/// A monthly budget for a specific spending category.
@immutable
class Budget {
  final String id;
  final String category;
  final double limit;
  final String month;
  final double? spent;
  final String userId;
  final String? coupleId;

  const Budget({
    required this.id,
    required this.category,
    required this.limit,
    required this.month,
    this.spent,
    required this.userId,
    this.coupleId,
  });

  factory Budget.fromJson(Map<String, dynamic> json) {
    return Budget(
      id: json['id'] as String,
      category: json['category'] as String,
      limit: (json['limit'] as num).toDouble(),
      month: json['month'] as String,
      spent: (json['spent'] as num?)?.toDouble(),
      userId: json['userId'] as String,
      coupleId: json['coupleId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'category': category,
      'limit': limit,
      'month': month,
      'spent': spent,
      'userId': userId,
      'coupleId': coupleId,
    };
  }

  /// Percentage of budget consumed (0.0–1.0+).
  double get progress => spent != null ? spent! / limit : 0.0;

  /// Whether spending has exceeded the budget limit.
  bool get isOverBudget => spent != null && spent! > limit;
}
