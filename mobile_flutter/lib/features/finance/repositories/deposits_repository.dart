import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/deposit.dart';

/// Repository for deposit instrument CRUD operations.
class DepositsRepository {
  final ApiClient _api;
  DepositsRepository(this._api);

  Future<List<Deposit>> getDeposits() async {
    final response =
        await _api.get<Map<String, dynamic>>(ApiEndpoints.deposits);
    final list = (response['data'] as List)
        .map((e) => Deposit.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<DepositsSummary> getDepositsSummary() async {
    final response = await _api
        .get<Map<String, dynamic>>('${ApiEndpoints.deposits}/summary');
    return DepositsSummary.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<Deposit> createDeposit({
    required String name,
    required String type,
    required double principalAmount,
    required double interestRate,
    required int tenureMonths,
    required DateTime startDate,
    required DateTime maturityDate,
    required double maturityAmount,
    String? provider,
    double? installmentAmount,
    String installmentFrequency = 'MONTHLY',
    int? totalInstallments,
    String? sourceAccountId,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.deposits,
      data: {
        'name': name,
        'type': type,
        'principalAmount': principalAmount,
        'interestRate': interestRate,
        'tenureMonths': tenureMonths,
        'startDate': startDate.toIso8601String(),
        'maturityDate': maturityDate.toIso8601String(),
        'maturityAmount': maturityAmount,
        'installmentFrequency': installmentFrequency,
        if (provider != null) 'provider': provider,
        if (installmentAmount != null) 'installmentAmount': installmentAmount,
        if (totalInstallments != null) 'totalInstallments': totalInstallments,
        if (sourceAccountId != null) 'sourceAccountId': sourceAccountId,
      },
    );
    return Deposit.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<Deposit> updateDeposit({
    required String id,
    String? name,
    String? provider,
    double? principalAmount,
    double? interestRate,
    int? tenureMonths,
    double? installmentAmount,
    String? installmentFrequency,
    int? paidInstallments,
    int? totalInstallments,
    double? maturityAmount,
    String? status,
    String? sourceAccountId,
  }) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.deposits}/$id',
      data: {
        if (name != null) 'name': name,
        if (provider != null) 'provider': provider,
        if (principalAmount != null) 'principalAmount': principalAmount,
        if (interestRate != null) 'interestRate': interestRate,
        if (tenureMonths != null) 'tenureMonths': tenureMonths,
        if (installmentAmount != null) 'installmentAmount': installmentAmount,
        if (installmentFrequency != null)
          'installmentFrequency': installmentFrequency,
        if (paidInstallments != null) 'paidInstallments': paidInstallments,
        if (totalInstallments != null) 'totalInstallments': totalInstallments,
        if (maturityAmount != null) 'maturityAmount': maturityAmount,
        if (status != null) 'status': status,
        if (sourceAccountId != null) 'sourceAccountId': sourceAccountId,
      },
    );
    return Deposit.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> deleteDeposit(String id) async {
    await _api.delete('${ApiEndpoints.deposits}/$id');
  }
}
