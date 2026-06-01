import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Stores an invite token that arrived via deep link before the user
/// was authenticated. Cleared after the user lands on InviteScreen.
final pendingInviteTokenProvider = StateProvider<String?>((ref) => null);
