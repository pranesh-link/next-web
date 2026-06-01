import 'dart:developer' as developer;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';

/// Whether the current user has an accepted couple (partner joined).
///
/// Lightweight check that reads the raw JSON without instantiating the full
/// `Couple` model — avoids parse failures (e.g. nullable `user.name`) from
/// hiding the Chat tab. Throws on network/auth errors so callers can
/// distinguish loading/error from a confirmed "no couple" state.
final hasCoupleProvider = FutureProvider<bool>((ref) async {
  final api = ref.read(apiClientProvider);
  try {
    final response =
        await api.get<Map<String, dynamic>>(ApiEndpoints.couple);
    developer.log('hasCoupleProvider response: $response', name: 'hasCoupleProvider');
    final data = response['data'];
    if (data is! Map<String, dynamic>) {
      developer.log('hasCoupleProvider: data is not a map, returning false', name: 'hasCoupleProvider');
      return false;
    }
    final members = data['members'];
    if (members is! List) {
      developer.log('hasCoupleProvider: members is not a list, returning false', name: 'hasCoupleProvider');
      return false;
    }
    developer.log('hasCoupleProvider: ${members.length} members, hasCouple=${members.length >= 2}', name: 'hasCoupleProvider');
    return members.length >= 2;
  } catch (e, stackTrace) {
    developer.log('hasCoupleProvider error: $e', name: 'hasCoupleProvider', error: e, stackTrace: stackTrace);
    rethrow;
  }
});
