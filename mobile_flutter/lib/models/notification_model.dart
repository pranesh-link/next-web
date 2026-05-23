import 'package:flutter/foundation.dart';

/// Notification type constants.
abstract class NotificationType {
  static const coupleInvite = 'COUPLE_INVITE';
  static const investmentSipReminder = 'INVESTMENT_SIP_REMINDER';
  static const depositInstallmentReminder = 'DEPOSIT_INSTALLMENT_REMINDER';
  static const budgetExceeded = 'BUDGET_EXCEEDED';
  static const goalReached = 'GOAL_REACHED';
  static const loanEmiReminder = 'LOAN_EMI_REMINDER';
}

/// A notification for the current user.
@immutable
class AppNotification {
  final String id;
  final String userId;
  final String type;
  final String? featureId;
  final bool read;
  final Map<String, dynamic>? payload;
  final DateTime createdAt;

  const AppNotification({
    required this.id,
    required this.userId,
    required this.type,
    this.featureId,
    required this.read,
    this.payload,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      userId: json['userId'] as String,
      type: json['type'] as String,
      featureId: json['featureId'] as String?,
      read: json['read'] as bool? ?? false,
      payload: json['payload'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'type': type,
      'featureId': featureId,
      'read': read,
      'payload': payload,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  /// Human-readable title based on notification type.
  String get title {
    switch (type) {
      case NotificationType.coupleInvite:
        return 'Couple Invite';
      case NotificationType.investmentSipReminder:
        return 'SIP Reminder';
      case NotificationType.depositInstallmentReminder:
        return 'Installment Reminder';
      case NotificationType.budgetExceeded:
        return 'Budget Exceeded';
      case NotificationType.goalReached:
        return 'Goal Reached!';
      case NotificationType.loanEmiReminder:
        return 'EMI Reminder';
      default:
        return 'Notification';
    }
  }

  /// Human-readable message derived from payload.
  String get message {
    if (payload == null) return '';
    switch (type) {
      case NotificationType.coupleInvite:
        final name = payload!['inviterName'] ?? 'Someone';
        return '$name invited you to join their couple';
      case NotificationType.investmentSipReminder:
        final name = payload!['investmentName'] ?? 'Investment';
        final amount = payload!['amount'] ?? 0;
        return '$name SIP of ₹$amount is due';
      case NotificationType.depositInstallmentReminder:
        final name = payload!['depositName'] ?? 'Deposit';
        final amount = payload!['amount'] ?? 0;
        return '$name installment of ₹$amount is due';
      case NotificationType.budgetExceeded:
        final category = payload!['category'] ?? 'Category';
        return 'You have exceeded your $category budget';
      case NotificationType.goalReached:
        final name = payload!['goalName'] ?? 'Goal';
        return 'Congratulations! You reached your $name goal';
      case NotificationType.loanEmiReminder:
        final name = payload!['loanName'] ?? 'Loan';
        final amount = payload!['emiAmount'] ?? 0;
        return '$name EMI of ₹$amount is due';
      default:
        return payload!['message']?.toString() ?? '';
    }
  }
}

/// Response wrapper for notifications list with unread count.
@immutable
class NotificationsResponse {
  final List<AppNotification> notifications;
  final int unreadCount;

  const NotificationsResponse({
    required this.notifications,
    required this.unreadCount,
  });

  factory NotificationsResponse.fromJson(Map<String, dynamic> json) {
    return NotificationsResponse(
      notifications: (json['notifications'] as List)
          .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
          .toList(),
      unreadCount: json['unreadCount'] as int? ?? 0,
    );
  }
}
