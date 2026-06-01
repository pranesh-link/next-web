import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/core/network/api_exceptions.dart';
import 'package:luvverse/models/couple.dart';

/// Repository for couple management operations.
class CoupleRepository {
  final ApiClient _api;
  CoupleRepository(this._api);

  /// Fetches the current user's couple.
  /// 
  /// Returns the [Couple] if the user is in a couple, null if they have no couple.
  /// Throws [NetworkException] on network errors, [DioException] on other API errors.
  Future<Couple?> getCouple() async {
    try {
      final response =
          await _api.get<Map<String, dynamic>>(ApiEndpoints.couple);
      developer.log('getCouple response: $response', name: 'CoupleRepository');
      final data = response['data'];
      if (data == null) {
        developer.log('getCouple: data is null (no couple)', name: 'CoupleRepository');
        return null;
      }
      final couple = Couple.fromJson(data as Map<String, dynamic>);
      developer.log('getCouple: parsed couple with ${couple.members.length} members', name: 'CoupleRepository');
      return couple;
    } on NetworkException {
      developer.log('getCouple: network error', name: 'CoupleRepository');
      rethrow; // Let caller handle offline state
    } on DioException catch (e, stackTrace) {
      developer.log('getCouple DioException: ${e.response?.statusCode} ${e.message}', 
          name: 'CoupleRepository', error: e, stackTrace: stackTrace);
      rethrow; // Let caller handle API errors (401 etc)
    } catch (e, stackTrace) {
      // Parse errors or unexpected exceptions — log and rethrow
      developer.log('getCouple unexpected error: $e', name: 'CoupleRepository', error: e, stackTrace: stackTrace);
      rethrow;
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
