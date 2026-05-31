import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/notifications/push_notification_service.dart';
import 'package:luvverse/core/notifications/push_providers.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/core/theme/app_typography.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';
import 'package:luvverse/features/chat/providers/online_status_provider.dart';
import 'package:luvverse/features/chat/providers/wallpaper_provider.dart';
import 'package:luvverse/features/chat/services/message_scheduler.dart';
import 'package:luvverse/features/chat/services/sound_service.dart';
import 'package:luvverse/features/chat/widgets/ai_suggestion_bar.dart';
import 'package:luvverse/features/chat/widgets/attach_menu.dart';
import 'package:luvverse/features/chat/widgets/chat_search_bar.dart';
import 'package:luvverse/features/chat/widgets/date_separator.dart';
import 'package:luvverse/features/chat/widgets/encryption_badge.dart';
import 'package:luvverse/features/chat/widgets/image_bubble.dart';
import 'package:luvverse/features/chat/widgets/link_preview_card.dart';
import 'package:luvverse/features/chat/widgets/list_bubble.dart';
import 'package:luvverse/features/chat/widgets/message_bubble.dart';
import 'package:luvverse/features/chat/widgets/message_input.dart';

import 'package:luvverse/features/chat/widgets/pinned_header.dart';
import 'package:luvverse/features/chat/widgets/reaction_picker.dart';
import 'package:luvverse/features/chat/widgets/reminder_bubble.dart';
import 'package:luvverse/features/chat/widgets/scroll_to_bottom_fab.dart';
import 'package:luvverse/features/chat/widgets/swipeable_message.dart';
import 'package:luvverse/features/chat/widgets/typing_indicator.dart';
import 'package:luvverse/features/chat/widgets/voice_bubble.dart';
import 'package:luvverse/features/chat/widgets/voice_recorder.dart';
import 'package:luvverse/features/chat/widgets/wallpaper_picker.dart';
import 'package:luvverse/features/chat/widgets/connectivity_banner.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';

