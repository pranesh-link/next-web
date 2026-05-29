import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';

/// Search bar that filters messages by content.
class ChatSearchBar extends ConsumerStatefulWidget {
  final ScrollController scrollController;
  final VoidCallback onClose;

  const ChatSearchBar({
    super.key,
    required this.scrollController,
    required this.onClose,
  });

  @override
  ConsumerState<ChatSearchBar> createState() => _ChatSearchBarState();
}

class _ChatSearchBarState extends ConsumerState<ChatSearchBar> {
  final _controller = TextEditingController();
  List<int> _matchIndices = [];
  int _currentMatchIndex = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    if (query.trim().isEmpty) {
      setState(() {
        _matchIndices = [];
        _currentMatchIndex = 0;
      });
      return;
    }

    final messages = ref.read(chatNotifierProvider).valueOrNull ?? [];
    final lowerQuery = query.toLowerCase();
    final matches = <int>[];

    for (var i = 0; i < messages.length; i++) {
      if (messages[i].content.toLowerCase().contains(lowerQuery)) {
        matches.add(i);
      }
    }

    setState(() {
      _matchIndices = matches;
      _currentMatchIndex = matches.isNotEmpty ? 0 : 0;
    });

    if (matches.isNotEmpty) _scrollToMatch(matches.first, messages.length);
  }

  void _nextMatch(int totalMessages) {
    if (_matchIndices.isEmpty) return;
    setState(() {
      _currentMatchIndex = (_currentMatchIndex + 1) % _matchIndices.length;
    });
    _scrollToMatch(_matchIndices[_currentMatchIndex], totalMessages);
  }

  void _prevMatch(int totalMessages) {
    if (_matchIndices.isEmpty) return;
    setState(() {
      _currentMatchIndex = (_currentMatchIndex - 1 + _matchIndices.length) %
          _matchIndices.length;
    });
    _scrollToMatch(_matchIndices[_currentMatchIndex], totalMessages);
  }

  void _scrollToMatch(int messageIndex, int totalMessages) {
    // ListView is reversed so index 0 in reversed list = last message
    final reversedIndex = totalMessages - 1 - messageIndex;
    // Approximate scroll position (each item ~70px)
    final offset = reversedIndex * 70.0;
    if (widget.scrollController.hasClients) {
      widget.scrollController.animateTo(
        offset,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalMessages =
        ref.watch(chatNotifierProvider).valueOrNull?.length ?? 0;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: context.colors.bgElevated,
        border: Border(bottom: BorderSide(color: context.colors.cardBorder)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              autofocus: true,
              onChanged: _onSearch,
              decoration: InputDecoration(
                hintText: 'Search messages...',
                hintStyle: TextStyle(color: context.colors.textMuted),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                ),
                prefixIcon: Icon(
                  Icons.search,
                  color: context.colors.textMuted,
                  size: 20,
                ),
              ),
              style: const TextStyle(fontSize: 15),
            ),
          ),
          if (_matchIndices.isNotEmpty) ...[
            Text(
              '${_currentMatchIndex + 1}/${_matchIndices.length}',
              style: TextStyle(
                fontSize: 12,
                color: context.colors.textMuted,
              ),
            ),
            IconButton(
              icon: const Icon(Icons.keyboard_arrow_up, size: 20),
              onPressed: () => _prevMatch(totalMessages),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
            IconButton(
              icon: const Icon(Icons.keyboard_arrow_down, size: 20),
              onPressed: () => _nextMatch(totalMessages),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
          ],
          IconButton(
            icon: const Icon(Icons.close, size: 20),
            onPressed: widget.onClose,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          ),
        ],
      ),
    );
  }
}

/// Provider that holds the current search query for highlighting in bubbles.
final chatSearchQueryProvider = StateProvider<String>((ref) => '');
