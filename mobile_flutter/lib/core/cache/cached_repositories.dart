import 'dart:convert';
import 'package:luvverse/core/cache/cache_mixin.dart';
import 'package:luvverse/core/cache/cache_service.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/account.dart';
import 'package:luvverse/models/transaction.dart';
import 'package:luvverse/models/budget.dart';
import 'package:luvverse/models/loan.dart';
import 'package:luvverse/models/goal.dart';

/// Cached accounts repository — wraps API calls with offline cache.
class CachedAccountsRepository with CacheMixin {
  final ApiClient _api;
  @override
  final CacheService cache;

  CachedAccountsRepository(this._api, this.cache);

  Future<Map<String, dynamic>> getAccountsRaw() async {
    return fetchWithCache<Map<String, dynamic>>(
      cacheKey: 'accounts',
      apiFetch: () => _api.get<Map<String, dynamic>>(ApiEndpoints.accounts),
      serialize: (data) => jsonEncode(data),
      deserialize: (cached) =>
          jsonDecode(cached) as Map<String, dynamic>,
      defaultValue: {'data': [], 'currentUserId': null},
    );
  }

  Future<Account> createAccount(Map<String, dynamic> data) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.accounts,
      data: data,
    );
    await cache.invalidateEntity('accounts');
    return Account.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<Account> updateAccount(String id, Map<String, dynamic> data) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.accounts}/$id',
      data: data,
    );
    await cache.invalidateEntity('accounts');
    return Account.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> deleteAccount(String id) async {
    await _api.delete('${ApiEndpoints.accounts}/$id');
    await cache.invalidateEntity('accounts');
  }
}

/// Cached transactions repository.
class CachedTransactionsRepository with CacheMixin {
  final ApiClient _api;
  @override
  final CacheService cache;

  CachedTransactionsRepository(this._api, this.cache);

  Future<List<Transaction>> getTransactions({String? month}) async {
    final cacheKey = 'transactions:${month ?? 'all'}';
    return fetchWithCache<List<Transaction>>(
      cacheKey: cacheKey,
      apiFetch: () async {
        final params = <String, dynamic>{
          if (month != null) 'month': month,
        };
        final response = await _api.get<Map<String, dynamic>>(
          ApiEndpoints.transactions,
          queryParameters: params,
        );
        return (response['data'] as List)
            .map((e) => Transaction.fromJson(e as Map<String, dynamic>))
            .toList();
      },
      serialize: (data) => jsonEncode(data.map((e) => e.toJson()).toList()),
      deserialize: (cached) => (jsonDecode(cached) as List)
          .map((e) => Transaction.fromJson(e as Map<String, dynamic>))
          .toList(),
      defaultValue: [],
    );
  }

  Future<Transaction> createTransaction(Map<String, dynamic> data) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.transactions,
      data: data,
    );
    await cache.invalidateEntity('transactions');
    return Transaction.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<Transaction> updateTransaction(
      String id, Map<String, dynamic> data) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.transactions}/$id',
      data: data,
    );
    await cache.invalidateEntity('transactions');
    return Transaction.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> deleteTransaction(String id) async {
    await _api.delete('${ApiEndpoints.transactions}/$id');
    await cache.invalidateEntity('transactions');
  }
}

/// Cached budgets repository.
class CachedBudgetsRepository with CacheMixin {
  final ApiClient _api;
  @override
  final CacheService cache;

  CachedBudgetsRepository(this._api, this.cache);

  Future<List<Budget>> getBudgets({String? month}) async {
    final cacheKey = 'budgets:${month ?? 'all'}';
    return fetchWithCache<List<Budget>>(
      cacheKey: cacheKey,
      apiFetch: () async {
        final params = <String, dynamic>{
          if (month != null) 'month': month,
        };
        final response = await _api.get<Map<String, dynamic>>(
          ApiEndpoints.budgets,
          queryParameters: params,
        );
        return (response['data'] as List)
            .map((e) => Budget.fromJson(e as Map<String, dynamic>))
            .toList();
      },
      serialize: (data) => jsonEncode(data.map((e) => e.toJson()).toList()),
      deserialize: (cached) => (jsonDecode(cached) as List)
          .map((e) => Budget.fromJson(e as Map<String, dynamic>))
          .toList(),
      defaultValue: [],
    );
  }

  Future<void> createBudget(Map<String, dynamic> data) async {
    await _api.post<Map<String, dynamic>>(ApiEndpoints.budgets, data: data);
    await cache.invalidateEntity('budgets');
  }

  Future<void> updateBudget(String id, Map<String, dynamic> data) async {
    await _api.put<Map<String, dynamic>>(
        '${ApiEndpoints.budgets}/$id', data: data);
    await cache.invalidateEntity('budgets');
  }

  Future<void> deleteBudget(String id) async {
    await _api.delete('${ApiEndpoints.budgets}/$id');
    await cache.invalidateEntity('budgets');
  }
}

/// Cached loans repository.
class CachedLoansRepository with CacheMixin {
  final ApiClient _api;
  @override
  final CacheService cache;

  CachedLoansRepository(this._api, this.cache);

  Future<List<Loan>> getLoans() async {
    return fetchWithCache<List<Loan>>(
      cacheKey: 'loans',
      apiFetch: () async {
        final response =
            await _api.get<Map<String, dynamic>>(ApiEndpoints.loans);
        return (response['data'] as List)
            .map((e) => Loan.fromJson(e as Map<String, dynamic>))
            .toList();
      },
      serialize: (data) => jsonEncode(data.map((e) => e.toJson()).toList()),
      deserialize: (cached) => (jsonDecode(cached) as List)
          .map((e) => Loan.fromJson(e as Map<String, dynamic>))
          .toList(),
      defaultValue: [],
    );
  }

  Future<void> deleteLoan(String id) async {
    await _api.delete('${ApiEndpoints.loans}/$id');
    await cache.invalidateEntity('loans');
  }
}

/// Cached goals repository.
class CachedGoalsRepository with CacheMixin {
  final ApiClient _api;
  @override
  final CacheService cache;

  CachedGoalsRepository(this._api, this.cache);

  Future<List<Goal>> getGoals() async {
    return fetchWithCache<List<Goal>>(
      cacheKey: 'goals',
      apiFetch: () async {
        final response =
            await _api.get<Map<String, dynamic>>(ApiEndpoints.goals);
        return (response['data'] as List)
            .map((e) => Goal.fromJson(e as Map<String, dynamic>))
            .toList();
      },
      serialize: (data) => jsonEncode(data.map((e) => e.toJson()).toList()),
      deserialize: (cached) => (jsonDecode(cached) as List)
          .map((e) => Goal.fromJson(e as Map<String, dynamic>))
          .toList(),
      defaultValue: [],
    );
  }

  Future<void> deleteGoal(String id) async {
    await _api.delete('${ApiEndpoints.goals}/$id');
    await cache.invalidateEntity('goals');
  }
}
