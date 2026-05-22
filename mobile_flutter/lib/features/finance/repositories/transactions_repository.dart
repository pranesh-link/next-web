import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/transaction.dart';

class TransactionsRepository {
  final ApiClient _api;
  TransactionsRepository(this._api);

  Future<List<Transaction>> getTransactions({
    String? month,
    String? category,
    String? accountId,
    int? limit,
  }) async {
    final params = <String, dynamic>{
      if (month != null) 'month': month,
      if (category != null) 'category': category,
      if (accountId != null) 'accountId': accountId,
      if (limit != null) 'limit': limit.toString(),
    };
    final response = await _api.get<Map<String, dynamic>>(
      ApiEndpoints.transactions,
      queryParameters: params,
    );
    final list = (response['data'] as List)
        .map((e) => Transaction.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<Transaction> createTransaction({
    required String accountId,
    required double amount,
    required String type,
    required String category,
    required DateTime date,
    String? description,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.transactions,
      data: {
        'accountId': accountId,
        'amount': amount,
        'type': type,
        'category': category,
        'date': date.toIso8601String(),
        if (description != null) 'description': description,
      },
    );
    return Transaction.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<Transaction> updateTransaction({
    required String id,
    String? accountId,
    double? amount,
    String? type,
    String? category,
    DateTime? date,
    String? description,
  }) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.transactions}/$id',
      data: {
        if (accountId != null) 'accountId': accountId,
        if (amount != null) 'amount': amount,
        if (type != null) 'type': type,
        if (category != null) 'category': category,
        if (date != null) 'date': date.toIso8601String(),
        if (description != null) 'description': description,
      },
    );
    return Transaction.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> deleteTransaction(String id) async {
    await _api.delete('${ApiEndpoints.transactions}/$id');
  }
}
