import 'dart:async';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:app_badge_plus/app_badge_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/features/chat/cache/chat_cache.dart';
import 'package:luvverse/features/chat/cache/message_queue.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';
import 'package:luvverse/features/chat/repositories/chat_repository.dart';
import 'package:luvverse/features/chat/services/crypto_service.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';

// -- Repository --

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(ref.read(apiClientProvider));
});

// -- Crypto --

final cryptoServiceProvider = Provider<CryptoService>((ref) {
  return CryptoService();
});

// -- State --

/// Whether E2E encryption is initialized and ready.
final encryptionReadyProvider = StateProvider<bool>((ref) => false);

/// Whether the partner is currently typing.
final partnerTypingProvider = StateProvider<bool>((ref) => false);

/// Whether the device is currently offline.
final isOfflineProvider = StateProvider<bool>((ref) => false);

// -- Chat Notifier --

final chatNotifierProvider =
    AsyncNotifierProvider<ChatNotifier, List<ChatMessage>>(
  ChatNotifier.new,
);

/// Manages chat message state: fetching, sending, encrypting/decrypting.
class ChatNotifier extends AsyncNotifier<List<ChatMessage>> {
  late final ChatRepository _repo;
  late final CryptoService _crypto;
  String? _currentUserId;
  bool _isOnline = true;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;

  @override
  Future<List<ChatMessage>> build() async {
    _repo = ref.read(chatRepositoryProvider);
    _crypto = ref.read(cryptoServiceProvider);
    _currentUserId = ref.read(dbUserIdProvider);
    _listenConnectivity();
    await _initCrypto();
    return _fetchMessagesWithFallback();
  }

