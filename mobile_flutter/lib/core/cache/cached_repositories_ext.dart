import 'dart:convert';
import 'package:luvverse/core/cache/cache_mixin.dart';
import 'package:luvverse/core/cache/cache_service.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/budget_plan.dart';
import 'package:luvverse/models/couple.dart';
import 'package:luvverse/models/deposit.dart';
import 'package:luvverse/models/insight.dart';
import 'package:luvverse/models/investment.dart';
import 'package:luvverse/models/notification_model.dart';

/// Cached deposits repository.
class CachedDepositsRepository with CacheMixin {
  final ApiClient _api;
  @override
  final CacheService cache;

  CachedDepositsRepository(this._api, this.cache);

  Future<List<Deposit>> getDeposits() async {
    return fetchWithCache<List<Deposit>>(
      cacheKey: 'deposits',
      apiFetch: () async {
        final response =
            await _api.get<Map<String, dynamic>>(ApiEndpoints.deposits);
        return (response['data'] as List)
            .map((e) => Deposit.fromJson(e as Map<String, dynamic>))
            .toList();
      },
      serialize: (data) => jsonEncode(data.map((e) => e.toJson()).toList()),
      deserialize: (cached) => (jsonDecode(cached) as List)
          .map((e) => Deposit.fromJson(e as Map<String, dynamic>))
          .toList(),
      defaultValue: [],
    );
  }
}

/// Cached investments repository.
class CachedInvestmentsRepository with CacheMixin {
  final ApiClient _api;
  @override
  final CacheService cache;

  CachedInvestmentsRepository(this._api, this.cache);

  Future<List<Investment>> getInvestments() async {
    return fetchWithCache<List<Investment>>(
      cacheKey: 'investments',
      apiFetch: () async {
        final response =
            await _api.get<Map<String, dynamic>>(ApiEndpoints.investments);
        return (response['data'] as List)
            .map((e) => Investment.fromJson(e as Map<String, dynamic>))
            .toList();
      },
      serialize: (data) => jsonEncode(data.map((e) => e.toJson()).toList()),
      deserialize: (cached) => (jsonDecode(cached) as List)
          .map((e) => Investment.fromJson(e as Map<String, dynamic>))
          .toList(),
      defaultValue: [],
    );
  }
}

/// Cached couple repository.
class CachedCoupleRepository with CacheMixin {
  final ApiClient _api;
  @override
  final CacheService cache;

  CachedCoupleRepository(this._api, this.cache);

  Future<Couple?> getCouple() async {
    return fetchNullableWithCache<Couple>(
      cacheKey: 'couple',
      apiFetch: () async {
        final response =
            await _api.get<Map<String, dynamic>>(ApiEndpoints.couple);
        final data = response['data'];
        if (data == null) return null;
        return Couple.fromJson(data as Map<String, dynamic>);
      },
      serialize: (data) => jsonEncode(data.toJson()),
      deserialize: (cached) =>
          Couple.fromJson(jsonDecode(cached) as Map<String, dynamic>),
    );
  }
}

/// Cached notifications repository.
class CachedNotificationsRepository with CacheMixin {
  final ApiClient _api;
  @override
  final CacheService cache;

  CachedNotificationsRepository(this._api, this.cache);

  Future<NotificationsResponse> getNotifications() async {
    return fetchWithCache<NotificationsResponse>(
      cacheKey: 'notifications',
      apiFetch: () async {
        final response =
            await _api.get<Map<String, dynamic>>(ApiEndpoints.notifications);
        return NotificationsResponse.fromJson(
            response['data'] as Map<String, dynamic>);
      },
      serialize: (data) => jsonEncode({
        'notifications':
            data.notifications.map((n) => n.toJson()).toList(),
        'unreadCount': data.unreadCount,
      }),
      deserialize: (cached) => NotificationsResponse.fromJson(
          jsonDecode(cached) as Map<String, dynamic>),
      defaultValue: const NotificationsResponse(
          notifications: [], unreadCount: 0),
    );
  }

  Future<int> getUnreadCount() async {
    return fetchWithCache<int>(
      cacheKey: 'notifications:unread',
      apiFetch: () async {
        final response = await _api.get<Map<String, dynamic>>(
            '${ApiEndpoints.notifications}/unread-count');
        return (response['data'] as int?) ?? 0;
      },
      serialize: (data) => data.toString(),
      deserialize: (cached) => int.tryParse(cached) ?? 0,
      defaultValue: 0,
    );
  }
}

