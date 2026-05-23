import 'package:flutter/foundation.dart';

/// Investment asset types.
abstract class InvestmentAssetType {
  static const gold = 'GOLD';
  static const silver = 'SILVER';
  static const stock = 'STOCK';
  static const mutualFund = 'MUTUAL_FUND';
}

/// Investment modes.
abstract class InvestmentMode {
  static const lumpsum = 'LUMPSUM';
  static const sip = 'SIP';
}

/// Stock exchange values.
abstract class StockExchange {
  static const nse = 'NSE';
  static const bse = 'BSE';
}

/// An investment holding belonging to a user.
@immutable
class Investment {
  final String id;
  final String userId;
  final String? coupleId;
  final String name;
  final String assetType;
  final String mode;
  final String? ticker;
  final String? exchange;
  final double? quantity;
  final double? quantityGrams;
  final double investedAmount;
  final double? currentPrice;
  final double? currentValue;
  final double? sipAmount;
  final int? sipDayOfMonth;
  final DateTime startDate;
  final DateTime? nextSipDate;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Investment({
    required this.id,
    required this.userId,
    this.coupleId,
    required this.name,
    required this.assetType,
    required this.mode,
    this.ticker,
    this.exchange,
    this.quantity,
    this.quantityGrams,
    required this.investedAmount,
    this.currentPrice,
    this.currentValue,
    this.sipAmount,
    this.sipDayOfMonth,
    required this.startDate,
    this.nextSipDate,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Investment.fromJson(Map<String, dynamic> json) {
    return Investment(
      id: json['id'] as String,
      userId: json['userId'] as String,
      coupleId: json['coupleId'] as String?,
      name: json['name'] as String,
      assetType: json['assetType'] as String,
      mode: json['mode'] as String,
      ticker: json['ticker'] as String?,
      exchange: json['exchange'] as String?,
      quantity:
          json['quantity'] != null ? (json['quantity'] as num).toDouble() : null,
      quantityGrams: json['quantityGrams'] != null
          ? (json['quantityGrams'] as num).toDouble()
          : null,
      investedAmount: (json['investedAmount'] as num).toDouble(),
      currentPrice: json['currentPrice'] != null
          ? (json['currentPrice'] as num).toDouble()
          : null,
      currentValue: json['currentValue'] != null
          ? (json['currentValue'] as num).toDouble()
          : null,
      sipAmount: json['sipAmount'] != null
          ? (json['sipAmount'] as num).toDouble()
          : null,
      sipDayOfMonth: json['sipDayOfMonth'] as int?,
      startDate: DateTime.parse(json['startDate'] as String),
      nextSipDate: json['nextSipDate'] != null
          ? DateTime.parse(json['nextSipDate'] as String)
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
      'assetType': assetType,
      'mode': mode,
      'ticker': ticker,
      'exchange': exchange,
      'quantity': quantity,
      'quantityGrams': quantityGrams,
      'investedAmount': investedAmount,
      'currentPrice': currentPrice,
      'currentValue': currentValue,
      'sipAmount': sipAmount,
      'sipDayOfMonth': sipDayOfMonth,
      'startDate': startDate.toIso8601String(),
      'nextSipDate': nextSipDate?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  /// Unrealized gain/loss amount.
  double get gainLoss => (currentValue ?? investedAmount) - investedAmount;

  /// Unrealized gain/loss percentage.
  double get gainLossPercentage {
    if (investedAmount == 0) return 0.0;
    return (gainLoss / investedAmount) * 100;
  }

  bool get isSip => mode == InvestmentMode.sip;
  bool get isLumpsum => mode == InvestmentMode.lumpsum;
  bool get isGold => assetType == InvestmentAssetType.gold;
  bool get isSilver => assetType == InvestmentAssetType.silver;
  bool get isStock => assetType == InvestmentAssetType.stock;
  bool get isMutualFund => assetType == InvestmentAssetType.mutualFund;
}

/// Summary of all investments for dashboard display.
@immutable
class InvestmentsSummary {
  final int count;
  final double totalInvested;
  final double currentValue;
  final double gainLoss;

  const InvestmentsSummary({
    required this.count,
    required this.totalInvested,
    required this.currentValue,
    required this.gainLoss,
  });

  factory InvestmentsSummary.fromJson(Map<String, dynamic> json) {
    return InvestmentsSummary(
      count: json['count'] as int,
      totalInvested: (json['totalInvested'] as num).toDouble(),
      currentValue: (json['currentValue'] as num).toDouble(),
      gainLoss: (json['gainLoss'] as num).toDouble(),
    );
  }

  double get gainLossPercentage {
    if (totalInvested == 0) return 0.0;
    return (gainLoss / totalInvested) * 100;
  }
}