  /// Listen to connectivity changes and flush queue when back online.
  void _listenConnectivity() {
    _connectivitySub?.cancel();
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final online = results.any((r) => r != ConnectivityResult.none);
      _isOnline = online;
      ref.read(isOfflineProvider.notifier).state = !online;
      if (online) {
        _flushQueue();
      }
    });
    ref.onDispose(() => _connectivitySub?.cancel());
  }

  /// Attempt API fetch; fall back to cache if offline/error.
  Future<List<ChatMessage>> _fetchMessagesWithFallback() async {
    try {
      final messages = await _fetchMessages();
      // Cache successfully fetched messages
      await ChatCache.cacheMessages(messages);
      _isOnline = true;
      ref.read(isOfflineProvider.notifier).state = false;
      return messages;
    } catch (e) {
      debugPrint('[ChatNotifier] Fetch failed, loading from cache: $e');
      _isOnline = false;
      ref.read(isOfflineProvider.notifier).state = true;
      return ChatCache.getCachedMessages();
    }
  }

  /// Initialize E2E encryption: generate/load keys, upload, derive shared key.
  Future<void> _initCrypto() async {
    try {
      // Generate key pair if not already present
      if (!await _crypto.hasKeyPair()) {
        await _crypto.generateKeyPair();
      }

      // Upload our public key (server returns existing if already set)
      final publicKey = await _crypto.exportPublicKeyBase64();
      if (publicKey != null) {
        await _repo.uploadPublicKey(publicKey);
      }

      // Fetch partner's public key and derive shared secret
      final partnerKey = await _repo.getPartnerPublicKey();
      if (partnerKey != null) {
        await _crypto.deriveSharedKey(partnerKey);
        ref.read(encryptionReadyProvider.notifier).state = true;
      }
    } catch (e) {
      debugPrint('[ChatNotifier] Crypto init failed: $e');
      // Chat still works without encryption
    }
  }

  /// Fetch messages from API and decrypt any encrypted ones.
  Future<List<ChatMessage>> _fetchMessages() async {
    final messages = await _repo.getMessages();
    final decrypted = await _decryptMessages(messages);
    // API returns newest first; reverse for chronological display
    return decrypted.reversed.toList();
  }

  /// Decrypt encrypted messages in-place.
  Future<List<ChatMessage>> _decryptMessages(List<ChatMessage> messages) async {
    if (!_crypto.isReady) return messages;

    final result = <ChatMessage>[];
    for (final msg in messages) {
      if (msg.encrypted && msg.iv != null) {
        final plaintext = await _crypto.decrypt(msg.content, msg.iv!);
        result.add(plaintext != null ? msg.copyWith(content: plaintext) : msg);
      } else {
        result.add(msg);
      }
    }
    return result;
  }

  /// Send a message, encrypting if encryption is ready.
  /// If offline, queues the message and shows it optimistically.
  Future<void> sendMessage(String text, {String type = 'TEXT'}) async {
    String content = text;
    String? iv;
    bool encrypted = false;

    if (_crypto.isReady) {
      final result = await _crypto.encrypt(text);
      if (result != null) {
        content = result['ciphertext']!;
        iv = result['iv']!;
        encrypted = true;
      }
    }

    // Optimistic: add a local placeholder immediately
    final now = DateTime.now();
    final optimistic = ChatMessage(
      id: 'temp_${now.millisecondsSinceEpoch}',
      coupleId: '',
      senderId: _currentUserId ?? '',
      type: type,
      content: text, // Show plaintext locally
      encrypted: encrypted,
      iv: iv,
      readBy: [_currentUserId ?? ''],
      createdAt: now,
      updatedAt: now,
    );

    state = AsyncData([...state.value ?? [], optimistic]);

    // If offline, queue for later
    if (!_isOnline) {
      await MessageQueue.enqueue(PendingMessage(
        id: optimistic.id,
        content: content,
        type: type,
        createdAt: now,
        iv: iv,
        encrypted: encrypted,
      ));
      return;
    }

    // Actual API call
    final sent = await _repo.sendMessage(
      content: content,
      type: type,
      iv: iv,
      encrypted: encrypted,
    );

    if (sent != null) {
      // Replace optimistic message with server response (decrypted)
      final decrypted = sent.encrypted && sent.iv != null && _crypto.isReady
          ? sent.copyWith(
              content: await _crypto.decrypt(sent.content, sent.iv!) ?? text)
          : sent;
      state = AsyncData([
        for (final msg in state.value ?? [])
          if (msg.id == optimistic.id) decrypted else msg,
      ]);
    }
  }

  /// Refresh messages from the server.
  Future<void> refresh() async {
    state = const AsyncLoading<List<ChatMessage>>().copyWithPrevious(state);
    state = await AsyncValue.guard(() => _fetchMessagesWithFallback());
  }

  /// Flush the offline queue: send all pending messages in order.
  Future<void> _flushQueue() async {
    final pending = await MessageQueue.getAll();
    if (pending.isEmpty) return;

    for (final msg in pending) {
      try {
        await _repo.sendMessage(
          content: msg.content,
          type: msg.type,
          iv: msg.iv,
          encrypted: msg.encrypted,
          payload: msg.payload,
        );
        await MessageQueue.dequeue(msg.id);
      } catch (e) {
        debugPrint('[ChatNotifier] Queue flush failed for ${msg.id}: $e');
        break; // Stop on first failure to maintain order
      }
    }

    // Refresh to get server-confirmed messages
    await refresh();
  }

  /// React to a message with an emoji (optimistic update).
  Future<void> reactToMessage(String messageId, String emoji) async {
    // Optimistic update
    state.whenData((messages) {
      state = AsyncData([
        for (final msg in messages)
          if (msg.id == messageId)
            msg.copyWith(payload: {
              ...?msg.payload,
              'reactions': {
                ...msg.reactions,
                emoji: [
                  ...msg.reactions[emoji] ?? [],
                  _currentUserId ?? '',
                ],
              },
            })
          else
            msg,
      ]);
    });

    try {
      await _repo.reactToMessage(messageId, emoji);
    } catch (e) {
      // Revert on failure by re-fetching
      await refresh();
    }
  }

  /// Delete a message (optimistic removal).
  Future<void> deleteMessage(String messageId) async {
    final previous = state.value;
    state = AsyncData([
      for (final msg in state.value ?? [])
        if (msg.id != messageId) msg,
    ]);

    try {
      await _repo.deleteMessage(messageId);
    } catch (e) {
      // Revert on failure
      if (previous != null) state = AsyncData(previous);
    }
  }

  /// Upload an image file and send as IMAGE message.
  Future<void> sendImage(File file) async {
    try {
      final url = await _repo.uploadFile(file);
      if (url == null) return;
      await _sendTypedMessage(url, type: MessageType.image);
    } catch (e) {
      debugPrint('[ChatNotifier] sendImage failed: $e');
    }
  }

  /// Upload a voice file and send as VOICE message.
  Future<void> sendVoice(File file, int durationMs) async {
    try {
      final url = await _repo.uploadFile(file);
      if (url == null) return;
      await _sendTypedMessage(
        url,
        type: MessageType.voice,
        payload: {'durationMs': durationMs},
      );
    } catch (e) {
      debugPrint('[ChatNotifier] sendVoice failed: $e');
    }
  }

  /// Send a shared list message.
  Future<void> sendList({
    required String title,
    required List<String> items,
  }) async {
    final payload = {
      'title': title,
      'items': items
          .map((text) => {
                'text': text,
                'checked': false,
                'addedBy': _currentUserId,
              })
          .toList(),
    };
    await _sendTypedMessage(
      title,
      type: MessageType.list,
      payload: payload,
    );
  }

  /// Toggle a list item's checked state.
  Future<void> toggleListItem(String messageId, int index, bool checked) async {
    state.whenData((messages) {
      state = AsyncData([
        for (final msg in messages)
          if (msg.id == messageId)
            _toggleItemInMessage(msg, index, checked)
          else
            msg,
      ]);
    });

    try {
      await _repo.patchMessagePayload(messageId, {
        'itemIndex': index,
        'checked': checked,
      });
    } catch (e) {
      await refresh();
    }
  }

  ChatMessage _toggleItemInMessage(ChatMessage msg, int index, bool checked) {
    final payload = Map<String, dynamic>.from(msg.payload ?? {});
    final items = List<Map<String, dynamic>>.from(
      (payload['items'] as List?)?.cast<Map<String, dynamic>>() ?? [],
    );
    if (index >= 0 && index < items.length) {
      items[index] = {...items[index], 'checked': checked};
    }
    payload['items'] = items;
    return msg.copyWith(payload: payload);
  }

  /// Send a reminder message.
  Future<void> sendReminder({
    required String text,
    required DateTime reminderAt,
  }) async {
    final now = DateTime.now();
    final optimistic = ChatMessage(
      id: 'temp_${now.millisecondsSinceEpoch}',
      coupleId: '',
      senderId: _currentUserId ?? '',
      type: MessageType.reminder,
      content: text,
      encrypted: false,
      reminderAt: reminderAt,
      readBy: [_currentUserId ?? ''],
      createdAt: now,
      updatedAt: now,
    );

    state = AsyncData([...state.value ?? [], optimistic]);

    final sent = await _repo.sendMessage(
      content: text,
      type: MessageType.reminder,
      payload: {'reminderAt': reminderAt.toIso8601String()},
    );

    if (sent != null) {
      state = AsyncData([
        for (final msg in state.value ?? [])
          if (msg.id == optimistic.id) sent else msg,
      ]);
    }
  }

  /// Pin a message by ID.
  Future<void> pinMessage(String messageId) async {
    try {
      await _repo.pinMessage(messageId);
    } catch (e) {
      debugPrint('[ChatNotifier] pinMessage failed: $e');
    }
  }

  /// Helper to send a typed message with optimistic update.
  Future<void> _sendTypedMessage(
    String content, {
    required String type,
    Map<String, dynamic>? payload,
  }) async {
    final now = DateTime.now();
    final optimistic = ChatMessage(
      id: 'temp_${now.millisecondsSinceEpoch}',
      coupleId: '',
      senderId: _currentUserId ?? '',
      type: type,
      content: content,
      encrypted: false,
      payload: payload,
      readBy: [_currentUserId ?? ''],
      createdAt: now,
      updatedAt: now,
    );

    state = AsyncData([...state.value ?? [], optimistic]);

    final sent = await _repo.sendMessage(
      content: content,
      type: type,
      payload: payload,
    );

    if (sent != null) {
      state = AsyncData([
        for (final msg in state.value ?? [])
          if (msg.id == optimistic.id) sent else msg,
      ]);
    }
  }

  /// Update badge count based on unread messages.
  void updateBadgeCount(int count) {
    AppBadgePlus.updateBadge(count);
  }
}

/// Provides the count of unread messages for the current user.
final unreadCountProvider = Provider<int>((ref) {
  final chatState = ref.watch(chatNotifierProvider);
  final userId = ref.watch(dbUserIdProvider);
  if (userId == null) return 0;

  return chatState.when(
    data: (messages) => messages
        .where((msg) => !msg.isFromUser(userId) && !msg.isReadBy(userId))
        .length,
    loading: () => 0,
    error: (_, _) => 0,
  );
});

/// Tracks the currently pinned message (if any).
final pinnedMessageProvider = StateProvider<ChatMessage?>((ref) => null);
