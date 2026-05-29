import 'dart:io';

import 'package:dio/dio.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';

/// Repository handling all chat-related API calls.
class ChatRepository {
  final ApiClient _api;

  ChatRepository(this._api);

  /// Fetch recent messages (newest first from API, reversed for display).
  Future<List<ChatMessage>> getMessages({int limit = 50}) async {
    final response = await _api.get<Map<String, dynamic>>(
      '${ApiEndpoints.chatMessages}?limit=$limit',
    );
    if (response['success'] != true) return [];
    final data = response['data'] as List? ?? [];
    return data
        .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Send a new message.
  Future<ChatMessage?> sendMessage({
    required String content,
    String type = 'TEXT',
    String? iv,
    bool encrypted = false,
    Map<String, dynamic>? payload,
  }) async {
    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.chatMessages,
      data: {
        'content': content,
        'type': type,
        if (iv != null) 'iv': iv,
        'encrypted': encrypted,
        if (payload != null) 'payload': payload,
      },
    );
    if (response['success'] != true) return null;
    return ChatMessage.fromJson(response['data'] as Map<String, dynamic>);
  }

  /// Mark all messages as read.
  Future<void> markAllRead(String coupleId) async {
    await _api.post<Map<String, dynamic>>(
      '${ApiEndpoints.chatMessages}/read',
      data: {'coupleId': coupleId},
    );
  }

  /// Get unread message count.
  Future<int> getUnreadCount() async {
    final response = await _api.get<Map<String, dynamic>>(
      '${ApiEndpoints.chatMessages}/unread',
    );
    return response['data'] as int? ?? 0;
  }

  /// Upload public key to server.
  Future<Map<String, dynamic>> uploadPublicKey(String publicKey) async {
    return await _api.post<Map<String, dynamic>>(
      ApiEndpoints.userPublicKey,
      data: {'publicKey': publicKey},
    );
  }

  /// Fetch partner's public key.
  Future<String?> getPartnerPublicKey() async {
    final response = await _api.get<Map<String, dynamic>>(
      ApiEndpoints.partnerPublicKey,
    );
    return response['publicKey'] as String?;
  }

  /// Signal that the user is typing.
  Future<void> signalTyping() async {
    await _api.post<Map<String, dynamic>>(
      ApiEndpoints.chatTyping,
      data: {},
    );
  }

  /// React to a message with an emoji.
  Future<void> reactToMessage(String messageId, String emoji) async {
    await _api.post<Map<String, dynamic>>(
      '${ApiEndpoints.chatMessages}/$messageId/react',
      data: {'emoji': emoji},
    );
  }

  /// Delete a message.
  Future<void> deleteMessage(String messageId) async {
    await _api.delete('${ApiEndpoints.chatMessages}/$messageId');
  }

  /// Get couple member names.
  Future<List<Map<String, dynamic>>> getCoupleMembers() async {
    final response = await _api.get<List<dynamic>>(ApiEndpoints.coupleMembers);
    return response.cast<Map<String, dynamic>>();
  }

  /// Upload a file (image/voice) to the server. Returns the URL.
  Future<String?> uploadFile(File file) async {
    final fileName = file.path.split('/').last;
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(file.path, filename: fileName),
    });
    final response = await _api.post<Map<String, dynamic>>(
      '/api/v1/files',
      data: formData,
    );
    return response['url'] as String?;
  }

  /// Patch a message's payload (e.g., toggling list items).
  Future<void> patchMessagePayload(
    String messageId,
    Map<String, dynamic> patch,
  ) async {
    await _api.patch(
      '${ApiEndpoints.chatMessages}/$messageId',
      data: {'payload': patch},
    );
  }

  /// Pin a message.
  Future<void> pinMessage(String messageId) async {
    await _api.post<Map<String, dynamic>>(
      '${ApiEndpoints.chatMessages}/$messageId/pin',
      data: {},
    );
  }
}
