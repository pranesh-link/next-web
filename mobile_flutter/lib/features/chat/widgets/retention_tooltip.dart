import 'package:flutter/material.dart';

/// Tooltip icon that explains the 30-day server retention policy.
/// Shown near the top of the chat screen.
class RetentionTooltip extends StatelessWidget {
  const RetentionTooltip({super.key});

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: 'Messages are delivered to your partner\'s device. '
          'Undelivered messages are automatically removed from '
          'the server after 30 days.',
      triggerMode: TooltipTriggerMode.tap,
      showDuration: const Duration(seconds: 5),
      child: Icon(
        Icons.info_outline,
        size: 18,
        color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5),
      ),
    );
  }
}
