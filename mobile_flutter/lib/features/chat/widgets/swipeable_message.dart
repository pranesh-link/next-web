import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:luvverse/features/chat/models/chat_message.dart';

/// Wraps a child widget with right-swipe gesture to trigger reply.
class SwipeableMessage extends StatefulWidget {
  final Widget child;
  final ChatMessage message;
  final ValueChanged<ChatMessage> onReply;

  const SwipeableMessage({
    super.key,
    required this.child,
    required this.message,
    required this.onReply,
  });

  @override
  State<SwipeableMessage> createState() => _SwipeableMessageState();
}

class _SwipeableMessageState extends State<SwipeableMessage>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  double _dragExtent = 0;
  static const _threshold = 64.0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onHorizontalDragUpdate(DragUpdateDetails details) {
    // Only allow right swipe (positive dx)
    final delta = details.primaryDelta ?? 0;
    setState(() {
      _dragExtent = (_dragExtent + delta).clamp(0.0, _threshold * 1.5);
    });
  }

  void _onHorizontalDragEnd(DragEndDetails details) {
    if (_dragExtent >= _threshold) {
      HapticFeedback.lightImpact();
      widget.onReply(widget.message);
    }
    setState(() => _dragExtent = 0);
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_dragExtent / _threshold).clamp(0.0, 1.0);

    return GestureDetector(
      onHorizontalDragUpdate: _onHorizontalDragUpdate,
      onHorizontalDragEnd: _onHorizontalDragEnd,
      child: Stack(
        alignment: Alignment.centerLeft,
        children: [
          // Reply icon behind the bubble
          Positioned(
            left: 8,
            child: Opacity(
              opacity: progress,
              child: Transform.scale(
                scale: 0.5 + (progress * 0.5),
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.reply, size: 18, color: Colors.black54),
                ),
              ),
            ),
          ),
          // The actual message bubble translated
          Transform.translate(
            offset: Offset(_dragExtent, 0),
            child: widget.child,
          ),
        ],
      ),
    );
  }
}
