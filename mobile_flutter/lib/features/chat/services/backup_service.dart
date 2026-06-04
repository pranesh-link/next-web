import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:googleapis/drive/v3.dart' as drive;
import 'package:googleapis_auth/auth_io.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:luvverse/features/chat/services/message_sync_service.dart';
import 'package:luvverse/features/chat/services/chat_key_bootstrap.dart';

/// Backup frequency options.
enum BackupFrequency { daily, weekly, monthly, off }

/// Network condition for backup.
enum BackupNetwork { wifiOnly, wifiAndMobile }

/// Backup configuration stored locally.
class BackupConfig {
  final BackupFrequency frequency;
  final BackupNetwork network;
  final String? googleAccountEmail;
  final DateTime? lastBackup;
  final int? lastBackupSizeBytes;

  const BackupConfig({
    this.frequency = BackupFrequency.weekly,
    this.network = BackupNetwork.wifiOnly,
    this.googleAccountEmail,
    this.lastBackup,
    this.lastBackupSizeBytes,
  });

  BackupConfig copyWith({
    BackupFrequency? frequency,
    BackupNetwork? network,
    String? googleAccountEmail,
    DateTime? lastBackup,
    int? lastBackupSizeBytes,
  }) {
    return BackupConfig(
      frequency: frequency ?? this.frequency,
      network: network ?? this.network,
      googleAccountEmail: googleAccountEmail ?? this.googleAccountEmail,
      lastBackup: lastBackup ?? this.lastBackup,
      lastBackupSizeBytes: lastBackupSizeBytes ?? this.lastBackupSizeBytes,
    );
  }

  Map<String, dynamic> toJson() => {
        'frequency': frequency.name,
        'network': network.name,
        'googleAccountEmail': googleAccountEmail,
        'lastBackup': lastBackup?.toIso8601String(),
        'lastBackupSizeBytes': lastBackupSizeBytes,
      };

  factory BackupConfig.fromJson(Map<String, dynamic> json) {
    return BackupConfig(
      frequency: BackupFrequency.values.byName(
          json['frequency'] as String? ?? 'weekly'),
      network: BackupNetwork.values.byName(
          json['network'] as String? ?? 'wifiOnly'),
      googleAccountEmail: json['googleAccountEmail'] as String?,
      lastBackup: json['lastBackup'] != null
          ? DateTime.parse(json['lastBackup'] as String)
          : null,
      lastBackupSizeBytes: json['lastBackupSizeBytes'] as int?,
    );
  }
}

/// Handles encrypted chat backup to Google Drive.
///
/// Backup format: AES-256-GCM encrypted JSON of all local messages.
/// Stored in Google Drive App Data folder (hidden from user's Drive UI).
/// Keeps last 3 backups, deletes older ones.
class BackupService {
  BackupService(this._syncService, this._bootstrap);

  final MessageSyncService _syncService;
  final ChatKeyBootstrap _bootstrap;
  static const _configKey = 'chat_backup_config';
  static const _storage = FlutterSecureStorage();
  static const _backupPrefix = 'luvverse-chat-backup-';
  static const _maxBackups = 3;

