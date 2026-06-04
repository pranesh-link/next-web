import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/config/app_config.dart';

/// URL of the static maintenance/feature-flag JSON served by the web host.
const _kMaintenanceJsonUrl = 'https://pranesh.link/maintenance.json';

/// Fetches [AppConfig] from [_kMaintenanceJsonUrl].
///
/// Uses a plain unauthenticated [Dio] instance — no JWT required.
/// On any network or parse error, returns [AppConfig.defaults()] so the app
/// is never blocked by a missing config.
///
/// Invalidated on:
/// - Cold start (provider is created fresh each process)
/// - Stale resume ≥ 90 min ([ConnectivityWrapper] calls `ref.invalidate`)
final appConfigProvider = FutureProvider<AppConfig>((ref) async {
  try {
    final dio = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 8),
        receiveTimeout: const Duration(seconds: 8),
      ),
    );
    final response = await dio.get<Map<String, dynamic>>(_kMaintenanceJsonUrl);
    if (response.data == null) return AppConfig.defaults();
    return AppConfig.fromJson(response.data!);
  } catch (e) {
    debugPrint('[AppConfig] Failed to fetch maintenance.json: $e');
    // Fail open — never block the app if config is unreachable.
    return AppConfig.defaults();
  }
});
