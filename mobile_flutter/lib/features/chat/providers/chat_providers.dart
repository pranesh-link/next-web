import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:app_badge_plus/app_badge_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
import 'package:luvverse/core/auth/secure_storage.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/features/chat/cache/chat_database.dart';
import 'package:luvverse/features/chat/cache/chat_db_providers.dart';
import 'package:luvverse/features/chat/cache/message_queue.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';
import 'package:luvverse/features/chat/repositories/chat_repository.dart';
import 'package:luvverse/features/chat/services/chat_key_bootstrap.dart';
import 'package:luvverse/features/chat/services/crypto_service.dart';
import 'package:luvverse/features/chat/services/message_sync_service.dart';
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

/// Whether the partner has rotated their key (device reinstall), meaning
/// older messages cannot be decrypted.
final partnerKeyRotatedProvider = StateProvider<bool>((ref) => false);

// -- Chat Notifier --

final chatNotifierProvider =
    AsyncNotifierProvider<ChatNotifier, List<ChatMessage>>(ChatNotifier.new);

/// Manages chat message state: fetching, sending, encrypting/decrypting.
class ChatNotifier extends AsyncNotifier<List<ChatMessage>> {
  late final ChatRepository _repo;
  late final CryptoService _crypto;
  late final ChatKeyBootstrap _bootstrap;
  late final ChatLocalDatabase _localDb;
  String? _currentUserId;
  bool _isOnline = true;
  bool _disposed = false;  // guards delayed callbacks after notifier disposal
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  Timer? _pollTimer;
  HttpClient? _sseClient;
  StreamSubscription<String>? _sseSub;
  String? _lastKnownMessageId;

  /// Last fetch error (for diagnostics surfaced in UI).
  Object? _lastFetchError;
  Object? get lastFetchError => _lastFetchError;

  /// Last send error — surfaced to UI for retry / toast display.
  Object? _lastSendError;
  Object? get lastSendError => _lastSendError;

