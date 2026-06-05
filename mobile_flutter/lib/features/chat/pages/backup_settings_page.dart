import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/features/chat/services/backup_service.dart';
import 'package:luvverse/features/chat/services/chat_key_bootstrap.dart';

/// Backup settings page. Configures frequency, network conditions,
/// Google account, and provides manual backup/restore/delete actions.
class BackupSettingsPage extends ConsumerStatefulWidget {
  const BackupSettingsPage({super.key});

  @override
  ConsumerState<BackupSettingsPage> createState() => _BackupSettingsPageState();
}

class _BackupSettingsPageState extends ConsumerState<BackupSettingsPage> {
  BackupConfig _config = const BackupConfig();
  bool _loading = true;
  bool _backingUp = false;
  bool _connectingAccount = false;

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    try {
      final service = ref.read(backupServiceProvider);
      final config = await service.getConfig();
      if (!mounted) return;
      setState(() {
        _config = config;
        _loading = false;
      });
    } catch (_) {
      // Fallback to defaults so the spinner always clears.
      if (!mounted) return;
      setState(() {
        _config = const BackupConfig();
        _loading = false;
      });
    }
  }

  Future<void> _updateConfig(BackupConfig newConfig) async {
    final service = ref.read(backupServiceProvider);
    await service.saveConfig(newConfig);
    setState(() => _config = newConfig);
  }

  Future<void> _connectGoogleAccount() async {
    setState(() => _connectingAccount = true);
    final service = ref.read(backupServiceProvider);
    final success = await service.connectGoogleAccount();
    setState(() => _connectingAccount = false);

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(success
            ? 'Google account connected'
            : 'Could not sign in to Google. Please try again.'),
      ),
    );
    if (success) await _loadConfig();
  }

  Future<void> _backupNow() async {
    setState(() => _backingUp = true);
    // Ensure E2E keys are bootstrapped before attempting backup.
    // This runs even if the Chat screen hasn't been opened yet.
    final bootstrap = ref.read(chatKeyBootstrapProvider);
    final ready = await bootstrap.forceRetry();
    if (!ready) {
      setState(() => _backingUp = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Encryption is not ready. Ask your partner to open the Chat screen to set up their encryption keys, then retry.',
          ),
        ),
      );
      return;
    }
    final service = ref.read(backupServiceProvider);
    final result = await service.runBackupNow();
    setState(() => _backingUp = false);

    if (!mounted) return;
    final message = switch (result) {
      BackupResult.success => 'Backup completed successfully',
      BackupResult.skipped => 'No messages to back up',
      BackupResult.networkUnavailable => 'Network unavailable',
      BackupResult.chatNotReady =>
          'Encryption keys not ready. Please open Chat first, then retry.',
      BackupResult.encryptionFailed => 'Encryption failed — is chat enabled?',
      BackupResult.uploadFailed => 'Upload to Google Drive failed',
      BackupResult.error => 'Backup failed. Please try again.',
    };

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
    await _loadConfig();
  }

  Future<void> _deleteAllBackups() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete all cloud backups?'),
        content: const Text(
          'This deletes backups from Google Drive only. '
          'Your local chat history will NOT be affected.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete All'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final service = ref.read(backupServiceProvider);
    final success = await service.deleteAllBackups();

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(success
            ? 'All cloud backups deleted'
            : 'Failed to delete backups'),
      ),
    );
    await _loadConfig();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Chat Backup')),
        body: const Center(child: CircularProgressIndicator.adaptive()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Chat Backup')),
      body: ListView(
        children: [
          // Backup toggle
          SwitchListTile(
            title: const Text('Back up chats'),
            subtitle: const Text(
              'Encrypted backups stored in your Google Drive',
            ),
            value: _config.frequency != BackupFrequency.off,
            onChanged: (on) => _updateConfig(_config.copyWith(
              frequency: on ? BackupFrequency.weekly : BackupFrequency.off,
            )),
          ),
          const Divider(),

          // Frequency
          if (_config.frequency != BackupFrequency.off) ...[
            ListTile(
              title: const Text('Backup frequency'),
              subtitle: Text(_config.frequency.name),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _showFrequencyPicker(),
            ),

            // Network
            ListTile(
              title: const Text('Back up using'),
              subtitle: Text(_config.network == BackupNetwork.wifiOnly
                  ? 'Wi-Fi only'
                  : 'Wi-Fi & mobile data'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _showNetworkPicker(),
            ),

            // Google account
            ListTile(
              title: const Text('Google account'),
              subtitle: Text(
                (_config.googleAccountEmail == null ||
                        _config.googleAccountEmail == 'pending')
                    ? 'Tap to connect Google account'
                    : _config.googleAccountEmail!),
              trailing: _connectingAccount
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.chevron_right),
              onTap: _connectingAccount ? null : _connectGoogleAccount,
            ),
            const Divider(),

            // Last backup info
            if (_config.lastBackup != null)
              ListTile(
                title: const Text('Last backup'),
                subtitle: Text(
                  '${_formatDate(_config.lastBackup!)} · '
                  '${_formatSize(_config.lastBackupSizeBytes ?? 0)}',
                ),
                leading: const Icon(Icons.cloud_done),
              ),

            // Manual backup
            ListTile(
              title: const Text('Back up now'),
              leading: _backingUp
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.backup),
              onTap: _backingUp ? null : _backupNow,
            ),
            const Divider(),
          ],

          // Delete all backups
          ListTile(
            title: Text(
              'Delete all cloud backups',
              style: TextStyle(color: theme.colorScheme.error),
            ),
            subtitle: const Text('Local messages are not affected'),
            leading: Icon(Icons.delete_forever, color: theme.colorScheme.error),
            onTap: _deleteAllBackups,
          ),
        ],
      ),
    );
  }

  void _showFrequencyPicker() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (final freq in [
            BackupFrequency.daily,
            BackupFrequency.weekly,
            BackupFrequency.monthly,
          ])
            RadioListTile<BackupFrequency>(
              title: Text(freq.name[0].toUpperCase() + freq.name.substring(1)),
              value: freq,
              groupValue: _config.frequency,
              onChanged: (v) {
                _updateConfig(_config.copyWith(frequency: v));
                Navigator.pop(ctx);
              },
            ),
        ],
      ),
    );
  }

  void _showNetworkPicker() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          RadioListTile<BackupNetwork>(
            title: const Text('Wi-Fi only'),
            value: BackupNetwork.wifiOnly,
            groupValue: _config.network,
            onChanged: (v) {
              _updateConfig(_config.copyWith(network: v));
              Navigator.pop(ctx);
            },
          ),
          RadioListTile<BackupNetwork>(
            title: const Text('Wi-Fi & mobile data'),
            value: BackupNetwork.wifiAndMobile,
            groupValue: _config.network,
            onChanged: (v) {
              _updateConfig(_config.copyWith(network: v));
              Navigator.pop(ctx);
            },
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
