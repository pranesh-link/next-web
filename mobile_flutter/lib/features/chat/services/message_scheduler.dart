import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _scheduledKey = 'chat_scheduled_messages';

/// A message scheduled for future sending.
class ScheduledMessage {
  final String content;
  final String type;
  final DateTime scheduledAt;
  final Map<String, dynamic>? payload;

  const ScheduledMessage({
    required this.content,
    required this.type,
    required this.scheduledAt,
    this.payload,
  });

  Map<String, dynamic> toJson() => {
    'content': content,
    'type': type,
    'scheduledAt': scheduledAt.toIso8601String(),
    if (payload != null) 'payload': payload,
  };

  factory ScheduledMessage.fromJson(Map<String, dynamic> json) {
    return ScheduledMessage(
      content: json['content'] as String,
      type: json['type'] as String? ?? 'TEXT',
      scheduledAt: DateTime.parse(json['scheduledAt'] as String),
      payload: json['payload'] as Map<String, dynamic>?,
    );
  }
}

/// Service that stores and checks scheduled messages.
/// On app foreground, checks for messages past their scheduled time and sends.
class MessageScheduler {
  final Ref _ref;

  MessageScheduler(this._ref);

  /// Load scheduled messages from SharedPreferences.
  Future<List<ScheduledMessage>> getScheduled() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_scheduledKey);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List;
    return list
        .map((e) => ScheduledMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Schedule a message for later sending.
  Future<void> schedule(ScheduledMessage msg) async {
    final current = await getScheduled();
    current.add(msg);
    await _save(current);
  }

  /// Check and send any due messages. Call on app resume.
  Future<void> checkAndSend() async {
    final scheduled = await getScheduled();
    if (scheduled.isEmpty) return;

    final now = DateTime.now();
    final due = scheduled.where((m) => m.scheduledAt.isBefore(now)).toList();
    final remaining = scheduled.where((m) => !m.scheduledAt.isBefore(now)).toList();

    for (final msg in due) {
      try {
        await _ref.read(chatNotifierProvider.notifier).sendMessage(
          msg.content,
          type: msg.type,
        );
      } catch (e) {
        debugPrint('[MessageScheduler] Failed to send scheduled: $e');
        // Keep failed messages for next attempt
        remaining.add(msg);
      }
    }

    await _save(remaining);
  }

  /// Remove a scheduled message by index.
  Future<void> cancel(int index) async {
    final current = await getScheduled();
    if (index >= 0 && index < current.length) {
      current.removeAt(index);
      await _save(current);
    }
  }

  Future<void> _save(List<ScheduledMessage> messages) async {
    final prefs = await SharedPreferences.getInstance();
    final json = jsonEncode(messages.map((m) => m.toJson()).toList());
    await prefs.setString(_scheduledKey, json);
  }
}

/// Provider for the message scheduler service.
final messageSchedulerProvider = Provider<MessageScheduler>((ref) {
  return MessageScheduler(ref);
});
