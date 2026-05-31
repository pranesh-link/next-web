import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/features/chat/cache/chat_database.dart';
import 'package:luvverse/features/chat/cache/chat_db_providers.dart';
import 'package:luvverse/features/chat/repositories/chat_repository.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';

/// Handles delivery acknowledgment of messages to the server.
/// After mobile receives and stores messages locally, it sends ACKs
/// so the server can purge them (ephemeral relay model).
class MessageSyncService {
  MessageSyncService(this._repo, this._db);

  final ChatRepository _repo;
  final ChatLocalDatabase _db;

  /// Acknowledge a batch of message IDs to the server.
  /// On success, the server marks them delivered and will purge after 1 hour.
  Future<void> acknowledgeMessages(List<String> messageIds) async {
    if (messageIds.isEmpty) return;

    try {
      final success = await _repo.acknowledgeDelivery(messageIds);
      if (success) {
        debugPrint(
            '[MessageSync] ACKed ${messageIds.length} messages to server');
      }
    } catch (e) {
      // Non-critical — server will retain until next ACK or 30-day purge
      debugPrint('[MessageSync] ACK failed: $e');
    }
  }

  /// Get count of messages in local DB.
  Future<int> getLocalMessageCount() async {
    final messages = await _db.getMessages(limit: 100000);
    return messages.length;
  }

  /// Export all local messages as a byte buffer (for backup).
  Future<List<Map<String, dynamic>>> exportAllMessages() async {
    final messages = await _db.getMessages(limit: 100000);
    return messages.map((m) {
      return <String, dynamic>{
        'id': m.id,
        'coupleId': m.coupleId,
        'senderId': m.senderId,
        'type': m.type,
        'content': m.content,
        'encrypted': m.encrypted,
        'iv': m.iv,
        'payload': m.payload,
        'readBy': m.readBy,
        'reminderAt': m.reminderAt?.toIso8601String(),
        'createdAt': m.createdAt.toIso8601String(),
        'updatedAt': m.updatedAt.toIso8601String(),
      };
    }).toList();
  }
}

final messageSyncServiceProvider = Provider<MessageSyncService>((ref) {
  return MessageSyncService(
    ref.read(chatRepositoryProvider),
    ref.read(chatLocalDatabaseProvider),
  );
});
