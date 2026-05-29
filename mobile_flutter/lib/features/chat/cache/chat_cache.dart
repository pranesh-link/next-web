import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';

/// Caches the last 100 chat messages in SharedPreferences as JSON.
class ChatCache {
  static const _key = 'cached_chat_messages';
  static const _maxMessages = 100;

  /// Persist messages to local storage (keeps newest 100).
  static Future<void> cacheMessages(List<ChatMessage> messages) async {
    final prefs = await SharedPreferences.getInstance();
    final trimmed = messages.length > _maxMessages
        ? messages.sublist(messages.length - _maxMessages)
        : messages;
    final json = trimmed.map((m) => m.toJson()).toList();
    await prefs.setString(_key, jsonEncode(json));
  }

  /// Retrieve cached messages from local storage.
  static Future<List<ChatMessage>> getCachedMessages() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List;
    return list
        .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Clear all cached messages.
  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
