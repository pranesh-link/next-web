import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/theme/app_spacing.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';

/// Renders a checklist inside a chat bubble. Items are togglable.
class ListBubble extends ConsumerWidget {
  final ChatMessage message;
  final bool isMe;

  const ListBubble({
    super.key,
    required this.message,
    required this.isMe,
  });

  Map<String, dynamic> get _listPayload => message.payload ?? {};
  String get _title => _listPayload['title'] as String? ?? 'List';
  List<Map<String, dynamic>> get _items {
    final raw = _listPayload['items'] as List?;
    if (raw == null) return [];
    return raw.cast<Map<String, dynamic>>();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 280),
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFFDCF8C6) : Colors.white,
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
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(Icons.checklist, size: 18, color: context.colors.accent),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  _title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          ..._items.asMap().entries.map((entry) {
            final index = entry.key;
            final item = entry.value;
            final checked = item['checked'] as bool? ?? false;
            final text = item['text'] as String? ?? '';

            return GestureDetector(
              onTap: () => _toggleItem(ref, index, !checked),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 3),
                child: Row(
                  children: [
                    Icon(
                      checked
                          ? Icons.check_box
                          : Icons.check_box_outline_blank,
                      size: 20,
                      color: checked
                          ? context.colors.success
                          : context.colors.textMuted,
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Text(
                        text,
                        style: TextStyle(
                          fontSize: 14,
                          decoration:
                              checked ? TextDecoration.lineThrough : null,
                          color: checked ? Colors.grey : Colors.black87,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '${_items.where((i) => i['checked'] == true).length}/${_items.length} done',
            style: TextStyle(
              fontSize: 11,
              color: context.colors.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  void _toggleItem(WidgetRef ref, int index, bool newValue) {
    ref.read(chatNotifierProvider.notifier).toggleListItem(
      message.id,
      index,
      newValue,
    );
  }
}
