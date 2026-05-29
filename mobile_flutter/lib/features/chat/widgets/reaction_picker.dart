import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Overlay reaction picker that appears on double-tap of a message bubble.
/// Shows 6 emoji options and calls [onSelect] with the chosen emoji.
class ReactionPicker extends StatelessWidget {
  final String messageId;
  final ValueChanged<String> onSelect;
  final VoidCallback onDismiss;

  const ReactionPicker({
    super.key,
    required this.messageId,
    required this.onSelect,
    required this.onDismiss,
  });

  static const emojis = ['❤️', '😂', '👍', '😮', '😢', '🙏'];

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onDismiss,
      behavior: HitTestBehavior.opaque,
      child: Material(
        color: Colors.black26,
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.15),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: emojis.map((emoji) {
                return GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    onSelect(emoji);
                  },
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Text(emoji, style: const TextStyle(fontSize: 28)),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }
}

/// Shows the reaction picker as a full-screen overlay.
void showReactionPicker({
  required BuildContext context,
  required String messageId,
  required ValueChanged<String> onSelect,
}) {
  late final OverlayEntry entry;
  entry = OverlayEntry(
    builder: (ctx) => ReactionPicker(
      messageId: messageId,
      onSelect: (emoji) {
        entry.remove();
        onSelect(emoji);
      },
      onDismiss: () => entry.remove(),
    ),
  );

  Overlay.of(context).insert(entry);
}
