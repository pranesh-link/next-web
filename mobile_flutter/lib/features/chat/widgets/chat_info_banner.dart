import 'package:flutter/material.dart';

/// Persistent info banner shown at top of chat screen.
/// Informs user that messages are stored locally only and prompts backup setup.
class ChatInfoBanner extends StatelessWidget {
  final bool backupConfigured;
  final VoidCallback? onSetupBackup;
  final VoidCallback? onDismiss;

  const ChatInfoBanner({
    super.key,
    this.backupConfigured = false,
    this.onSetupBackup,
    this.onDismiss,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: theme.colorScheme.primary.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, size: 18, color: theme.colorScheme.primary),
          const SizedBox(width: 10),
          Expanded(
            child: backupConfigured
                ? Text(
                    'Messages are stored on your device. Backups enabled.',
                    style: theme.textTheme.bodySmall,
                  )
                : Text(
                    'Messages are stored on your device only. '
                    'Set up backups to keep your chat history safe.',
                    style: theme.textTheme.bodySmall,
                  ),
          ),
          if (!backupConfigured && onSetupBackup != null) ...[
            const SizedBox(width: 8),
            TextButton(
              onPressed: onSetupBackup,
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text('Set up'),
            ),
          ],
          if (onDismiss != null)
            IconButton(
              icon: const Icon(Icons.close, size: 16),
              onPressed: onDismiss,
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
            ),
        ],
      ),
    );
  }
}
