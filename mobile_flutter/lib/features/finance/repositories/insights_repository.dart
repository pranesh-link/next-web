import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/insight.dart';

/// Repository for financial insights and health score.
class InsightsRepository {
  final ApiClient _api;
  InsightsRepository(this._api);

  Future<DashboardInsights> getDashboardInsights({String? month}) async {
    final response = await _api.get<Map<String, dynamic>>(
      ApiEndpoints.insights,
      queryParameters: {
        if (month != null) 'month': month,
      },
    );
    return DashboardInsights.fromJson(
        response['data'] as Map<String, dynamic>);
  }

  Future<HealthScore> getHealthScore() async {
    final response = await _api.get<Map<String, dynamic>>(
      '${ApiEndpoints.insights}/health-score',
    );
    return HealthScore.fromJson(response['data'] as Map<String, dynamic>);
  }
}
