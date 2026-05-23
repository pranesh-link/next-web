import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/goal.dart';

class GoalsRepository {
  final ApiClient _api;
  GoalsRepository(this._api);

  Future<List<Goal>> getGoals() async {
    final response = await _api.get<Map<String, dynamic>>(ApiEndpoints.goals);
    final list = (response['data'] as List)
        .map((e) => Goal.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<Goal> createGoal({
    required String name,
    required double targetAmount,
    double currentAmount = 0,
    DateTime? deadline,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.goals,
      data: {
        'name': name,
        'targetAmount': targetAmount,
        'currentAmount': currentAmount,
        if (deadline != null) 'deadline': deadline.toIso8601String(),
      },
    );
    return Goal.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<Goal> updateGoal({
    required String id,
    String? name,
    double? targetAmount,
    double? currentAmount,
    DateTime? deadline,
  }) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.goals}/$id',
      data: {
        if (name != null) 'name': name,
        if (targetAmount != null) 'targetAmount': targetAmount,
        if (currentAmount != null) 'currentAmount': currentAmount,
        if (deadline != null) 'deadline': deadline.toIso8601String(),
      },
    );
    return Goal.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> deleteGoal(String id) async {
    await _api.delete('${ApiEndpoints.goals}/$id');
  }

  Future<Goal> contributeToGoal({
    required String id,
    required double amount,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      '${ApiEndpoints.goals}/$id/contribute',
      data: {'amount': amount},
    );
    return Goal.fromJson(response['data'] as Map<String, dynamic>);
  }
}
