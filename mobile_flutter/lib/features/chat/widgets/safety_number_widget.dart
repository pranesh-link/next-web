import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart';

/// Fetches and displays the couple's security code (safety number).
/// Used to verify E2E encryption out-of-band with the partner.
class SafetyNumberWidget extends ConsumerStatefulWidget {
  const SafetyNumberWidget({super.key});

  @override
  ConsumerState<SafetyNumberWidget> createState() => _SafetyNumberWidgetState();
}

class _SafetyNumberWidgetState extends ConsumerState<SafetyNumberWidget> {
  String? _code;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchCode();
  }

  Future<void> _fetchCode() async {
    final repo = ref.read(chatRepositoryProvider);
    final code = await repo.getSecurityCode();
    if (mounted) {
      setState(() {
        _code = code;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.verified_user, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Text(
                  'Security Code',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Compare this code with your partner to verify '
              'your connection is secure. The code should match on both devices.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: 16),
            if (_loading)
              const Center(child: CircularProgressIndicator.adaptive())
            else if (_code != null)
              GestureDetector(
                onTap: () {
                  Clipboard.setData(ClipboardData(text: _code!));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Security code copied'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                      vertical: 16, horizontal: 20),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      _code!,
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                ),
              )
            else
              Text(
                'Security code unavailable. Both partners must have encryption enabled.',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.error,
                ),
              ),
            if (_code != null) ...[
              const SizedBox(height: 8),
              Center(
                child: Text(
                  'Tap to copy',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
