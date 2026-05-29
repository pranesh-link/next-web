import 'package:flutter/material.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';

/// Sticky bar at the top of chat showing the currently pinned message.
class PinnedHeader extends StatelessWidget {
  final ChatMessage? pinnedMessage;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const PinnedHeader({
    super.key,
    required this.pinnedMessage,
    required this.onTap,
    required this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    if (pinnedMessage == null) return const SizedBox.shrink();

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: context.colors.bgElevated,
          border: Border(
            bottom: BorderSide(color: context.colors.cardBorder),
            left: BorderSide(
              color: context.colors.accent,
              width: 3,
            ),
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.push_pin,
              size: 16,
              color: context.colors.accent,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Pinned Message',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: context.colors.accent,
                    ),
                  ),
                  Text(
                    pinnedMessage!.content,
                    style: TextStyle(
                      fontSize: 13,
                      color: context.colors.text,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            IconButton(
              icon: Icon(
                Icons.close,
                size: 16,
                color: context.colors.textMuted,
              ),
              onPressed: onDismiss,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 24, minHeight: 24),
            ),
          ],
        ),
      ),
    );
  }
}
