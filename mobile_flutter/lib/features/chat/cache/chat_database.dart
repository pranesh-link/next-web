import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqlite3/open.dart';
import 'package:sqlcipher_flutter_libs/sqlcipher_flutter_libs.dart';
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
  DateTimeColumn get deliveredAt => dateTime().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [ChatMessages])
class ChatLocalDatabase extends _$ChatLocalDatabase {
  ChatLocalDatabase(super.e);

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            await m.database.customStatement(
              'ALTER TABLE chat_messages ADD COLUMN delivered_at INTEGER',
            );
          }
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

  /// Mark messages as delivered locally (double-tick).
  Future<void> markDelivered(List<String> messageIds) async {
    await (update(chatMessages)
          ..where((t) => t.id.isIn(messageIds)))
        .write(ChatMessagesCompanion(
      deliveredAt: Value(DateTime.now()),
    ));
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
      deliveredAt: Value(msg.deliveredAt),
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
      deliveredAt: row.deliveredAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    );
  }
}

/// Opens the chat-specific local database with SQLCipher encryption.
///
/// A per-device AES-256 key is generated on first launch and stored in
/// [FlutterSecureStorage] (Android EncryptedSharedPreferences / iOS Keychain).
/// The key is applied via `PRAGMA key` immediately after opening, so the
/// database file is unreadable without the device key.
///
/// Migration note: if the database file exists from a previous version that
/// did not apply a cipher key, it is deleted so a fresh encrypted file is
/// created. The local DB is a cache — messages are re-synced from the server
/// on the next fetch.
Future<ChatLocalDatabase> openChatDatabase() async {
  if (Platform.isAndroid) {
    open.overrideFor(OperatingSystem.android, openCipherOnAndroid);
  }

  final dir = await getApplicationDocumentsDirectory();
  final dbFile = File(p.join(dir.path, 'chat.db'));

  const storage = FlutterSecureStorage(
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  const keyStorageKey = 'chat_db_encryption_key';
  var encKey = await storage.read(key: keyStorageKey);

  if (encKey == null) {
    // First launch with encryption: delete any existing unencrypted file to
    // prevent SQLITE_NOTADB when PRAGMA key is applied to a plaintext DB.
    if (await dbFile.exists()) {
      await dbFile.delete();
    }
    // Generate a cryptographically random 32-byte key, encode as base64.
    final rng = Random.secure();
    final keyBytes = Uint8List.fromList(
      List.generate(32, (_) => rng.nextInt(256)),
    );
    encKey = base64Encode(keyBytes);
    await storage.write(key: keyStorageKey, value: encKey);
  }

  final cipherKey = encKey;

  final executor = NativeDatabase(
    dbFile,
    setup: (rawDb) {
      // Must be the first statement executed on every connection.
      rawDb.execute("PRAGMA key = '$cipherKey'");
    },
  );
  return ChatLocalDatabase(executor);
}
