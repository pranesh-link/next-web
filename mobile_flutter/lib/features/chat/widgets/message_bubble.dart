import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';

/// iMessage-style message bubble with read receipts and reactions.
class MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;
  final String currentUserId;
  final VoidCallback? onReact;
  final VoidCallback? onDelete;
  final VoidCallback? onCopy;
  final VoidCallback? onReply;
  /// Whether this bubble is the last consecutive message from this sender.
  /// Controls whether the tail is drawn.
  final bool isTail;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isMe,
    required this.currentUserId,
    this.onReact,
    this.onDelete,
    this.onCopy,
    this.onReply,
    this.isTail = true,
  });

  // iMessage colours
  static const _sentColor    = Color(0xFF1A73E8); // blue
  static const _receivedColor = Color(0xFFE9E9EB); // light grey
  static const _sentTextColor = Colors.white;
  static const _receivedTextColor = Color(0xFF1A1A1A);
  static const _receiptReadColor   = Color(0xFF4FC3F7); // blue double-tick
  static const _receiptSentColor   = Color(0xFF8E8E93); // grey single tick

  @override
  Widget build(BuildContext context) {
    final time = DateFormat('h:mm a').format(message.createdAt.toLocal());
    final reactions = message.reactions;
    final hasReactions = reactions.isNotEmpty;
    final bubbleColor = isMe ? _sentColor : _receivedColor;
    final textColor = isMe ? _sentTextColor : _receivedTextColor;

    // Tail corner: 2px; non-tail corner: 18px
    final tailRadius = isTail ? const Radius.circular(2) : const Radius.circular(18);
    final borderRadius = BorderRadius.only(
      topLeft: const Radius.circular(18),
      topRight: const Radius.circular(18),
      bottomLeft: isMe ? const Radius.circular(18) : tailRadius,
      bottomRight: isMe ? tailRadius : const Radius.circular(18),
    );

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: GestureDetector(
        onLongPress: () => _showContextMenu(context),
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.75,
          ),
          child: Column(
            crossAxisAlignment:
                isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              // ── Bubble + floating reactions ──
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 9,
                    ),
                    decoration: BoxDecoration(
                      color: bubbleColor,
                      borderRadius: borderRadius,
                    ),
                    child: Text(
                      message.content,
                      style: TextStyle(
                        fontSize: 15,
                        color: textColor,
                        height: 1.35,
                      ),
                    ),
                  ),
                  if (hasReactions)
                    Positioned(
                      bottom: -10,
                      right: isMe ? 6 : null,
                      left: isMe ? null : 6,
                      child: _buildReactions(context),
                    ),
                ],
              ),
              // ── Time + read receipt (outside bubble) ──
              Padding(
                padding: EdgeInsets.only(
                  top: hasReactions ? 14 : 3,
                  left: isMe ? 0 : 4,
                  right: isMe ? 4 : 0,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      time,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF8E8E93),
                      ),
                    ),
                    if (isMe) ...[
                      const SizedBox(width: 3),
                      _buildReadReceipt(),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReadReceipt() {
    // Blue double-tick = read; grey single tick = delivered/sent
    final isRead =
        message.readBy.any((id) => id != currentUserId && id.isNotEmpty);
    if (isRead) {
      return const Icon(Icons.done_all, size: 14, color: _receiptReadColor);
    }
    return const Icon(Icons.done, size: 14, color: _receiptSentColor);
  }

  Widget _buildReactions(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: context.colors.bgElevated,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: message.reactions.entries.map((entry) {
          return Padding(
            padding: const EdgeInsets.only(right: 2),
            child: Text(
              '${entry.key}${entry.value.length > 1 ? ' ${entry.value.length}' : ''}',
              style: const TextStyle(fontSize: 13),
            ),
          );
        }).toList(),
      ),
    );
  }

  void _showContextMenu(BuildContext context) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: AppSpacing.sm),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            ListTile(
              leading: const Icon(Icons.copy_outlined),
              title: const Text('Copy'),
              onTap: () { Navigator.pop(ctx); onCopy?.call(); },
            ),
            ListTile(
              leading: const Icon(Icons.emoji_emotions_outlined),
              title: const Text('React'),
              onTap: () { Navigator.pop(ctx); onReact?.call(); },
            ),
            ListTile(
              leading: const Icon(Icons.reply_outlined),
              title: const Text('Reply'),
              onTap: () { Navigator.pop(ctx); onReply?.call(); },
            ),
            if (isMe)
              ListTile(
                leading: Icon(Icons.delete_outline, color: context.colors.danger),
                title: Text('Delete', style: TextStyle(color: context.colors.danger)),
                onTap: () { Navigator.pop(ctx); onDelete?.call(); },
              ),
            const SizedBox(height: AppSpacing.sm),
          ],
        ),
      ),
    );
  }
}
