import 'package:flutter/foundation.dart';

/// Financial health score breakdown.
@immutable
class HealthScoreBreakdown {
  final double savingsRate;
  final double debtToIncomeRatio;
  final double emergencyFundMonths;
  final double budgetAdherence;

  const HealthScoreBreakdown({
    required this.savingsRate,
    required this.debtToIncomeRatio,
    required this.emergencyFundMonths,
    required this.budgetAdherence,
  });

  factory HealthScoreBreakdown.fromJson(Map<String, dynamic> json) {
    return HealthScoreBreakdown(
      savingsRate: (json['savingsRate'] as num).toDouble(),
      debtToIncomeRatio: (json['debtToIncomeRatio'] as num).toDouble(),
      emergencyFundMonths: (json['emergencyFundMonths'] as num).toDouble(),
      budgetAdherence: (json['budgetAdherence'] as num).toDouble(),
    );
  }
}

/// Financial health score with rating.
@immutable
class HealthScore {
  final int score;
  final String rating;
  final HealthScoreBreakdown breakdown;

  const HealthScore({
    required this.score,
    required this.rating,
    required this.breakdown,
  });

  factory HealthScore.fromJson(Map<String, dynamic> json) {
    return HealthScore(
      score: json['score'] as int,
      rating: json['rating'] as String,
      breakdown: HealthScoreBreakdown.fromJson(
          json['breakdown'] as Map<String, dynamic>),
    );
  }
}

/// Cash flow summary (income vs expenses).
@immutable
class CashFlow {
  final double income;
  final double expenses;
  final double net;

  const CashFlow({
    required this.income,
    required this.expenses,
    required this.net,
  });

  factory CashFlow.fromJson(Map<String, dynamic> json) {
    return CashFlow(
      income: (json['income'] as num).toDouble(),
      expenses: (json['expenses'] as num).toDouble(),
      net: (json['net'] as num).toDouble(),
    );
  }
}

/// A monthly trend data point.
@immutable
class MonthlyTrend {
  final String month;
  final double income;
  final double expenses;
  final double net;

  const MonthlyTrend({
    required this.month,
    required this.income,
    required this.expenses,
    required this.net,
  });

  factory MonthlyTrend.fromJson(Map<String, dynamic> json) {
    return MonthlyTrend(
      month: json['month'] as String,
      income: (json['income'] as num).toDouble(),
      expenses: (json['expenses'] as num).toDouble(),
      net: (json['net'] as num).toDouble(),
    );
  }
}

/// Budget status for a single budget category.
@immutable
class BudgetStatusItem {
  final Map<String, dynamic> budget;
  final double spent;
  final double remaining;
  final bool exceeded;

  const BudgetStatusItem({
    required this.budget,
    required this.spent,
    required this.remaining,
    required this.exceeded,
  });

  factory BudgetStatusItem.fromJson(Map<String, dynamic> json) {
    return BudgetStatusItem(
      budget: json['budget'] as Map<String, dynamic>,
      spent: (json['spent'] as num).toDouble(),
      remaining: (json['remaining'] as num).toDouble(),
      exceeded: json['exceeded'] as bool,
    );
  }

  String get category => budget['category'] as String? ?? '';
  double get limit => (budget['limit'] as num?)?.toDouble() ?? 0.0;
}

/// Budget rollup totals.
@immutable
class BudgetRollup {
  final double totalLimit;
  final double totalSpent;
  final int exceededCount;

  const BudgetRollup({
    required this.totalLimit,
    required this.totalSpent,
    required this.exceededCount,
  });

  factory BudgetRollup.fromJson(Map<String, dynamic> json) {
    return BudgetRollup(
      totalLimit: (json['totalLimit'] as num).toDouble(),
      totalSpent: (json['totalSpent'] as num).toDouble(),
      exceededCount: json['exceededCount'] as int,
    );
  }
}

/// Loans summary for dashboard.
@immutable
class LoansSummary {
  final int count;
  final double totalRemaining;
  final double totalEMI;

  const LoansSummary({
    required this.count,
    required this.totalRemaining,
    required this.totalEMI,
  });

  factory LoansSummary.fromJson(Map<String, dynamic> json) {
    return LoansSummary(
      count: json['count'] as int,
      totalRemaining: (json['totalRemaining'] as num).toDouble(),
      totalEMI: (json['totalEMI'] as num).toDouble(),
    );
  }
}

/// Goals summary for dashboard.
@immutable
class GoalsSummary {
  final int count;
  final double totalTarget;
  final double totalSaved;

