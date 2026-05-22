import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/budget.dart';

class BudgetsRepository {
  final ApiClient _api;
  BudgetsRepository(this._api);

  Future<List<Budget>> getBudgets({String? month}) async {
    final params = <String, dynamic>{
      if (month != null) 'month': month,
    };
    final response = await _api.get<Map<String, dynamic>>(
      ApiEndpoints.budgets,
      queryParameters: params,
    );
    final list = (response['data'] as List)
        .map((e) => Budget.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<Budget> createBudget({
    required String category,
    required double limit,
    required String month,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.budgets,
      data: {
        'category': category,
        'limit': limit,
        'month': month,
      },
    );
    return Budget.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<Budget> updateBudget({
    required String id,
    String? category,
    double? limit,
    String? month,
  }) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.budgets}/$id',
      data: {
        if (category != null) 'category': category,
        if (limit != null) 'limit': limit,
        if (month != null) 'month': month,
      },
    );
    return Budget.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> deleteBudget(String id) async {
    await _api.delete('${ApiEndpoints.budgets}/$id');
  }
}
