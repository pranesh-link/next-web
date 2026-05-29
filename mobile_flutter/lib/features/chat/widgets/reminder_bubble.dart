import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';

/// Renders a reminder message with clock icon and scheduled time.
class ReminderBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;

  const ReminderBubble({
    super.key,
    required this.message,
    required this.isMe,
  });

  bool get _isPast =>
      message.reminderAt != null &&
      message.reminderAt!.isBefore(DateTime.now());

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 280),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: isMe
            ? const Color(0xFFDCF8C6)
            : Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(16),
          topRight: const Radius.circular(16),
          bottomLeft: Radius.circular(isMe ? 16 : 4),
          bottomRight: Radius.circular(isMe ? 4 : 16),
        ),
        border: Border.all(
          color: _isPast
              ? context.colors.success.withValues(alpha: 0.3)
              : context.colors.accent.withValues(alpha: 0.3),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(
                _isPast ? Icons.check_circle : Icons.access_alarm,
                size: 18,
                color: _isPast
                    ? context.colors.success
                    : context.colors.accent,
              ),
              const SizedBox(width: AppSpacing.sm),
              Text(
                _isPast ? 'Completed' : 'Reminder',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _isPast
                      ? context.colors.success
                      : context.colors.accent,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            message.content,
            style: TextStyle(
              fontSize: 15,
              color: const Color(0xFF1A1A1A),
              decoration: _isPast ? TextDecoration.lineThrough : null,
            ),
          ),
          if (message.reminderAt != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Icon(
                  Icons.schedule,
                  size: 14,
                  color: context.colors.textMuted,
                ),
                const SizedBox(width: 4),
                Text(
                  _formatReminderTime(message.reminderAt!),
                  style: TextStyle(
                    fontSize: 12,
                    color: context.colors.textMuted,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String _formatReminderTime(DateTime dt) {
    final now = DateTime.now();
    final diff = dt.difference(now);

    if (_isPast) {
      return DateFormat('MMM d, h:mm a').format(dt);
    }

    if (diff.inMinutes < 60) {
      return 'In ${diff.inMinutes} min';
    } else if (diff.inHours < 24) {
      return 'In ${diff.inHours}h ${diff.inMinutes % 60}m';
    }
    return DateFormat('MMM d, h:mm a').format(dt);
  }
}
