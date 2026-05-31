import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/features/chat/cache/chat_database.dart';

/// Provider for the chat-specific local database.
/// Overridden in main.dart with the actual instance.
final chatLocalDatabaseProvider = Provider<ChatLocalDatabase>((ref) {
  throw UnimplementedError('Must be overridden in ProviderScope');
});
