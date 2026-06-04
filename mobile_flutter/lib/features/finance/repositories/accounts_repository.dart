import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/account.dart';

class AccountsRepository {
  final ApiClient _api;
  AccountsRepository(this._api);

  Future<List<Account>> getAccounts() async {
    final response = await _api.get<Map<String, dynamic>>(ApiEndpoints.accounts);
    final list = (response['data'] as List)
        .map((e) => Account.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  /// Returns the raw API response map including `data` and `currentUserId`.
  Future<Map<String, dynamic>> getAccountsRaw() async {
    return await _api.get<Map<String, dynamic>>(ApiEndpoints.accounts);
  }

  Future<Account> createAccount({
    required String name,
    required String type,
    required double balance,
    String? nickname,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.accounts,
      data: {
        'name': name,
        'type': type,
        'balance': balance,
        if (nickname != null) 'nickname': nickname,
      },
    );
    return Account.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<Account> updateAccount({
    required String id,
    String? name,
    String? type,
    double? balance,
    String? nickname,
  }) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.accounts}/$id',
      data: {
        if (name != null) 'name': name,
        if (type != null) 'type': type,
        if (balance != null) 'balance': balance,
        if (nickname != null) 'nickname': nickname,
      },
    );
    return Account.fromJson(response['data'] as Map<String, dynamic>);
  }

  /// Generic update that sends arbitrary fields to PUT /accounts/:id.
  Future<Account> updateAccountData(String id, Map<String, dynamic> data) async {
    final response = await _api.put<Map<String, dynamic>>(
      '${ApiEndpoints.accounts}/$id',
      data: data,
    );
    return Account.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> deleteAccount(String id) async {
    await _api.delete('${ApiEndpoints.accounts}/$id');
  }

  /// Fetches a single account with its balance history (last 20 entries).
  Future<Map<String, dynamic>> getAccountDetail(String id) async {
    return await _api.get<Map<String, dynamic>>('${ApiEndpoints.accounts}/$id');
  }
}
