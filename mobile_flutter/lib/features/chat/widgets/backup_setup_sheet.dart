import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/features/chat/services/backup_service.dart';

/// Bottom sheet shown on first chat open to configure backup.
/// Presents account selection, network conditions, and frequency.
class BackupSetupSheet extends ConsumerStatefulWidget {
  final VoidCallback onComplete;
  final VoidCallback onSkip;

  const BackupSetupSheet({
    super.key,
    required this.onComplete,
    required this.onSkip,
  });

  @override
  ConsumerState<BackupSetupSheet> createState() => _BackupSetupSheetState();
}

class _BackupSetupSheetState extends ConsumerState<BackupSetupSheet> {
  BackupFrequency _frequency = BackupFrequency.weekly;
  BackupNetwork _network = BackupNetwork.wifiOnly;
  bool _setting = false;

  Future<void> _setupBackup() async {
    setState(() => _setting = true);

    final service = ref.read(backupServiceProvider);
    await service.saveConfig(BackupConfig(
      frequency: _frequency,
      network: _network,
    ));

    setState(() => _setting = false);
    widget.onComplete();

    // Run first backup in the background and notify via snackbar
    service.runBackupNow().then((_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chat backup completed successfully')),
        );
      }
    }).catchError((e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Backup failed. You can retry in Settings.'),
          ),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Title
          Text(
            'Back up your chats',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),

          Text(
            'Your messages are stored only on this device. '
            'Back up to Google Drive to keep them safe.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.7),
            ),
          ),
          const SizedBox(height: 8),

          // Info chip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline,
                    size: 16, color: theme.colorScheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Backup uses your Google account. You can change this later in Settings.',
                    style: theme.textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Frequency selector
          Text('Frequency',
              style: theme.textTheme.labelLarge
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          SegmentedButton<BackupFrequency>(
            segments: const [
              ButtonSegment(value: BackupFrequency.daily, label: Text('Daily')),
              ButtonSegment(
                  value: BackupFrequency.weekly, label: Text('Weekly')),
              ButtonSegment(
                  value: BackupFrequency.monthly, label: Text('Monthly')),
            ],
            selected: {_frequency},
            onSelectionChanged: (s) => setState(() => _frequency = s.first),
          ),
          const SizedBox(height: 16),

          // Network selector
          Text('Back up using',
              style: theme.textTheme.labelLarge
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          SegmentedButton<BackupNetwork>(
            segments: const [
              ButtonSegment(
                  value: BackupNetwork.wifiOnly, label: Text('Wi-Fi only')),
              ButtonSegment(
                  value: BackupNetwork.wifiAndMobile,
                  label: Text('Wi-Fi & Mobile')),
            ],
            selected: {_network},
            onSelectionChanged: (s) => setState(() => _network = s.first),
          ),
          const SizedBox(height: 24),

          // Buttons
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _setting ? null : _setupBackup,
              child: _setting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Set Up Backup'),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: _setting ? null : widget.onSkip,
              child: const Text('Skip for now'),
            ),
          ),
        ],
      ),
    );
  }
}