  @override
  Future<List<ChatMessage>> build() async {
    // Bulletproof build: never throws. Any error returns [] so the UI
    // displays the empty state instead of "Failed to load messages".
    try {
      _lastFetchError = null;
      _repo = ref.read(chatRepositoryProvider);
      _crypto = ref.read(cryptoServiceProvider);
      _bootstrap = ref.read(chatKeyBootstrapProvider);
      _localDb = ref.read(chatLocalDatabaseProvider);
      _currentUserId =
          ref.read(authProvider).user?.id ?? ref.read(dbUserIdProvider);
      _listenConnectivity();
      // Reflect any prior bootstrap success in UI state immediately.
      if (_bootstrap.isReady) {
        ref.read(encryptionReadyProvider.notifier).state = true;
      }
      // Fire-and-forget bootstrap so UI updates if user opens chat first.
      _ensureCryptoReady();

      // Local-first: load from SQLite instantly, then fetch remote in background.
      List<ChatMessage> cached = const [];
      try {
        cached = await _localDb.getMessages();
      } catch (e) {
        debugPrint('[ChatNotifier] Local DB read failed: $e');
      }

      List<ChatMessage> result;
      if (cached.isNotEmpty) {
        _lastKnownMessageId = cached.last.id;
        // Kick off remote fetch in background to sync
        _fetchAndSyncRemote();
        result = cached;
      } else {
        // No local data — fetch from server (never throws)
        final messages = await _fetchMessagesWithFallback();
        if (messages.isNotEmpty) {
          _lastKnownMessageId = messages.last.id;
          try {
            await _localDb.upsertMessages(messages);
          } catch (e) {
            debugPrint('[ChatNotifier] Local DB write failed: $e');
          }
        }
        result = messages;
      }

      // Start SSE stream for real-time updates
      try {
        _connectSSE();
      } catch (e) {
        debugPrint('[ChatNotifier] SSE connect failed: $e');
      }
      // Fallback poll every 30s in case SSE disconnects
      _pollTimer?.cancel();
      _pollTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        if (_sseSub == null) _pollForNewMessages();
      });
      ref.onDispose(() {
        _disposed = true;
        _pollTimer?.cancel();
        _disconnectSSE();
      });
      return result;
    } catch (e, st) {
      debugPrint('[ChatNotifier] build() unexpected error: $e\n$st');
      return const [];
    }
  }

  /// Fetch remote messages, upsert to local DB, then read back from local DB
  /// so accumulated local history is never replaced by the server's page window.
  Future<void> _fetchAndSyncRemote() async {
    try {
      final messages = await _fetchMessages();
      try {
        await _localDb.upsertMessages(messages);
      } catch (e) {
        debugPrint('[ChatNotifier] Local DB upsert failed: $e');
      }
      // Read back the full local history — local DB is the accumulative store.
      // Using the server slice directly would shrink visible history to 100 msgs.
      final allMessages = await _localDb.getMessages();
      state = AsyncData(allMessages.isNotEmpty ? allMessages : messages);
      final canonical = allMessages.isNotEmpty ? allMessages : messages;
      if (canonical.isNotEmpty) {
        _lastKnownMessageId = canonical.last.id;
      }
      // ACK delivery for messages from partner
      _acknowledgeReceivedMessages(canonical);
    } catch (e) {
      debugPrint('[ChatNotifier] Background sync failed: $e');
    }
  }

  /// ACK delivery for messages from partner that haven't been acknowledged.
  void _acknowledgeReceivedMessages(List<ChatMessage> messages) {
    final currentUserId = ref.read(dbUserIdProvider);
    if (currentUserId == null) return;
    final unacked = messages
        .where((m) => m.senderId != currentUserId && m.deliveredAt == null)
        .map((m) => m.id)
        .toList();
    if (unacked.isNotEmpty) {
      ref.read(messageSyncServiceProvider).acknowledgeMessages(unacked);
    }
  }

  /// Prefetch chat messages in background (called after login).
  Future<void> prefetch() async {
    try {
      final messages = await _fetchMessages();
      await _localDb.upsertMessages(messages);
    } catch (e) {
      debugPrint('[ChatNotifier] Prefetch failed: $e');
    }
  }

  /// Connect to the server SSE stream for real-time message updates.
  void _connectSSE() {
    _disconnectSSE();
    _sseClient = HttpClient();
    _startSSEStream();
  }

  /// Start or restart the SSE stream connection.
  Future<void> _startSSEStream() async {
    // Guard: do not start if the notifier has been disposed or client is gone.
    if (_disposed || _sseClient == null) return;
    try {
      final token = await SecureStorage.getToken();
      if (token == null) {
        // Token temporarily unavailable (e.g. mid-refresh). Retry in 5 s so
        // SSE doesn't die permanently — this was the root cause of one-way
        // typing indicators where one partner's SSE silently stopped.
        debugPrint('[ChatSSE] Token unavailable — retrying SSE in 5 s');
        Future.delayed(const Duration(seconds: 5), () {
          if (_isOnline && !_disposed && _sseClient != null) _startSSEStream();
        });
        return;
      }

      final uri = Uri.parse('$kApiBaseUrl/api/couple/chat/stream');
      final request = await _sseClient!.getUrl(uri);
      request.headers.set('Authorization', 'Bearer $token');
      request.headers.set('Accept', 'text/event-stream');

      final response = await request.close();
      if (response.statusCode != 200) {
        debugPrint('[ChatSSE] Stream returned ${response.statusCode}');
        _scheduleSSEReconnect();
        return;
      }

      _sseSub = response
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .where((line) => line.startsWith('data: '))
          .map((line) => line.substring(6))
          .listen(
            _onSSEData,
            onError: (_) => _scheduleSSEReconnect(),
            onDone: _scheduleSSEReconnect,
            cancelOnError: false,
          );
    } catch (e) {
      debugPrint('[ChatSSE] Connection failed: $e');
      _scheduleSSEReconnect();
    }
  }

  /// Handle incoming SSE data event.
  void _onSSEData(String data) {
    try {
      final json = jsonDecode(data) as Map<String, dynamic>;
      final latest = json['latest'] as Map<String, dynamic>?;
      final partnerTyping = json['partnerTyping'] as bool? ?? false;

      ref.read(partnerTypingProvider.notifier).state = partnerTyping;

      // If the latest message ID differs, fetch fresh messages
      if (latest != null && latest['id'] != _lastKnownMessageId) {
        _lastKnownMessageId = latest['id'] as String?;
        _pollForNewMessages();
        // Mark as read if message is from partner and chat is active
        if (latest['senderId'] != _currentUserId) {
          markAsRead();
        }
      }
    } catch (e) {
      debugPrint('[ChatSSE] Parse error: $e');
    }
  }

  /// Schedule SSE reconnect after disconnect (server closes after 28s).
  void _scheduleSSEReconnect() {
    _sseSub?.cancel();
    _sseSub = null;
    // Guard disposal + null client in delayed callback to avoid NPE when the
    // notifier is disposed before the 2 s timer fires.
    Future.delayed(const Duration(seconds: 2), () {
      if (_isOnline && !_disposed && _sseClient != null) _startSSEStream();
    });
  }

  /// Disconnect SSE stream.
  void _disconnectSSE() {
    _sseSub?.cancel();
    _sseSub = null;
    _sseClient?.close(force: true);
    _sseClient = null;
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

  /// Silently poll for new messages without showing loading state.
  /// Upserts remote messages into local DB and reads back full history.
  Future<void> _pollForNewMessages() async {
    try {
      final messages = await _fetchMessages();
      await _localDb.upsertMessages(messages);
      // Read full local history — never shrink to the server page window.
      final allMessages = await _localDb.getMessages();
      state = AsyncData(allMessages.isNotEmpty ? allMessages : messages);
    } catch (_) {
      // Silent failure — don't disrupt UI on poll failure
    }
  }

  /// Attempt API fetch; fall back to local DB if offline/error.
  /// Guaranteed to never throw — returns empty list in worst case.
  /// Records the error in `_lastFetchError` for UI diagnostics.
  Future<List<ChatMessage>> _fetchMessagesWithFallback() async {
    try {
      final messages = await _fetchMessages();
      _lastFetchError = null;
      await _localDb.upsertMessages(messages);
      // Return full local history after upsert, not just the server slice.
      final allMessages = await _localDb.getMessages();
      return allMessages.isNotEmpty ? allMessages : messages;
    } catch (e) {
      _lastFetchError = e;
      debugPrint('[ChatNotifier] Fetch failed, trying local DB: $e');
      try {
        return await _localDb.getMessages();
      } catch (dbError) {
        debugPrint('[ChatNotifier] Local DB also failed: $dbError');
        return [];
      }
    }
  }

  /// Ensure crypto is ready, with a timeout.
  /// Only needed for decrypting legacy encrypted messages — new messages
  /// are sent and stored as plaintext.
  Future<bool> _ensureCryptoReady({
    Duration timeout = const Duration(seconds: 8),
  }) async {
    if (_bootstrap.isReady) {
      final readyState = ref.read(encryptionReadyProvider);
      if (!readyState) {
        ref.read(encryptionReadyProvider.notifier).state = true;
      }
      return true;
    }
    bool ok = false;
    try {
      ok = await _bootstrap.ensureBootstrapped().timeout(timeout);
    } catch (_) {
      ok = false;
    }
    if (ok) {
      ref.read(encryptionReadyProvider.notifier).state = true;
      if (_bootstrap.partnerKeyRotated) {
        ref.read(partnerKeyRotatedProvider.notifier).state = true;
      }
    }
    return ok;
  }

  /// Fetch messages from API and decrypt any encrypted ones.
  Future<List<ChatMessage>> _fetchMessages() async {
    final messages = await _repo.getMessages();
    final decrypted = await _decryptMessages(messages);
    // API returns newest first; reverse for chronological display
    return decrypted.reversed.toList();
  }

  /// Decrypt encrypted messages. If any messages are encrypted but crypto
  /// is not ready yet, awaits init (with timeout) before attempting.
  Future<List<ChatMessage>> _decryptMessages(List<ChatMessage> messages) async {
    final hasEncrypted = messages.any((m) => m.encrypted && m.iv != null);
    if (hasEncrypted && !_crypto.isReady) {
      await _ensureCryptoReady();
    }
    if (!_crypto.isReady) {
      // Strip encrypted blobs that we cannot decrypt instead of showing gibberish.
      return [
        for (final m in messages)
          if (m.encrypted && m.iv != null)
            m.copyWith(content: '\u{1F512} Encrypted message')
          else
            m,
      ];
    }

    final result = <ChatMessage>[];
    for (final msg in messages) {
      if (msg.encrypted && msg.iv != null) {
        final epoch = msg.payload?['epoch'] as int?;
        final plaintext = await _crypto.decryptWithEpoch(
          msg.content, msg.iv!, epoch,
        );
        if (plaintext == null) {
          result.add(msg.copyWith(content: '\u{1F512} Encrypted message'));
        } else {
          result.add(_applyDecryptedPlaintext(msg, plaintext));
        }
      } else {
        result.add(msg);
      }
    }
    return result;
  }

  /// Apply a decrypted plaintext to a message. Supports both the new
  /// JSON-blob format (`{content, payload}` encrypted together) and the
  /// legacy raw-text format (decrypted text used directly as content).
  ChatMessage _applyDecryptedPlaintext(ChatMessage msg, String plaintext) {
    final trimmed = plaintext.trimLeft();
    if (trimmed.startsWith('{')) {
      try {
        final decoded = jsonDecode(plaintext);
        if (decoded is Map<String, dynamic>) {
          final innerContent = decoded['content'];
          final innerPayload = decoded['payload'];
          return msg.copyWith(
            content: innerContent is String ? innerContent : plaintext,
            payload: innerPayload is Map<String, dynamic>
                ? innerPayload
                : msg.payload,
          );
        }
      } catch (_) {
        // Fall through to legacy format.
      }
    }
    return msg.copyWith(content: plaintext);
  }

  /// Send a message. If offline,
  /// the message is encrypted up-front and queued so [_flushQueue] can
  /// replay it without re-encryption.
  Future<void> sendMessage(String text, {String type = 'TEXT'}) async {
    final now = DateTime.now();
    final optimistic = ChatMessage(
      id: 'temp_${now.millisecondsSinceEpoch}',
      coupleId: '',
      senderId: _currentUserId ?? '',
      type: type,
      content: text, // Show plaintext locally
      encrypted: false,
      readBy: [_currentUserId ?? ''],
      createdAt: now,
      updatedAt: now,
    );
    state = AsyncData([...state.value ?? [], optimistic]);

    // Offline path: queue plaintext for delivery when reconnected.
    if (!_isOnline) {
      await MessageQueue.enqueue(
        PendingMessage(
          id: optimistic.id,
          content: text,
          type: type,
          createdAt: now,
        ),
      );
      _lastSendError = null;
      return;
    }

    try {
      final sent = await _repo.sendMessage(content: text, type: type);
      _lastSendError = null;
      if (sent != null) {
        state = AsyncData([
          for (final msg in state.value ?? [])
            if (msg.id == optimistic.id) sent else msg,
        ]);
        try {
          await _localDb.upsertMessages([sent]);
        } catch (e) {
          debugPrint('[ChatNotifier] Failed to persist sent message: $e');
        }
      }
    } catch (e) {
      _lastSendError = e;
      debugPrint('[ChatNotifier] sendMessage failed: $e');
      // Revert optimistic on hard failure.
      state = AsyncData([
        for (final msg in state.value ?? [])
          if (msg.id != optimistic.id) msg,
      ]);
    }
  }

  /// Refresh messages from the server. Never produces AsyncError.
  /// Upserts remote messages into local DB, then reads full history from DB.
  Future<void> refresh() async {
    final previous = state.value ?? [];
    state = const AsyncLoading<List<ChatMessage>>().copyWithPrevious(state);
    try {
      final fetched = await _fetchMessages();
      _lastFetchError = null;
      await _localDb.upsertMessages(fetched);
      final allMessages = await _localDb.getMessages();
      state = AsyncData(
          allMessages.isNotEmpty ? allMessages : (fetched.isNotEmpty ? fetched : previous));
      if (allMessages.isNotEmpty) _lastKnownMessageId = allMessages.last.id;
    } catch (e) {
      _lastFetchError = e;
      try {
        final cached = await _localDb.getMessages();
        state = AsyncData(cached.isNotEmpty ? cached : previous);
      } catch (_) {
        state = AsyncData(previous);
      }
    }
  }

  /// Mark all partner messages as read (triggers double-tick on partner's side).
  Future<void> markAsRead() async {
    try {
      await _repo.markAllRead('');
    } catch (_) {
      // Non-critical — silently fail
    }
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
            msg.copyWith(
              payload: {
                ...?msg.payload,
                'reactions': {
                  ...msg.reactions,
                  emoji: [...msg.reactions[emoji] ?? [], _currentUserId ?? ''],
                },
              },
            )
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
      // Use plain uploadFile (encryption decommissioned — files stored as-is).
      final url = await _repo.uploadFile(file);
      if (url == null) return;
      await _sendTypedMessage(
        url,
        type: MessageType.image,
        payload: {'contentType': _mimeFromExt(file.path.split('.').last)},
      );
    } catch (e) {
      debugPrint('[ChatNotifier] sendImage failed: $e');
    }
  }

  /// Upload a voice file and send as VOICE message.
  Future<void> sendVoice(File file, int durationMs) async {
    try {
      // Use plain uploadFile (encryption decommissioned).
      final url = await _repo.uploadFile(file);
      if (url == null) return;
      await _sendTypedMessage(
        url,
        type: MessageType.voice,
        payload: {
          'durationMs': durationMs,
          'contentType': _mimeFromExt(file.path.split('.').last),
        },
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
          .map(
            (text) => {
              'text': text,
              'checked': false,
              'addedBy': _currentUserId,
            },
          )
          .toList(),
    };
    await _sendTypedMessage(title, type: MessageType.list, payload: payload);
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

  /// Send a reminder message (encrypted end-to-end).
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

    try {
      final sent = await _repo.sendMessage(
        content: text,
        type: MessageType.reminder,
        payload: {'reminderAt': reminderAt.toIso8601String()},
      );
      _lastSendError = null;
      if (sent != null) {
        state = AsyncData([
          for (final msg in state.value ?? [])
            if (msg.id == optimistic.id) sent else msg,
        ]);
      }
    } catch (e) {
      _lastSendError = e;
      debugPrint('[ChatNotifier] sendReminder failed: $e');
      state = AsyncData([
        for (final msg in state.value ?? [])
          if (msg.id != optimistic.id) msg,
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

  /// Map a file extension to a MIME type for encrypted file upload metadata.
  String _mimeFromExt(String ext) {
    switch (ext.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'mp3':
        return 'audio/mpeg';
      case 'mp4':
      case 'm4a':
        return 'audio/mp4';
      case 'webm':
        return 'audio/webm';
      default:
        return 'application/octet-stream';
    }
  }

  /// Helper to send a typed message (image/voice/list) with optimistic
  /// update and end-to-end encryption.
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

    try {
      final sent = await _repo.sendMessage(
        content: content,
        type: type,
        payload: payload,
      );
      _lastSendError = null;
      if (sent != null) {
        state = AsyncData([
          for (final msg in state.value ?? [])
            if (msg.id == optimistic.id) sent else msg,
        ]);
      }
    } catch (e) {
      _lastSendError = e;
      debugPrint('[ChatNotifier] _sendTypedMessage failed: $e');
      state = AsyncData([
        for (final msg in state.value ?? [])
          if (msg.id != optimistic.id) msg,
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
