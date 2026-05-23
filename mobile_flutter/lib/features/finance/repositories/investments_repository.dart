import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/investment.dart';

/// Repository for investment holding CRUD operations.
class InvestmentsRepository {
  final ApiClient _api;
  InvestmentsRepository(this._api);

  Future<List<Investment>> getInvestments() async {
    final response =
        await _api.get<Map<String, dynamic>>(ApiEndpoints.investments);
    final list = (response['data'] as List)
        .map((e) => Investment.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<InvestmentsSummary> getInvestmentsSummary() async {
    final response = await _api
        .get<Map<String, dynamic>>('${ApiEndpoints.investments}/summary');
    return InvestmentsSummary.fromJson(
        response['data'] as Map<String, dynamic>);
  }

  Future<Investment> createInvestment({
    required String name,
    required String assetType,
    required String mode,
    required double investedAmount,
    required DateTime startDate,
    String? ticker,
    String? exchange,
    double? quantity,
    double? quantityGrams,
    double? currentPrice,
    double? currentValue,
    double? sipAmount,
    int? sipDayOfMonth,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.investments,
      data: {
        'name': name,
        'assetType': assetType,
        'mode': mode,
        'investedAmount': investedAmount,
        'startDate': startDate.toIso8601String(),
        if (ticker != null) 'ticker': ticker,
        if (exchange != null) 'exchange': exchange,
        if (quantity != null) 'quantity': quantity,
        if (quantityGrams != null) 'quantityGrams': quantityGrams,
        if (currentPrice != null) 'currentPrice': currentPrice,
        if (currentValue != null) 'currentValue': currentValue,
        if (sipAmount != null) 'sipAmount': sipAmount,
        if (sipDayOfMonth != null) 'sipDayOfMonth': sipDayOfMonth,
      },
    );
    return Investment.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<Investment> updateInvestment({
    required String id,
    String? name,
    String? assetType,
    String? mode,
    double? investedAmount,
    String? ticker,
    String? exchange,
    double? quantity,
    double? quantityGrams,
    double? currentPrice,
    double? currentValue,
    double? sipAmount,
    int? sipDayOfMonth,
  }) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.investments}/$id',
      data: {
        if (name != null) 'name': name,
        if (assetType != null) 'assetType': assetType,
        if (mode != null) 'mode': mode,
        if (investedAmount != null) 'investedAmount': investedAmount,
        if (ticker != null) 'ticker': ticker,
        if (exchange != null) 'exchange': exchange,
        if (quantity != null) 'quantity': quantity,
        if (quantityGrams != null) 'quantityGrams': quantityGrams,
        if (currentPrice != null) 'currentPrice': currentPrice,
        if (currentValue != null) 'currentValue': currentValue,
        if (sipAmount != null) 'sipAmount': sipAmount,
        if (sipDayOfMonth != null) 'sipDayOfMonth': sipDayOfMonth,
      },
    );
    return Investment.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> deleteInvestment(String id) async {
    await _api.delete('${ApiEndpoints.investments}/$id');
  }
}
