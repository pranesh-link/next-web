import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/features/finance/repositories/couple_repository.dart';

/// Whether the current user has an accepted couple (partner joined).
/// Used to guard the Chat tab visibility.
final hasCoupleProvider = FutureProvider<bool>((ref) async {
  final repo = CoupleRepository(ref.read(apiClientProvider));
  final couple = await repo.getCouple();
  if (couple == null) return false;
  // A couple with 2 members means partner has accepted
  return couple.members.length >= 2;
});
