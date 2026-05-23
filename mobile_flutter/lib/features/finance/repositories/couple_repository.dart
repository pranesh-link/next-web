import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/couple.dart';

/// Repository for couple management operations.
class CoupleRepository {
  final ApiClient _api;
  CoupleRepository(this._api);

  Future<Couple?> getCouple() async {
    try {
      final response =
          await _api.get<Map<String, dynamic>>(ApiEndpoints.couple);
      final data = response['data'];
      if (data == null) return null;
      return Couple.fromJson(data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<Couple> createCouple({required String name}) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.couple,
      data: {'name': name},
    );
    return Couple.fromJson(response['data'] as Map<String, dynamic>);
  }

  Future<void> invitePartner({required String email}) async {
    await _api.post<Map<String, dynamic>>(
      '${ApiEndpoints.couple}/invite',
      data: {'email': email},
    );
  }

  Future<void> acceptInvite({required String token}) async {
    await _api.post<Map<String, dynamic>>(
      '${ApiEndpoints.couple}/accept',
      data: {'token': token},
    );
  }

  Future<void> leaveCouple() async {
    await _api.post<Map<String, dynamic>>(
      '${ApiEndpoints.couple}/leave',
      data: {},
    );
  }

  Future<void> disbandCouple() async {
    await _api.delete('${ApiEndpoints.couple}');
  }
}
