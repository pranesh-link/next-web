import 'package:flutter/foundation.dart';

/// Remote app configuration fetched from `pranesh.link/maintenance.json`.
///
/// Controls enabled features and maintenance mode. Fetched on cold start
/// and on every stale resume (≥ 90 min in background).
@immutable
class AppConfig {
  final String minAppVersion;
  final List<String> enabledFeatures;
  final bool maintenanceMode;
  final String maintenanceMessage;

  const AppConfig({
    required this.minAppVersion,
    required this.enabledFeatures,
    required this.maintenanceMode,
    required this.maintenanceMessage,
  });

  factory AppConfig.fromJson(Map<String, dynamic> json) {
    return AppConfig(
      minAppVersion: (json['minAppVersion'] as String?) ?? '1.0.0',
      enabledFeatures: (json['enabledFeatures'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const ['finance', 'chat'],
      maintenanceMode: (json['maintenanceMode'] as bool?) ?? false,
      maintenanceMessage: (json['maintenanceMessage'] as String?) ?? '',
    );
  }

  /// Fail-open defaults used when the config URL is unreachable.
  factory AppConfig.defaults() {
    return const AppConfig(
      minAppVersion: '1.0.0',
      enabledFeatures: ['finance', 'chat'],
      maintenanceMode: false,
      maintenanceMessage: '',
    );
  }

  /// Returns true if [feature] is present in [enabledFeatures].
  bool isEnabled(String feature) => enabledFeatures.contains(feature);
}
