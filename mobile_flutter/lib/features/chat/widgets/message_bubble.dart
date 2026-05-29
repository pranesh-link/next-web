import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';

/// WhatsApp-style message bubble with read receipts and reactions.
class MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;
  final String currentUserId;
  final VoidCallback? onReact;
  final VoidCallback? onDelete;
  final VoidCallback? onCopy;
  final VoidCallback? onReply;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isMe,
    required this.currentUserId,
    this.onReact,
    this.onDelete,
    this.onCopy,
    this.onReply,
  });

  static const _sentColor = Color(0xFFDCF8C6);
  static const _receivedColor = Colors.white;

  @override
  Widget build(BuildContext context) {
    final time = DateFormat('HH:mm').format(message.createdAt);
    final reactions = message.reactions;
    final hasReactions = reactions.isNotEmpty;

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
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.md,
                  vertical: AppSpacing.sm,
                ),
                decoration: BoxDecoration(
                  color: isMe ? _sentColor : _receivedColor,
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(16),
                    topRight: const Radius.circular(16),
                    bottomLeft: Radius.circular(isMe ? 16 : 4),
                    bottomRight: Radius.circular(isMe ? 4 : 16),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 3,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      message.content,
                      style: const TextStyle(
                        fontSize: 15,
                        color: Color(0xFF1A1A1A),
                        height: 1.35,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          time,
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        if (isMe) ...[
                          const SizedBox(width: 3),
                          _buildReadReceipt(),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              if (hasReactions)
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: _buildReactions(context),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReadReceipt() {
    // If readBy contains someone other than the sender, it's been read
    final isRead =
        message.readBy.any((id) => id != currentUserId && id.isNotEmpty);

    if (isRead) {
      return const Icon(Icons.done_all, size: 14, color: Color(0xFF4FC3F7));
    }
    return Icon(Icons.done, size: 14, color: Colors.grey.shade500);
  }

  Widget _buildReactions(BuildContext context) {
    final reactions = message.reactions;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: context.colors.bgElevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.colors.cardBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: reactions.entries.map((entry) {
          return Padding(
            padding: const EdgeInsets.only(right: 2),
            child: Text(
              '${entry.key} ${entry.value.length > 1 ? entry.value.length : ''}',
              style: const TextStyle(fontSize: 12),
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
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: AppSpacing.sm),
            Container(
              width: 32,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            ListTile(
              leading: const Icon(Icons.copy),
              title: const Text('Copy'),
              onTap: () {
                Navigator.pop(ctx);
                onCopy?.call();
              },
            ),
            ListTile(
              leading: const Icon(Icons.emoji_emotions_outlined),
              title: const Text('React'),
              onTap: () {
                Navigator.pop(ctx);
                onReact?.call();
              },
            ),
            ListTile(
              leading: const Icon(Icons.reply),
              title: const Text('Reply'),
              onTap: () {
                Navigator.pop(ctx);
                onReply?.call();
              },
            ),
            if (isMe)
              ListTile(
                leading: Icon(Icons.delete_outline,
                    color: context.colors.danger),
                title: Text('Delete',
                    style: TextStyle(color: context.colors.danger)),
                onTap: () {
                  Navigator.pop(ctx);
                  onDelete?.call();
                },
              ),
            const SizedBox(height: AppSpacing.sm),
          ],
        ),
      ),
    );
  }
}
