import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/budget_plan.dart';

/// Repository for budget plan CRUD operations.
class BudgetPlansRepository {
  final ApiClient _api;
  BudgetPlansRepository(this._api);

  Future<BudgetPlan?> getBudgetPlan({
    required String monthAndYear,
    String mode = 'monthly',
  }) async {
    final response = await _api.get<Map<String, dynamic>>(
      ApiEndpoints.budgetPlans,
      queryParameters: {'monthAndYear': monthAndYear, 'mode': mode},
    );
    final data = response['data'];
    if (data == null) return null;
    return BudgetPlan.fromJson(data as Map<String, dynamic>);
  }

  Future<BudgetPlan> saveBudgetPlan({
    required String monthAndYear,
    required String mode,
    required double income,
    required List<BudgetPlanLineItem> lineItems,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.budgetPlans,
      data: {
        'monthAndYear': monthAndYear,
        'mode': mode,
        'income': income,
        'lineItems': lineItems.map((e) => e.toJson()).toList(),
      },
    );
    return BudgetPlan.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<BudgetPlan> updateBudgetPlan({
    required String id,
    double? income,
    List<BudgetPlanLineItem>? lineItems,
  }) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.budgetPlans}/$id',
      data: {
        if (income != null) 'income': income,
        if (lineItems != null)
          'lineItems': lineItems.map((e) => e.toJson()).toList(),
      },
    );
    return BudgetPlan.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> deleteBudgetPlan(String id) async {
    await _api.delete('${ApiEndpoints.budgetPlans}/$id');
  }
}
