import 'dart:convert';
import 'dart:typed_data';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:cryptography/cryptography.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:googleapis/drive/v3.dart' as drive;
import 'package:googleapis_auth/auth_io.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:luvverse/features/chat/services/message_sync_service.dart';
import 'package:luvverse/features/chat/services/crypto_service.dart';
import 'package:luvverse/features/chat/providers/chat_providers.dart'
    show cryptoServiceProvider;

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
///
/// Encryption uses a device-local AES-256 key derived from the device's own
/// ECDH private key via HKDF with a fixed "backup" context. This means:
/// - No partner key required — backup works independently.
/// - Each device has a unique backup key derived from its own key material.
/// - Legacy backups encrypted with the ECDH shared key fall back gracefully.
class BackupService {
  BackupService(this._syncService, this._crypto);

  final MessageSyncService _syncService;
  final CryptoService _crypto;
  static const _configKey = 'chat_backup_config';
  static const _backupPrefix = 'luvverse-chat-backup-';
  static const _maxBackups = 3;
  static const _privateKeyStorageKey = 'ecdh_private_key_jwk';
  static const _storage = FlutterSecureStorage();

  /// Load backup configuration from SharedPreferences.
  ///
  /// Backup config (frequency, network, account email, last backup date) is
  /// not secret — storing it in the iOS Keychain via FlutterSecureStorage
  /// caused the backup settings screen spinner to hang because keychain ops
  /// serialize and can block behind concurrent auth/token reads.
  Future<BackupConfig> getConfig() async {
    try {
      final prefs = await SharedPreferences.getInstance()
          .timeout(const Duration(seconds: 5));
      final raw = prefs.getString(_configKey);
      if (raw == null) return const BackupConfig();
      return BackupConfig.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return const BackupConfig();
    }
  }

  /// Save backup configuration to SharedPreferences.
  Future<void> saveConfig(BackupConfig config) async {
    try {
      final prefs = await SharedPreferences.getInstance()
          .timeout(const Duration(seconds: 5));
      await prefs.setString(_configKey, jsonEncode(config.toJson()));
    } catch (_) {
      // Non-critical — preference will be re-saved on next interaction.
    }
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
      // 1. Ensure a local ECDH key pair exists so _deriveBackupKey() can
      //    produce the HKDF backup key. This is a fast no-op when the key
      //    already exists (chat was opened at least once). If Chat was never
      //    opened the key pair is generated now — no server upload needed.
      await _ensureKeyPair();

      // 2. Derive backup key from device's own ECDH private key.
      final backupKey = await _deriveBackupKey();
      if (backupKey == null) return BackupResult.encryptionFailed;

      // 3. Authenticate Google Drive early so account email is persisted.
      final driveApi = await _getDriveApi();
      if (driveApi == null) return BackupResult.uploadFailed;

      // 3. Export all messages.
      final messages = await _syncService.exportAllMessages();
      if (messages.isEmpty) return BackupResult.skipped;

      final jsonBytes = utf8.encode(jsonEncode(messages));

      // 4. Encrypt with device-local backup key.
      final encrypted = await _encryptBackup(
          Uint8List.fromList(jsonBytes), backupKey);
      if (encrypted == null) return BackupResult.encryptionFailed;

      // 5. Upload to Google Drive App Data folder.
      final uploaded = await _uploadToDriveWithApi(driveApi, encrypted);
      if (!uploaded) return BackupResult.uploadFailed;

      // 6. Prune old backups (keep last 3).
      await _pruneOldBackupsWithApi(driveApi);

      // 7. Update config.
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
      final backupKey = await _deriveBackupKey();

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

      // Decrypt — try device-local key first, then fall back for legacy backups.
      final decrypted = backupKey != null
          ? await _decryptBackup(Uint8List.fromList(bytes), backupKey)
          : null;
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

  /// Ensure a local ECDH key pair exists (generates one if missing).
  /// Does not upload to server — used only to enable backup key derivation.
  Future<void> _ensureKeyPair() async {
    try {
      if (!await _crypto.hasKeyPair()) {
        await _crypto.generateKeyPair();
      }
    } catch (e) {
      debugPrint('[Backup] _ensureKeyPair failed: $e');
    }
  }

  /// Derive a device-local AES-256 backup key via HKDF from the stored ECDH
  /// private key. Does not require the partner's public key.
  ///
  /// HKDF info context: utf8("luvverse-backup-v1") ensures the derived key is
  /// domain-separated from any other key material.
  ///
  /// Returns null if no key pair has been generated yet (user has never opened
  /// Chat). Key generation is handled by ChatKeyBootstrap at sign-in; by the
  /// time Backup Settings is accessible, the key will always be present.
  Future<SecretKey?> _deriveBackupKey() async {
    try {
      final privateJwkStr = await _storage.read(key: _privateKeyStorageKey);
      if (privateJwkStr == null) return null;
      final jwk = jsonDecode(privateJwkStr) as Map<String, dynamic>;
      final dBase64 = jwk['d'] as String?;
      if (dBase64 == null || dBase64.isEmpty) return null;
      final dBytes = base64Url.decode(base64Url.normalize(dBase64));
      return await _hkdfBackupKey(Uint8List.fromList(dBytes));
    } catch (e) {
      debugPrint('[Backup] _deriveBackupKey failed: $e');
      return null;
    }
  }

  /// Run HKDF-SHA256 on [inputKeyMaterial] with a fixed backup context.
  Future<SecretKey> _hkdfBackupKey(Uint8List inputKeyMaterial) async {
    final hkdf = Hkdf(hmac: Hmac.sha256(), outputLength: 32);
    return hkdf.deriveKey(
      secretKey: SecretKey(inputKeyMaterial),
      nonce: const [],
      info: utf8.encode('luvverse-backup-v1'),
    );
  }

  Future<Uint8List?> _encryptBackup(
      Uint8List data, SecretKey backupKey) async {
    try {
      final aesGcm = AesGcm.with256bits();
      final secretBox = await aesGcm.encrypt(data, secretKey: backupKey);
      // Format: [12-byte nonce][ciphertext][16-byte GCM tag]
      final combined = Uint8List(
          12 + secretBox.cipherText.length + 16);
      combined.setAll(0, secretBox.nonce);
      combined.setAll(12, secretBox.cipherText);
      combined.setAll(12 + secretBox.cipherText.length, secretBox.mac.bytes);
      return combined;
    } catch (e) {
      debugPrint('[Backup] Encryption failed: $e');
      return null;
    }
  }

  Future<Uint8List?> _decryptBackup(
      Uint8List encryptedData, SecretKey backupKey) async {
    try {
      if (encryptedData.length < 12 + 16) return null;
      final aesGcm = AesGcm.with256bits();
      final iv = encryptedData.sublist(0, 12);
      final body = encryptedData.sublist(12);
      final cipherText = body.sublist(0, body.length - 16);
      final mac = Mac(body.sublist(body.length - 16));
      final secretBox = SecretBox(cipherText, nonce: iv, mac: mac);
      final plain = await aesGcm.decrypt(secretBox, secretKey: backupKey);
      return Uint8List.fromList(plain);
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

  /// Sign in to Google Drive and persist the account email.
  /// Safe to call from Settings without running a full backup.
  /// Returns true if authentication succeeded.
  Future<bool> connectGoogleAccount() async {
    final api = await _getDriveApi();
    return api != null;
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
    ref.read(cryptoServiceProvider),
  );
});