/// Cached insights repository.
class CachedInsightsRepository with CacheMixin {
  final ApiClient _api;
  @override
  final CacheService cache;

  CachedInsightsRepository(this._api, this.cache);

  Future<DashboardInsights> getDashboardInsights({String? month}) async {
    final cacheKey = 'insights:${month ?? 'current'}';
    return fetchWithCache<DashboardInsights>(
      cacheKey: cacheKey,
      apiFetch: () async {
        final params = <String, dynamic>{
          if (month != null) 'month': month,
        };
        final response = await _api.get<Map<String, dynamic>>(
          ApiEndpoints.insights,
          queryParameters: params,
        );
        // Store raw JSON for serialization
        _lastInsightsJson[cacheKey] = response['data'] as Map<String, dynamic>;
        return DashboardInsights.fromJson(
            response['data'] as Map<String, dynamic>);
      },
      serialize: (_) => jsonEncode(_lastInsightsJson[cacheKey]),
      deserialize: (cached) => DashboardInsights.fromJson(
          jsonDecode(cached) as Map<String, dynamic>),
      defaultValue: const DashboardInsights(
        totalBalance: 0,
        cashFlow: CashFlow(income: 0, expenses: 0, net: 0),
        savingsRate: 0,
        expenseBreakdown: {},
        budgetStatus: [],
        monthlyTrends: [],
        accountBreakdown: [],
        alerts: [],
      ),
    );
  }

  final _lastInsightsJson = <String, Map<String, dynamic>>{};

  Future<HealthScore> getHealthScore() async {
    return fetchWithCache<HealthScore>(
      cacheKey: 'health_score',
      apiFetch: () async {
        final response = await _api.get<Map<String, dynamic>>(
            '${ApiEndpoints.insights}/health-score');
        _lastHealthJson = response['data'] as Map<String, dynamic>;
        return HealthScore.fromJson(
            response['data'] as Map<String, dynamic>);
      },
      serialize: (_) => jsonEncode(_lastHealthJson),
      deserialize: (cached) =>
          HealthScore.fromJson(jsonDecode(cached) as Map<String, dynamic>),
      defaultValue: const HealthScore(
        score: 0,
        rating: 'Unknown',
        breakdown: HealthScoreBreakdown(
          savingsRate: 0,
          debtToIncomeRatio: 0,
          emergencyFundMonths: 0,
          budgetAdherence: 0,
        ),
      ),
    );
  }

  Map<String, dynamic>? _lastHealthJson;
}

/// Cached budget plans repository.
class CachedBudgetPlansRepository with CacheMixin {
  final ApiClient _api;
  @override
  final CacheService cache;

  CachedBudgetPlansRepository(this._api, this.cache);

  Future<BudgetPlan?> getBudgetPlan({
    required String monthAndYear,
    String mode = 'monthly',
  }) async {
    final cacheKey = 'budget_plans:$monthAndYear:$mode';
    return fetchNullableWithCache<BudgetPlan>(
      cacheKey: cacheKey,
      apiFetch: () async {
        final response = await _api.get<Map<String, dynamic>>(
          ApiEndpoints.budgetPlans,
          queryParameters: {'monthAndYear': monthAndYear, 'mode': mode},
        );
        final data = response['data'];
        if (data == null) return null;
        return BudgetPlan.fromJson(data as Map<String, dynamic>);
      },
      serialize: (data) => jsonEncode(data.toJson()),
      deserialize: (cached) =>
          BudgetPlan.fromJson(jsonDecode(cached) as Map<String, dynamic>),
    );
  }

  Future<void> saveBudgetPlan({
    required String monthAndYear,
    required String mode,
    required double income,
    required List<BudgetPlanLineItem> lineItems,
  }) async {
    await _api.post<Map<String, dynamic>>(
      ApiEndpoints.budgetPlans,
      data: {
        'monthAndYear': monthAndYear,
        'mode': mode,
        'income': income,
        'lineItems': lineItems.map((e) => e.toJson()).toList(),
      },
    );
    await cache.invalidateEntity('budget_plans');
  }

  Future<void> deleteBudgetPlan(String id) async {
    await _api.delete('${ApiEndpoints.budgetPlans}/$id');
    await cache.invalidateEntity('budget_plans');
  }
}