  /// Load backup configuration from secure storage.
  Future<BackupConfig> getConfig() async {
    final raw = await _storage.read(key: _configKey);
    if (raw == null) return const BackupConfig();
    return BackupConfig.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  /// Save backup configuration.
  Future<void> saveConfig(BackupConfig config) async {
    await _storage.write(key: _configKey, value: jsonEncode(config.toJson()));
  }

  /// Check if a backup is due based on frequency and last backup time.
  Future<bool> isBackupDue() async {
    final config = await getConfig();
    if (config.frequency == BackupFrequency.off) return false;
    if (config.lastBackup == null) return true;

    final now = DateTime.now();
    final elapsed = now.difference(config.lastBackup!);

    switch (config.frequency) {
      case BackupFrequency.daily:
        return elapsed.inHours >= 24;
      case BackupFrequency.weekly:
        return elapsed.inDays >= 7;
      case BackupFrequency.monthly:
        return elapsed.inDays >= 30;
      case BackupFrequency.off:
        return false;
    }
  }

  /// Check if network conditions allow backup.
  Future<bool> canBackupNow() async {
    final config = await getConfig();
    final connectivity = await Connectivity().checkConnectivity();

    if (config.network == BackupNetwork.wifiOnly) {
      return connectivity.contains(ConnectivityResult.wifi);
    }
    // wifiAndMobile — any connection works
    return connectivity.contains(ConnectivityResult.wifi) ||
        connectivity.contains(ConnectivityResult.mobile);
  }

  /// Run backup if conditions are met. Returns true on success.
  /// Returns false if skipped or failed.
  Future<BackupResult> runBackupIfDue() async {
    if (!await isBackupDue()) return BackupResult.skipped;
    if (!await canBackupNow()) return BackupResult.networkUnavailable;
    return await runBackupNow();
  }

  /// Force a backup immediately regardless of schedule.
  Future<BackupResult> runBackupNow() async {
    try {
      // 1. Ensure E2E keys are bootstrapped — required for encryption.
      //    This is a no-op if already ready (O(1)), so safe to call always.
      final ready = await _bootstrap.ensureBootstrapped();
      if (!ready) return BackupResult.chatNotReady;

      // 2. Authenticate Google Drive early so the account email is persisted
      //    even if a later step fails (fixes 'pending' stuck state).
      final driveApi = await _getDriveApi();
      if (driveApi == null) return BackupResult.uploadFailed;

      // 3. Export all messages
      final messages = await _syncService.exportAllMessages();
      if (messages.isEmpty) return BackupResult.skipped;

      final jsonBytes = utf8.encode(jsonEncode(messages));

      // 4. Encrypt with key derived from the E2E private key
      final encrypted = await _encryptBackup(Uint8List.fromList(jsonBytes));
      if (encrypted == null) return BackupResult.encryptionFailed;

      // 5. Upload to Google Drive App Data folder (reuse authenticated client)
      final uploaded = await _uploadToDriveWithApi(driveApi, encrypted);
      if (!uploaded) return BackupResult.uploadFailed;

      // 6. Prune old backups (keep last 3)
      await _pruneOldBackupsWithApi(driveApi);

      // 7. Update config
      final config = await getConfig();
      await saveConfig(config.copyWith(
        lastBackup: DateTime.now(),
        lastBackupSizeBytes: encrypted.length,
      ));

      debugPrint(
          '[Backup] Success: ${messages.length} messages, ${encrypted.length} bytes');
      return BackupResult.success;
    } catch (e) {
      debugPrint('[Backup] Failed: $e');
      return BackupResult.error;
    }
  }

  /// Restore from the latest backup on Google Drive.
  Future<List<Map<String, dynamic>>?> restoreLatestBackup() async {
    try {
      final driveApi = await _getDriveApi();
      if (driveApi == null) return null;

      // List backup files in App Data folder
      final fileList = await driveApi.files.list(
        spaces: 'appDataFolder',
        q: "name contains '$_backupPrefix'",
        orderBy: 'createdTime desc',
        pageSize: 1,
      );

      if (fileList.files == null || fileList.files!.isEmpty) return null;

      final latestFile = fileList.files!.first;
      final media = await driveApi.files.get(
        latestFile.id!,
        downloadOptions: drive.DownloadOptions.fullMedia,
      ) as drive.Media;

      final bytes = <int>[];
      await for (final chunk in media.stream) {
        bytes.addAll(chunk);
      }

      // Decrypt
      final decrypted = await _decryptBackup(Uint8List.fromList(bytes));
      if (decrypted == null) return null;

      final jsonStr = utf8.decode(decrypted);
      final messages =
          (jsonDecode(jsonStr) as List).cast<Map<String, dynamic>>();
      return messages;
    } catch (e) {
      debugPrint('[Backup] Restore failed: $e');
      return null;
    }
  }

  /// Delete all cloud backups. Local chat data is NOT affected.
  Future<bool> deleteAllBackups() async {
    try {
      final driveApi = await _getDriveApi();
      if (driveApi == null) return false;

      final fileList = await driveApi.files.list(
        spaces: 'appDataFolder',
        q: "name contains '$_backupPrefix'",
      );

      for (final file in fileList.files ?? []) {
        await driveApi.files.delete(file.id!);
      }

      final config = await getConfig();
      await saveConfig(config.copyWith(
        lastBackup: null,
        lastBackupSizeBytes: null,
      ));

      return true;
    } catch (e) {
      debugPrint('[Backup] deleteAllBackups failed: $e');
      return false;
    }
  }

  Future<Uint8List?> _encryptBackup(Uint8List data) async {
    try {
      // Use the E2E private key as backup encryption source
      // Derive a backup-specific key via HKDF
      final crypto = _bootstrap.crypto;
      if (!crypto.isReady) return null;
      return crypto.encryptBytes(data);
    } catch (e) {
      debugPrint('[Backup] Encryption failed: $e');
      return null;
    }
  }

  Future<Uint8List?> _decryptBackup(Uint8List data) async {
    try {
      final crypto = _bootstrap.crypto;
      if (!crypto.isReady) return null;
      return crypto.decryptBytes(data);
    } catch (e) {
      debugPrint('[Backup] Decryption failed: $e');
      return null;
    }
  }

  Future<bool> _uploadToDriveWithApi(
      drive.DriveApi driveApi, Uint8List data) async {
    final timestamp =
        DateTime.now().toIso8601String().replaceAll(RegExp(r'[:]'), '-');
    final fileName = '$_backupPrefix$timestamp.enc';

    final media = drive.Media(
      Stream.value(data),
      data.length,
    );

    await driveApi.files.create(
      drive.File()
        ..name = fileName
        ..parents = ['appDataFolder'],
      uploadMedia: media,
    );

    return true;
  }

  Future<void> _pruneOldBackupsWithApi(drive.DriveApi driveApi) async {
    final fileList = await driveApi.files.list(
      spaces: 'appDataFolder',
      q: "name contains '$_backupPrefix'",
      orderBy: 'createdTime desc',
    );

    final files = fileList.files ?? [];
    if (files.length <= _maxBackups) return;

    // Delete everything beyond the 3 most recent
    for (int i = _maxBackups; i < files.length; i++) {
      await driveApi.files.delete(files[i].id!);
    }
  }

  Future<drive.DriveApi?> _getDriveApi() async {
    try {
      final googleSignIn = GoogleSignIn(
        scopes: [drive.DriveApi.driveAppdataScope],
      );

      final account = await googleSignIn.signInSilently() ??
          await googleSignIn.signIn();
      if (account == null) return null;

      // Persist Google account email in backup config
      final currentConfig = await getConfig();
      if (currentConfig.googleAccountEmail != account.email) {
        await saveConfig(currentConfig.copyWith(
          googleAccountEmail: account.email,
        ));
      }

      final auth = await account.authentication;
      final client = authenticatedClient(
        http.Client(),
        AccessCredentials(
          AccessToken(
            'Bearer',
            auth.accessToken!,
            DateTime.now().toUtc().add(const Duration(hours: 1)),
          ),
          null,
          [drive.DriveApi.driveAppdataScope],
        ),
      );

      return drive.DriveApi(client);
    } catch (e) {
      debugPrint('[Backup] Google Drive auth failed: $e');
      return null;
    }
  }
}

enum BackupResult {
  success,
  skipped,
  networkUnavailable,
  /// E2E keys not yet bootstrapped — user must open Chat first.
  chatNotReady,
  encryptionFailed,
  uploadFailed,
  error,
}

final backupServiceProvider = Provider<BackupService>((ref) {
  return BackupService(
    ref.read(messageSyncServiceProvider),
    ref.read(chatKeyBootstrapProvider),
  );
});
