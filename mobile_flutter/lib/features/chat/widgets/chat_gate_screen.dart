import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

/// Shown when the couple doesn't have 2 members yet.
/// Prompts the user to invite their partner to start chatting.
class ChatGateScreen extends StatelessWidget {
  final String? inviteLink;

  const ChatGateScreen({super.key, this.inviteLink});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.chat_bubble_outline,
                size: 48,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Invite your partner',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Chat is available once your partner joins. '
              'Send them an invite to start messaging with end-to-end encryption.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 32),
            if (inviteLink != null)
              FilledButton.icon(
                onPressed: () {
                  Share.share(
                    'Join me on LuvVerse! $inviteLink',
                  );
                },
                icon: const Icon(Icons.share),
                label: const Text('Share Invite Link'),
              ),
          ],
        ),
      ),
    );
  }
}