  const GoalsSummary({
    required this.count,
    required this.totalTarget,
    required this.totalSaved,
  });

  factory GoalsSummary.fromJson(Map<String, dynamic> json) {
    return GoalsSummary(
      count: json['count'] as int,
      totalTarget: (json['totalTarget'] as num).toDouble(),
      totalSaved: (json['totalSaved'] as num).toDouble(),
    );
  }

  double get progress {
    if (totalTarget == 0) return 0.0;
    return totalSaved / totalTarget;
  }
}

/// Account type breakdown item.
@immutable
class AccountBreakdownItem {
  final String type;
  final int count;
  final double totalBalance;
  final double percentage;

  const AccountBreakdownItem({
    required this.type,
    required this.count,
    required this.totalBalance,
    required this.percentage,
  });

  factory AccountBreakdownItem.fromJson(Map<String, dynamic> json) {
    return AccountBreakdownItem(
      type: json['type'] as String,
      count: json['count'] as int,
      totalBalance: (json['totalBalance'] as num).toDouble(),
      percentage: (json['percentage'] as num).toDouble(),
    );
  }
}

/// Dashboard alert.
@immutable
class DashboardAlert {
  final String type;
  final String severity;
  final String message;
  final String? actionUrl;

  const DashboardAlert({
    required this.type,
    required this.severity,
    required this.message,
    this.actionUrl,
  });

  factory DashboardAlert.fromJson(Map<String, dynamic> json) {
    return DashboardAlert(
      type: json['type'] as String,
      severity: json['severity'] as String,
      message: json['message'] as String,
      actionUrl: json['actionUrl'] as String?,
    );
  }
}

/// Full dashboard insights response.
@immutable
class DashboardInsights {
  final double totalBalance;
  final double? netWorth;
  final CashFlow cashFlow;
  final double savingsRate;
  final Map<String, double> expenseBreakdown;
  final List<BudgetStatusItem> budgetStatus;
  final BudgetRollup? budgetRollup;
  final LoansSummary? loansSummary;
  final GoalsSummary? goalsSummary;
  final HealthScore? healthScore;
  final List<MonthlyTrend> monthlyTrends;
  final List<AccountBreakdownItem> accountBreakdown;
  final List<DashboardAlert> alerts;

  const DashboardInsights({
    required this.totalBalance,
    this.netWorth,
    required this.cashFlow,
    required this.savingsRate,
    required this.expenseBreakdown,
    required this.budgetStatus,
    this.budgetRollup,
    this.loansSummary,
    this.goalsSummary,
    this.healthScore,
    required this.monthlyTrends,
    required this.accountBreakdown,
    required this.alerts,
  });

  factory DashboardInsights.fromJson(Map<String, dynamic> json) {
    final expenseMap = <String, double>{};
    if (json['expenseBreakdown'] != null) {
      (json['expenseBreakdown'] as Map<String, dynamic>).forEach((k, v) {
        expenseMap[k] = (v as num).toDouble();
      });
    }

    return DashboardInsights(
      totalBalance: (json['totalBalance'] as num).toDouble(),
      netWorth: json['netWorth'] != null
          ? (json['netWorth'] as num).toDouble()
          : null,
      cashFlow: CashFlow.fromJson(json['cashFlow'] as Map<String, dynamic>),
      savingsRate: (json['savingsRate'] as num).toDouble(),
      expenseBreakdown: expenseMap,
      budgetStatus: (json['budgetStatus'] as List?)
              ?.map(
                  (e) => BudgetStatusItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      budgetRollup: json['budgetRollup'] != null
          ? BudgetRollup.fromJson(
              json['budgetRollup'] as Map<String, dynamic>)
          : null,
      loansSummary: json['loansSummary'] != null
          ? LoansSummary.fromJson(
              json['loansSummary'] as Map<String, dynamic>)
          : null,
      goalsSummary: json['goalsSummary'] != null
          ? GoalsSummary.fromJson(
              json['goalsSummary'] as Map<String, dynamic>)
          : null,
      healthScore: json['healthScore'] != null
          ? HealthScore.fromJson(
              json['healthScore'] as Map<String, dynamic>)
          : null,
      monthlyTrends: (json['monthlyTrends'] as List?)
              ?.map((e) => MonthlyTrend.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      accountBreakdown: (json['accountBreakdown'] as List?)
              ?.map((e) =>
                  AccountBreakdownItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      alerts: (json['alerts'] as List?)
              ?.map(
                  (e) => DashboardAlert.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }
}
