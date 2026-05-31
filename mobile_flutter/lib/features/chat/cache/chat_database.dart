import 'dart:convert';
import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';

part 'chat_database.g.dart';

/// Drift table for locally persisting chat messages.
@DataClassName('ChatMessageRow')
class ChatMessages extends Table {
  TextColumn get id => text()();
  TextColumn get coupleId => text()();
  TextColumn get senderId => text()();
  TextColumn get type => text()();
  TextColumn get content => text()();
  BoolColumn get encrypted => boolean().withDefault(const Constant(false))();
  TextColumn get iv => text().nullable()();
  TextColumn get payload => text().nullable()();
  TextColumn get readBy => text().withDefault(const Constant('[]'))();
  DateTimeColumn get reminderAt => dateTime().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [ChatMessages])
class ChatLocalDatabase extends _$ChatLocalDatabase {
  ChatLocalDatabase(super.e);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          await m.deleteTable('chat_messages');
          await m.createAll();
        },
      );

  /// Insert or replace a batch of messages.
  Future<void> upsertMessages(List<ChatMessage> messages) async {
    await batch((b) {
      b.insertAllOnConflictUpdate(
        chatMessages,
        messages.map(_toCompanion).toList(),
      );
    });
  }

  /// Get cached messages ordered by createdAt (chronological).
  Future<List<ChatMessage>> getMessages({int limit = 200}) async {
    final query = select(chatMessages)
      ..orderBy([(t) => OrderingTerm.asc(t.createdAt)])
      ..limit(limit);
    final rows = await query.get();
    return rows.map(_fromRow).toList();
  }

  /// Delete all messages (used on logout).
  Future<void> deleteAllMessages() async {
    await delete(chatMessages).go();
  }

  /// Delete a single message by ID.
  Future<void> deleteMessageById(String messageId) async {
    await (delete(chatMessages)..where((t) => t.id.equals(messageId))).go();
  }

  ChatMessagesCompanion _toCompanion(ChatMessage msg) {
    return ChatMessagesCompanion.insert(
      id: msg.id,
      coupleId: msg.coupleId,
      senderId: msg.senderId,
      type: msg.type,
      content: msg.content,
      encrypted: Value(msg.encrypted),
      iv: Value(msg.iv),
      payload: Value(msg.payload != null ? jsonEncode(msg.payload) : null),
      readBy: Value(jsonEncode(msg.readBy)),
      reminderAt: Value(msg.reminderAt),
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    );
  }

  ChatMessage _fromRow(ChatMessageRow row) {
    return ChatMessage(
      id: row.id,
      coupleId: row.coupleId,
      senderId: row.senderId,
      type: row.type,
      content: row.content,
      encrypted: row.encrypted,
      iv: row.iv,
      payload: row.payload != null
          ? jsonDecode(row.payload!) as Map<String, dynamic>
          : null,
      readBy: (jsonDecode(row.readBy) as List).cast<String>(),
      reminderAt: row.reminderAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    );
  }
}

/// Opens the chat-specific local database (unencrypted — messages are
/// already E2E encrypted at the application layer).
Future<ChatLocalDatabase> openChatDatabase() async {
  final dir = await getApplicationDocumentsDirectory();
  final dbFile = File(p.join(dir.path, 'chat.db'));
  final executor = NativeDatabase.createInBackground(dbFile);
  return ChatLocalDatabase(executor);
}
