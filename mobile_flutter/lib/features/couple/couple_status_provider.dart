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
  final response =
      await api.get<Map<String, dynamic>>(ApiEndpoints.couple);
  final data = response['data'];
  if (data is! Map<String, dynamic>) return false;
  final members = data['members'];
  if (members is! List) return false;
  return members.length >= 2;
});
