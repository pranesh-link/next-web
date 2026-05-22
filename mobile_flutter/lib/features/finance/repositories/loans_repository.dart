import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/loan.dart';

class LoansRepository {
  final ApiClient _api;
  LoansRepository(this._api);

  Future<List<Loan>> getLoans() async {
    final response = await _api.get<Map<String, dynamic>>(ApiEndpoints.loans);
    final list = (response['data'] as List)
        .map((e) => Loan.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<Loan> createLoan({
    required String name,
    required double principal,
    required double interestRate,
    required int tenureMonths,
    required double emiAmount,
    required DateTime startDate,
    String? loanProvider,
    String? loanAccountNumber,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.loans,
      data: {
        'name': name,
        'principal': principal,
        'interestRate': interestRate,
        'tenureMonths': tenureMonths,
        'emiAmount': emiAmount,
        'startDate': startDate.toIso8601String(),
        if (loanProvider != null) 'loanProvider': loanProvider,
        if (loanAccountNumber != null) 'loanAccountNumber': loanAccountNumber,
      },
    );
    return Loan.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<Loan> updateLoan({
    required String id,
    String? name,
    double? principal,
    double? interestRate,
    int? tenureMonths,
    double? emiAmount,
    DateTime? startDate,
    String? loanProvider,
    String? loanAccountNumber,
  }) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.loans}/$id',
      data: {
        if (name != null) 'name': name,
        if (principal != null) 'principal': principal,
        if (interestRate != null) 'interestRate': interestRate,
        if (tenureMonths != null) 'tenureMonths': tenureMonths,
        if (emiAmount != null) 'emiAmount': emiAmount,
        if (startDate != null) 'startDate': startDate.toIso8601String(),
        if (loanProvider != null) 'loanProvider': loanProvider,
        if (loanAccountNumber != null) 'loanAccountNumber': loanAccountNumber,
      },
    );
    return Loan.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> deleteLoan(String id) async {
    await _api.delete('${ApiEndpoints.loans}/$id');
  }
}
