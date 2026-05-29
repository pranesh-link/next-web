import 'package:flutter/foundation.dart';

/// Message types matching the Prisma MessageType enum.
abstract class MessageType {
  static const text = 'TEXT';
  static const list = 'LIST';
  static const reminder = 'REMINDER';
  static const aiResponse = 'AI_RESPONSE';
  static const image = 'IMAGE';
  static const voice = 'VOICE';
}

/// A single chat message in a couple's conversation.
@immutable
class ChatMessage {
  final String id;
  final String coupleId;
  final String senderId;
  final String type;
  final String content;
  final bool encrypted;
  final String? iv;
  final Map<String, dynamic>? payload;
  final DateTime? reminderAt;
  final List<String> readBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  const ChatMessage({
    required this.id,
    required this.coupleId,
    required this.senderId,
    required this.type,
    required this.content,
    required this.encrypted,
    this.iv,
    this.payload,
    this.reminderAt,
    required this.readBy,
    required this.createdAt,
    required this.updatedAt,
  });

  bool isFromUser(String userId) => senderId == userId;

  /// Reactions stored in payload.reactions as `Map<emoji, List<userId>>`
  Map<String, List<String>> get reactions {
    final r = payload?['reactions'] as Map<String, dynamic>?;
    if (r == null) return {};
    return r.map((k, v) => MapEntry(k, List<String>.from(v as List)));
  }

  /// Whether this message has been read by a specific user.
  bool isReadBy(String userId) => readBy.contains(userId);

  ChatMessage copyWith({String? content, Map<String, dynamic>? payload}) {
    return ChatMessage(
      id: id,
      coupleId: coupleId,
      senderId: senderId,
      type: type,
      content: content ?? this.content,
      encrypted: encrypted,
      iv: iv,
      payload: payload ?? this.payload,
      reminderAt: reminderAt,
      readBy: readBy,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      coupleId: json['coupleId'] as String,
      senderId: json['senderId'] as String,
      type: json['type'] as String? ?? MessageType.text,
      content: json['content'] as String,
      encrypted: json['encrypted'] as bool? ?? false,
      iv: json['iv'] as String?,
      payload: json['payload'] as Map<String, dynamic>?,
      reminderAt: json['reminderAt'] != null
          ? DateTime.parse(json['reminderAt'] as String)
          : null,
      readBy: List<String>.from(json['readBy'] as List? ?? []),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'coupleId': coupleId,
    'senderId': senderId,
    'type': type,
    'content': content,
    'encrypted': encrypted,
    'iv': iv,
    'payload': payload,
    'reminderAt': reminderAt?.toIso8601String(),
    'readBy': readBy,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}
