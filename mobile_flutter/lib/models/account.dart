import 'package:flutter/foundation.dart';

/// Minimal user info attached to an account.
@immutable
class AccountUser {
  final String id;
  final String? name;

  const AccountUser({required this.id, this.name});

  factory AccountUser.fromJson(Map<String, dynamic> json) {
    return AccountUser(
      id: json['id'] as String,
      name: json['name'] as String?,
    );
  }
}

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
  final bool isSalaryAccount;
  final bool isEmergencyFund;
  final bool isPinned;
  final DateTime createdAt;
  final DateTime updatedAt;
  final AccountUser? user;

  const Account({
    required this.id,
    required this.name,
    this.nickname,
    required this.type,
    required this.balance,
    required this.userId,
    this.coupleId,
    this.isSalaryAccount = false,
    this.isEmergencyFund = false,
    this.isPinned = false,
    required this.createdAt,
    required this.updatedAt,
    this.user,
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
      isSalaryAccount: json['isSalaryAccount'] as bool? ?? false,
      isEmergencyFund: json['isEmergencyFund'] as bool? ?? false,
      isPinned: json['isPinned'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      user: json['user'] != null
          ? AccountUser.fromJson(json['user'] as Map<String, dynamic>)
          : null,
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
      'isSalaryAccount': isSalaryAccount,
      'isEmergencyFund': isEmergencyFund,
      'isPinned': isPinned,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
