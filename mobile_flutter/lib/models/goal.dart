import 'package:flutter/foundation.dart';

/// A savings goal with target and current progress.
@immutable
class Goal {
  final String id;
  final String name;
  final double targetAmount;
  final double currentAmount;
  final DateTime? deadline;
  final String userId;
  final String? coupleId;

  const Goal({
    required this.id,
    required this.name,
    required this.targetAmount,
    required this.currentAmount,
    this.deadline,
    required this.userId,
    this.coupleId,
  });

  factory Goal.fromJson(Map<String, dynamic> json) {
    return Goal(
      id: json['id'] as String,
      name: json['name'] as String,
      targetAmount: (json['targetAmount'] as num).toDouble(),
      currentAmount: (json['currentAmount'] as num).toDouble(),
      deadline: json['deadline'] != null
          ? DateTime.parse(json['deadline'] as String)
          : null,
      userId: json['userId'] as String,
      coupleId: json['coupleId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'targetAmount': targetAmount,
      'currentAmount': currentAmount,
      'deadline': deadline?.toIso8601String(),
      'userId': userId,
      'coupleId': coupleId,
    };
  }

  /// Progress toward the goal (0.0–1.0+).
  double get progress => targetAmount > 0 ? currentAmount / targetAmount : 0.0;

  /// Whether the goal has been fully funded.
  bool get isComplete => currentAmount >= targetAmount;
}
