import 'package:flutter/foundation.dart';

/// Transaction types.
abstract class TransactionType {
  static const income = 'INCOME';
  static const expense = 'EXPENSE';
}

/// A financial transaction tied to an account.
@immutable
class Transaction {
  final String id;
  final String accountId;
  final double amount;
  final String type;
  final String category;
  final String? description;
  final DateTime date;
  final String userId;
  final String? coupleId;
  final DateTime createdAt;

  const Transaction({
    required this.id,
    required this.accountId,
    required this.amount,
    required this.type,
    required this.category,
    this.description,
    required this.date,
    required this.userId,
    this.coupleId,
    required this.createdAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as String,
      accountId: json['accountId'] as String,
      amount: (json['amount'] as num).toDouble(),
      type: json['type'] as String,
      category: json['category'] as String,
      description: json['description'] as String?,
      date: DateTime.parse(json['date'] as String),
      userId: json['userId'] as String,
      coupleId: json['coupleId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'accountId': accountId,
      'amount': amount,
      'type': type,
      'category': category,
      'description': description,
      'date': date.toIso8601String(),
      'userId': userId,
      'coupleId': coupleId,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
