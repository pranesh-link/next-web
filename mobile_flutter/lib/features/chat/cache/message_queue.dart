import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// A message waiting to be sent when connectivity is restored.
@immutable
class PendingMessage {
  final String id;
  final String content;
  final String type;
  final DateTime createdAt;
  final String? iv;
  final bool encrypted;
  final Map<String, dynamic>? payload;

  const PendingMessage({
    required this.id,
    required this.content,
    required this.type,
    required this.createdAt,
    this.iv,
    this.encrypted = false,
    this.payload,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'content': content,
        'type': type,
        'createdAt': createdAt.toIso8601String(),
        'iv': iv,
        'encrypted': encrypted,
        'payload': payload,
      };

  factory PendingMessage.fromJson(Map<String, dynamic> json) {
    return PendingMessage(
      id: json['id'] as String,
      content: json['content'] as String,
      type: json['type'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      iv: json['iv'] as String?,
      encrypted: json['encrypted'] as bool? ?? false,
      payload: json['payload'] as Map<String, dynamic>?,
    );
  }
}

/// Persists unsent messages and flushes them in order when online.
class MessageQueue {
  static const _key = 'pending_message_queue';

  /// Add a message to the offline queue.
  static Future<void> enqueue(PendingMessage message) async {
    final queue = await getAll();
    queue.add(message);
    await _persist(queue);
  }

  /// Get all pending messages in order.
  static Future<List<PendingMessage>> getAll() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List;
    return list
        .map((e) => PendingMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Remove a specific message from the queue after successful send.
  static Future<void> dequeue(String id) async {
    final queue = await getAll();
    queue.removeWhere((m) => m.id == id);
    await _persist(queue);
  }

  /// Clear the entire queue.
  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }

  /// Check if there are queued messages.
  static Future<bool> get hasMessages async {
    final queue = await getAll();
    return queue.isNotEmpty;
  }

  static Future<void> _persist(List<PendingMessage> queue) async {
    final prefs = await SharedPreferences.getInstance();
    final json = queue.map((m) => m.toJson()).toList();
    await prefs.setString(_key, jsonEncode(json));
  }
}
