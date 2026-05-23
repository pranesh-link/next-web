import 'package:flutter/foundation.dart';

/// Deposit instrument types.
abstract class DepositType {
  static const recurringDeposit = 'RECURRING_DEPOSIT';
  static const fixedDeposit = 'FIXED_DEPOSIT';
}

/// Deposit status values.
abstract class DepositStatus {
  static const active = 'ACTIVE';
  static const matured = 'MATURED';
}

/// Installment frequency for recurring deposits.
abstract class DepositInstallmentFrequency {
  static const monthly = 'MONTHLY';
  static const quarterly = 'QUARTERLY';
  static const halfYearly = 'HALF_YEARLY';
  static const yearly = 'YEARLY';
}

/// Status of an individual installment.
abstract class InstallmentStatus {
  static const pending = 'PENDING';
  static const paid = 'PAID';
  static const missed = 'MISSED';
}

/// A single installment within a deposit instrument.
@immutable
class DepositInstallment {
  final String id;
  final String depositId;
  final double amount;
  final DateTime dueDate;
  final DateTime? paidDate;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;

  const DepositInstallment({
    required this.id,
    required this.depositId,
    required this.amount,
    required this.dueDate,
    this.paidDate,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory DepositInstallment.fromJson(Map<String, dynamic> json) {
    return DepositInstallment(
      id: json['id'] as String,
      depositId: json['depositId'] as String,
      amount: (json['amount'] as num).toDouble(),
      dueDate: DateTime.parse(json['dueDate'] as String),
      paidDate: json['paidDate'] != null
          ? DateTime.parse(json['paidDate'] as String)
          : null,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'depositId': depositId,
      'amount': amount,
      'dueDate': dueDate.toIso8601String(),
      'paidDate': paidDate?.toIso8601String(),
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

/// A deposit instrument (FD or RD) belonging to a user.
@immutable
class Deposit {
  final String id;
  final String userId;
  final String? coupleId;
  final String name;
  final String? provider;
  final String type;
  final double principalAmount;
  final double interestRate;
  final int tenureMonths;
  final double? installmentAmount;
  final String installmentFrequency;
  final int paidInstallments;
  final int? totalInstallments;
  final DateTime startDate;
  final DateTime maturityDate;
  final double maturityAmount;
  final DateTime? nextInstallmentDate;
  final String status;
  final String? sourceAccountId;
  final List<DepositInstallment> installments;
  final int? expectedInstallmentsTillDate;
  final double? timeProgressPercentage;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Deposit({
    required this.id,
    required this.userId,
    this.coupleId,
    required this.name,
    this.provider,
    required this.type,
    required this.principalAmount,
    required this.interestRate,
    required this.tenureMonths,
    this.installmentAmount,
    required this.installmentFrequency,
    required this.paidInstallments,
    this.totalInstallments,
    required this.startDate,
    required this.maturityDate,
    required this.maturityAmount,
    this.nextInstallmentDate,
    required this.status,
    this.sourceAccountId,
    this.installments = const [],
    this.expectedInstallmentsTillDate,
    this.timeProgressPercentage,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Deposit.fromJson(Map<String, dynamic> json) {
    return Deposit(
      id: json['id'] as String,
      userId: json['userId'] as String,
      coupleId: json['coupleId'] as String?,
      name: json['name'] as String,
      provider: json['provider'] as String?,
      type: json['type'] as String,
      principalAmount: (json['principalAmount'] as num).toDouble(),
      interestRate: (json['interestRate'] as num).toDouble(),
      tenureMonths: json['tenureMonths'] as int,
      installmentAmount: json['installmentAmount'] != null
          ? (json['installmentAmount'] as num).toDouble()
          : null,
      installmentFrequency: json['installmentFrequency'] as String,
      paidInstallments: json['paidInstallments'] as int,
      totalInstallments: json['totalInstallments'] as int?,
      startDate: DateTime.parse(json['startDate'] as String),
      maturityDate: DateTime.parse(json['maturityDate'] as String),
      maturityAmount: (json['maturityAmount'] as num).toDouble(),
      nextInstallmentDate: json['nextInstallmentDate'] != null
          ? DateTime.parse(json['nextInstallmentDate'] as String)
          : null,
      status: json['status'] as String,
      sourceAccountId: json['sourceAccountId'] as String?,
      installments: (json['installments'] as List?)
              ?.map(
                  (e) => DepositInstallment.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      expectedInstallmentsTillDate:
          json['expectedInstallmentsTillDate'] as int?,
      timeProgressPercentage: json['timeProgressPercentage'] != null
          ? (json['timeProgressPercentage'] as num).toDouble()
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'coupleId': coupleId,
      'name': name,
      'provider': provider,
      'type': type,
      'principalAmount': principalAmount,
      'interestRate': interestRate,
      'tenureMonths': tenureMonths,
      'installmentAmount': installmentAmount,
      'installmentFrequency': installmentFrequency,
      'paidInstallments': paidInstallments,
      'totalInstallments': totalInstallments,
      'startDate': startDate.toIso8601String(),
      'maturityDate': maturityDate.toIso8601String(),
      'maturityAmount': maturityAmount,
      'nextInstallmentDate': nextInstallmentDate?.toIso8601String(),
      'status': status,
      'sourceAccountId': sourceAccountId,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Progress percentage for installment payments (RD).
  double get installmentProgress {
    if (totalInstallments == null || totalInstallments == 0) return 0.0;
    return paidInstallments / totalInstallments!;
  }

  bool get isActive => status == DepositStatus.active;
  bool get isMatured => status == DepositStatus.matured;
  bool get isRecurring => type == DepositType.recurringDeposit;
  bool get isFixed => type == DepositType.fixedDeposit;
}

/// Summary of all deposits for dashboard display.
@immutable
class DepositsSummary {
  final int count;
  final int activeCount;
  final double totalPrincipal;
  final double totalMaturity;

  const DepositsSummary({
    required this.count,
    required this.activeCount,
    required this.totalPrincipal,
    required this.totalMaturity,
  });

  factory DepositsSummary.fromJson(Map<String, dynamic> json) {
    return DepositsSummary(
      count: json['count'] as int,
      activeCount: json['activeCount'] as int,
      totalPrincipal: (json['totalPrincipal'] as num).toDouble(),
      totalMaturity: (json['totalMaturity'] as num).toDouble(),
    );
  }
}
