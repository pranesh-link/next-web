import 'package:flutter/foundation.dart';

/// A loan with amortization schedule and prepayment history.
@immutable
class Loan {
  final String id;
  final String name;
  final String? loanProvider;
  final String? loanAccountNumber;
  final double principal;
  final double interestRate;
  final int tenureMonths;
  final double emiAmount;
  final DateTime startDate;
  final double remainingBalance;
  final List<LoanPrepayment>? prepayments;
  final List<LoanScheduleEntry>? schedule;
  final String userId;
  final String? coupleId;

  const Loan({
    required this.id,
    required this.name,
    this.loanProvider,
    this.loanAccountNumber,
    required this.principal,
    required this.interestRate,
    required this.tenureMonths,
    required this.emiAmount,
    required this.startDate,
    required this.remainingBalance,
    this.prepayments,
    this.schedule,
    required this.userId,
    this.coupleId,
  });

  factory Loan.fromJson(Map<String, dynamic> json) {
    return Loan(
      id: json['id'] as String,
      name: json['name'] as String,
      loanProvider: json['loanProvider'] as String?,
      loanAccountNumber: json['loanAccountNumber'] as String?,
      principal: (json['principal'] as num).toDouble(),
      interestRate: (json['interestRate'] as num).toDouble(),
      tenureMonths: json['tenureMonths'] as int,
      emiAmount: (json['emiAmount'] as num).toDouble(),
      startDate: DateTime.parse(json['startDate'] as String),
      remainingBalance: (json['remainingBalance'] as num).toDouble(),
      prepayments: (json['prepayments'] as List<dynamic>?)
          ?.map((e) => LoanPrepayment.fromJson(e as Map<String, dynamic>))
          .toList(),
      schedule: (json['schedule'] as List<dynamic>?)
          ?.map((e) => LoanScheduleEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
      userId: json['userId'] as String,
      coupleId: json['coupleId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'loanProvider': loanProvider,
      'loanAccountNumber': loanAccountNumber,
      'principal': principal,
      'interestRate': interestRate,
      'tenureMonths': tenureMonths,
      'emiAmount': emiAmount,
      'startDate': startDate.toIso8601String(),
      'remainingBalance': remainingBalance,
      'prepayments': prepayments?.map((e) => e.toJson()).toList(),
      'schedule': schedule?.map((e) => e.toJson()).toList(),
      'userId': userId,
      'coupleId': coupleId,
    };
  }
}

/// A prepayment made against a loan.
@immutable
class LoanPrepayment {
  final String date;
  final double amount;
  final double? balanceAfter;
  final String? source;

  const LoanPrepayment({
    required this.date,
    required this.amount,
    this.balanceAfter,
    this.source,
  });

  factory LoanPrepayment.fromJson(Map<String, dynamic> json) {
    return LoanPrepayment(
      date: json['date'] as String,
      amount: (json['amount'] as num).toDouble(),
      balanceAfter: (json['balanceAfter'] as num?)?.toDouble(),
      source: json['source'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'amount': amount,
      'balanceAfter': balanceAfter,
      'source': source,
    };
  }
}

/// A single month entry in the loan amortization schedule.
@immutable
class LoanScheduleEntry {
  final int month;
  final String date;
  final double emi;
  final double principal;
  final double interest;
  final double balance;

  const LoanScheduleEntry({
    required this.month,
    required this.date,
    required this.emi,
    required this.principal,
    required this.interest,
    required this.balance,
  });

  factory LoanScheduleEntry.fromJson(Map<String, dynamic> json) {
    return LoanScheduleEntry(
      month: json['month'] as int,
      date: json['date'] as String,
      emi: (json['emi'] as num).toDouble(),
      principal: (json['principal'] as num).toDouble(),
      interest: (json['interest'] as num).toDouble(),
      balance: (json['balance'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'month': month,
      'date': date,
      'emi': emi,
      'principal': principal,
      'interest': interest,
      'balance': balance,
    };
  }
}