/// Full chat screen composing all chat widgets.
class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _scrollController = ScrollController();
  bool _showScrollToBottom = false;
  Timer? _typingThrottle;
  int _previousMessageCount = 0;
  ChatMessage? _replyingTo;
  bool _showSearch = false;
  bool _isRecording = false;
  ChatMessage? _pinnedMessage;

  @override
  void initState() {
    super.initState();
    PushNotificationService.isChatActive = true;
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(soundServiceProvider).init();
      // Check for scheduled messages on screen open
      ref.read(messageSchedulerProvider).checkAndSend();
      // Clear badge
      ref.read(chatNotifierProvider.notifier).updateBadgeCount(0);
      // Mark messages as read when opening chat
      ref.read(chatNotifierProvider.notifier).markAsRead();
      // Wire push notification → chat refresh
      ref.read(pushNotificationServiceProvider).setOnChatMessageCallback(() {
        ref.read(chatNotifierProvider.notifier).refresh();
      });
    });
  }

  @override
  void dispose() {
    PushNotificationService.isChatActive = false;
    _scrollController.dispose();
    _typingThrottle?.cancel();
    super.dispose();
  }

  void _onScroll() {
    final shouldShow = _scrollController.hasClients &&
        _scrollController.offset > 200;
    if (shouldShow != _showScrollToBottom) {
      setState(() => _showScrollToBottom = shouldShow);
    }
  }

  void _scrollToBottom({bool animate = true}) {
    if (!_scrollController.hasClients) return;
    if (animate) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    } else {
      _scrollController.jumpTo(0);
    }
  }

  void _onSend(String text) {
    ref.read(chatNotifierProvider.notifier).sendMessage(text);
    ref.read(soundServiceProvider).playSend();
    _scrollToBottom();
    if (_replyingTo != null) {
      setState(() => _replyingTo = null);
    }
  }

  void _onTyping() {
    if (_typingThrottle?.isActive ?? false) return;
    _typingThrottle = Timer(const Duration(seconds: 3), () {});
    ref.read(chatRepositoryProvider).signalTyping();
  }

  void _onCopy(String content) {
    Clipboard.setData(ClipboardData(text: content));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Message copied'),
        duration: Duration(seconds: 1),
      ),
    );
  }

  void _onReact(String messageId) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: ['❤️', '👍', '😂', '😮', '😢', '🙏'].map((emoji) {
              return GestureDetector(
                onTap: () {
                  Navigator.pop(ctx);
                  ref.read(chatNotifierProvider.notifier)
                      .reactToMessage(messageId, emoji);
                },
                child: Text(emoji, style: const TextStyle(fontSize: 32)),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  bool _isSameDay(DateTime a, DateTime b) {
    final la = a.toLocal();
    final lb = b.toLocal();
    return la.year == lb.year && la.month == lb.month && la.day == lb.day;
  }

  void _showAttachMenu() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => AttachMenu(
        onVoiceRecord: () => setState(() => _isRecording = true),
      ),
    );
  }

  void _onMenuAction(String action) {
    switch (action) {
      case 'wallpaper':
        showModalBottomSheet(
          context: context,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
          ),
          builder: (_) => const WallpaperPicker(),
        );
      case 'refresh':
        ref.read(chatNotifierProvider.notifier).refresh();
    }
  }

  void _scrollToPinnedMessage() {
    if (_pinnedMessage == null) return;
    final messages = ref.read(chatNotifierProvider).valueOrNull ?? [];
    final index = messages.indexWhere((m) => m.id == _pinnedMessage!.id);
    if (index >= 0) {
      final reversedIndex = messages.length - 1 - index;
      final offset = reversedIndex * 70.0;
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          offset,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    }
  }

  Widget _buildOnlineStatus(BuildContext context) {
    final status = ref.watch(onlineStatusProvider);
    if (status.isOnline) {
      return Text(
        'Online',
        style: TextStyle(
          fontSize: 12,
          color: context.colors.success,
          fontWeight: FontWeight.w400,
        ),
      );
    }
    if (status.lastSeen != null) {
      return Text(
        'Last seen ${DateFormat('h:mm a').format(status.lastSeen!.toLocal())}',
        style: TextStyle(
          fontSize: 12,
          color: context.colors.textMuted,
          fontWeight: FontWeight.w400,
        ),
      );
    }
    return const SizedBox.shrink();
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatNotifierProvider);
    final isPartnerTyping = ref.watch(partnerTypingProvider);
    final currentUserId = ref.watch(dbUserIdProvider) ?? '';
    final wallpaperColor = ref.watch(wallpaperProvider);
    final isOffline = ref.watch(isOfflineProvider);

    // Auto-scroll on new messages if at bottom
    chatState.whenData((messages) {
      if (messages.length > _previousMessageCount) {
        if (!_showScrollToBottom) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _scrollToBottom(animate: true);
          });
        }
        // Haptic + sound for incoming messages from partner
        if (_previousMessageCount > 0) {
          final newest = messages.last;
          if (!newest.isFromUser(currentUserId)) {
            HapticFeedback.lightImpact();
            ref.read(soundServiceProvider).playReceive();
          }
        }
      }
      _previousMessageCount = messages.length;
    });

    return Scaffold(
      backgroundColor: wallpaperColor ?? (Theme.of(context).brightness == Brightness.dark ? const Color(0xFF1B2836) : const Color(0xFFECE5DD)),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Chat',
              style: AppTypography.cardTitle.copyWith(
                color: context.colors.text,
              ),
            ),
            if (isPartnerTyping)
              Text(
                'typing...',
                style: TextStyle(
                  fontSize: 12,
                  color: context.colors.success,
                  fontWeight: FontWeight.w400,
                ),
              )
            else
              _buildOnlineStatus(context),
          ],
        ),
        backgroundColor: context.colors.bgElevated,
        elevation: 0.5,
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => setState(() => _showSearch = !_showSearch),
          ),
          PopupMenuButton<String>(
            onSelected: _onMenuAction,
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'wallpaper', child: Text('Wallpaper')),
              const PopupMenuItem(value: 'refresh', child: Text('Refresh')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          ConnectivityBanner(isOffline: isOffline),
          if (_showSearch)
            ChatSearchBar(
              scrollController: _scrollController,
              onClose: () => setState(() => _showSearch = false),
            ),
          PinnedHeader(
            pinnedMessage: _pinnedMessage,
            onTap: () => _scrollToPinnedMessage(),
            onDismiss: () => setState(() => _pinnedMessage = null),
          ),
          const EncryptionBadge(),
          Expanded(
            child: chatState.when(
              loading: () => _buildShimmer(context),
              // On error, fall back to whatever data we have (or empty state)
              // instead of blocking the UI with a "Failed to load messages" screen.
              error: (_, __) {
                final messages = chatState.value ?? const <ChatMessage>[];
                if (messages.isEmpty) return _buildEmpty();
                return _buildMessageList(
                  messages,
                  currentUserId,
                  isPartnerTyping,
                );
              },
              data: (messages) {
                if (messages.isEmpty) return _buildEmpty();
                return _buildMessageList(
                  messages,
                  currentUserId,
                  isPartnerTyping,
                );
              },
            ),
          ),
          if (_isRecording)
            VoiceRecorder(
              onCancel: () => setState(() => _isRecording = false),
            )
          else ...[
            AiSuggestionBar(onSelect: _onSend),
            MessageInput(
              onSend: _onSend,
              onTyping: _onTyping,
              onAttach: _showAttachMenu,
              replyTo: _replyingTo,
              onCancelReply: () => setState(() => _replyingTo = null),
            ),
          ],
        ],
      ),
      floatingActionButton: _showScrollToBottom
          ? Padding(
              padding: const EdgeInsets.only(bottom: 70),
              child: ScrollToBottomFab(
                onTap: () => _scrollToBottom(),
                unreadCount: 0,
              ),
            )
          : null,
    );
  }

  Widget _buildMessageList(
    List<ChatMessage> messages,
    String currentUserId,
    bool isPartnerTyping,
  ) {
    // Messages are in chronological order (oldest first).
    // ListView is reversed, so we need to reverse the items list.
    final reversed = messages.reversed.toList();

    return ListView.builder(
      controller: _scrollController,
      reverse: true,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      itemCount: reversed.length + (isPartnerTyping ? 1 : 0),
      itemBuilder: (context, index) {
        // Typing indicator at the very top (index 0 in reversed list)
        if (isPartnerTyping && index == 0) {
          return const TypingIndicator();
        }

        final adjustedIndex = isPartnerTyping ? index - 1 : index;

        final message = reversed[adjustedIndex];
        final isMe = message.isFromUser(currentUserId);

        // Date separator: show when next message (above in UI) is a different day
        Widget? dateSeparator;
        if (adjustedIndex == reversed.length - 1) {
          // First message chronologically — always show date
          dateSeparator = DateSeparator(date: message.createdAt);
        } else {
          final nextMessage = reversed[adjustedIndex + 1];
          if (!_isSameDay(message.createdAt, nextMessage.createdAt)) {
            dateSeparator = DateSeparator(date: message.createdAt);
          }
        }

        return Column(
          children: [
            ?dateSeparator,
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.xs),
              child: SwipeableMessage(
                message: message,
                onReply: (msg) => setState(() => _replyingTo = msg),
                child: GestureDetector(
                  onDoubleTap: () => showReactionPicker(
                    context: context,
                    messageId: message.id,
                    onSelect: (emoji) => ref
                        .read(chatNotifierProvider.notifier)
                        .reactToMessage(message.id, emoji),
                  ),
                  onLongPress: () => _showMessageMenu(message, isMe),
                  child: Column(
                    crossAxisAlignment: isMe
                        ? CrossAxisAlignment.end
                        : CrossAxisAlignment.start,
                    children: [
                      _buildMessageContent(message, isMe, currentUserId),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildMessageContent(
    ChatMessage message,
    bool isMe,
    String currentUserId,
  ) {
    switch (message.type) {
      case MessageType.image:
        return ImageBubble(imageUrl: message.content, isMe: isMe);
      case MessageType.voice:
        final durationMs = message.payload?['durationMs'] as int? ?? 0;
        return VoiceBubble(
          audioUrl: message.content,
          durationMs: durationMs,
          isMe: isMe,
        );
      case MessageType.list:
        return ListBubble(message: message, isMe: isMe);
      case MessageType.reminder:
        return ReminderBubble(message: message, isMe: isMe);
      default:
        return Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            MessageBubble(
              message: message,
              isMe: isMe,
              currentUserId: currentUserId,
              onCopy: () => _onCopy(message.content),
              onReact: () => _onReact(message.id),
              onDelete: isMe
                  ? () => ref
                      .read(chatNotifierProvider.notifier)
                      .deleteMessage(message.id)
                  : null,
              onReply: () => setState(() => _replyingTo = message),
            ),
            if (message.type == MessageType.text)
              LinkPreviewCard(text: message.content),
          ],
        );
    }
  }

  void _showMessageMenu(ChatMessage message, bool isMe) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.reply),
                title: const Text('Reply'),
                onTap: () {
                  Navigator.pop(ctx);
                  setState(() => _replyingTo = message);
                },
              ),
              ListTile(
                leading: const Icon(Icons.push_pin),
                title: const Text('Pin Message'),
                onTap: () {
                  Navigator.pop(ctx);
                  setState(() => _pinnedMessage = message);
                  ref.read(chatNotifierProvider.notifier).pinMessage(message.id);
                },
              ),
              ListTile(
                leading: const Icon(Icons.copy),
                title: const Text('Copy'),
                onTap: () {
                  Navigator.pop(ctx);
                  _onCopy(message.content);
                },
              ),
              if (isMe)
                ListTile(
                  leading: Icon(Icons.delete, color: context.colors.danger),
                  title: Text('Delete', style: TextStyle(color: context.colors.danger)),
                  onTap: () {
                    Navigator.pop(ctx);
                    ref.read(chatNotifierProvider.notifier).deleteMessage(message.id);
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildShimmer(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: 8,
      itemBuilder: (context, index) {
        final isMe = index % 3 != 0;
        return Align(
          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            margin: const EdgeInsets.only(bottom: AppSpacing.sm),
            width: MediaQuery.of(context).size.width * (0.4 + (index % 3) * 0.1),
            height: 40 + (index % 2) * 20,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const EncryptionBadge(),
          const SizedBox(height: AppSpacing.xl),
          Text(
            'Say hi! 👋',
            style: AppTypography.cardTitle.copyWith(
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Start a conversation with your partner',
            style: AppTypography.small.copyWith(
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }
}
