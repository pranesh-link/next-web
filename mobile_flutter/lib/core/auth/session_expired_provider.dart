import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Emits a signal when the user's session expires (refresh token invalid).
/// UI widgets listen to this to show a "Session expired" message before redirect.
final sessionExpiredProvider = StateProvider<bool>((ref) => false);
