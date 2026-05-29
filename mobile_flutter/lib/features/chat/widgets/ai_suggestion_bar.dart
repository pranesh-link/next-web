import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';

/// Horizontal row of AI-suggested reply chips above the message input.
class AiSuggestionBar extends ConsumerWidget {
  final Function(String) onSelect;

  const AiSuggestionBar({super.key, required this.onSelect});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final messages = ref.watch(chatNotifierProvider).valueOrNull ?? [];
    final currentUserId = ref.watch(dbUserIdProvider) ?? '';

    // Only show if last message is from partner
    if (messages.isEmpty) return const SizedBox.shrink();
    final lastMsg = messages.last;
    if (lastMsg.isFromUser(currentUserId)) return const SizedBox.shrink();

    final suggestions = _generateSuggestions(lastMsg);
    if (suggestions.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.sm,
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: suggestions.map((text) {
            return Padding(
              padding: const EdgeInsets.only(right: AppSpacing.sm),
              child: ActionChip(
                label: Text(
                  text,
                  style: TextStyle(
                    fontSize: 13,
                    color: context.colors.accent,
                  ),
                ),
                backgroundColor: context.colors.accent.withValues(alpha: 0.08),
                side: BorderSide(
                  color: context.colors.accent.withValues(alpha: 0.3),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                onPressed: () => onSelect(text),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  List<String> _generateSuggestions(ChatMessage lastMessage) {
    final content = lastMessage.content.toLowerCase();

    if (content.contains('?')) {
      if (content.contains('how are') || content.contains('how\'s')) {
        return ['I\'m good! 😊', 'Great, thanks!', 'Missing you ❤️'];
      }
      if (content.contains('what') || content.contains('where')) {
        return ['Let me check', 'Not sure yet', 'I\'ll let you know'];
      }
      return ['Yes!', 'No, sorry', 'Maybe later'];
    }

    if (content.contains('love') || content.contains('miss')) {
      return ['Love you too ❤️', '🥰', 'Miss you more!'];
    }

    if (content.contains('good morning') || content.contains('good night')) {
      if (content.contains('morning')) {
        return ['Good morning! ☀️', 'Morning babe!', '❤️'];
      }
      return ['Good night! 🌙', 'Sweet dreams ❤️', 'Night! 😘'];
    }

    // Generic suggestions
    return ['❤️', 'Okay!', 'Sounds good'];
  }
}
