import 'package:flutter/foundation.dart';

/// Financial account types.
abstract class AccountType {
  static const savingsAccount = 'SAVINGS_ACCOUNT';
  static const creditAccount = 'CREDIT_ACCOUNT';
  static const creditCard = 'CREDIT_CARD';
  static const recurringDeposit = 'RECURRING_DEPOSIT';
  static const fixedDeposit = 'FIXED_DEPOSIT';
}

/// A financial account belonging to a user (optionally shared with couple).
@immutable
class Account {
  final String id;
  final String name;
  final String? nickname;
  final String type;
  final double balance;
  final String userId;
  final String? coupleId;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Account({
    required this.id,
    required this.name,
    this.nickname,
    required this.type,
    required this.balance,
    required this.userId,
    this.coupleId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Account.fromJson(Map<String, dynamic> json) {
    return Account(
      id: json['id'] as String,
      name: json['name'] as String,
      nickname: json['nickname'] as String?,
      type: json['type'] as String,
      balance: (json['balance'] as num).toDouble(),
      userId: json['userId'] as String,
      coupleId: json['coupleId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'nickname': nickname,
      'type': type,
      'balance': balance,
      'userId': userId,
      'coupleId': coupleId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
