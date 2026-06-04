import 'dart:async';

import 'package:google_sign_in/google_sign_in.dart';
import 'package:luvverse/core/auth/google_sign_in_instance.dart';
import 'package:luvverse/core/auth/secure_storage.dart';
import 'package:luvverse/core/cache/cache_service.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/user.dart';

class AuthRepository {
  final ApiClient _api;
  final CacheService? _cache;

  AuthRepository(this._api, [this._cache]);

  final GoogleSignIn _googleSignIn = googleSignInInstance;

  /// Timeout for the Google Sign-In popup flow.
  static const _signInTimeout = Duration(seconds: 30);

  Future<({User user, String token})> signInWithGoogle() async {
    // Sign out locally to force account picker on subsequent sign-ins.
    // NOTE: Do NOT use disconnect() — on web (GIS 0.12+) it calls revoke()
    // which can cause the credential callback to never fire, freezing the UI.
    // Timeout guards against rare hangs on first launch (no prior session).
    try {
      await _googleSignIn.signOut().timeout(const Duration(seconds: 5));
    } catch (_) {}

    final googleUser = await _googleSignIn.signIn().timeout(
      _signInTimeout,
      onTimeout: () => throw TimeoutException('Google sign-in timed out'),
    );
    if (googleUser == null) throw Exception('Google sign-in cancelled');

    final googleAuth = await googleUser.authentication.timeout(
      const Duration(seconds: 10),
      onTimeout: () => throw TimeoutException('Token retrieval timed out'),
    );

    // Prefer idToken (available when serverClientId is set on Android, or
    // via GIS credential response on web). Falls back to accessToken.
    final idToken = googleAuth.idToken;
    final data = idToken != null
        ? {'idToken': idToken}
        : {'accessToken': googleAuth.accessToken ?? (throw Exception('No credentials received'))};

    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.auth,
      data: data,
    );

    return _saveCredentials(response);
  }

  /// Returns stored credentials (may be null on fresh install).
  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await SecureStorage.clearAll();
    await _cache?.clearAll();
  }

  Future<({User? user, String? token})> getStoredCredentials() async {
    final token = await SecureStorage.getToken();
    final user = await SecureStorage.getUser();
    return (user: user, token: token);
  }

  Future<({User user, String token})> _saveCredentials(Map<String, dynamic> response) async {
    final token = response['token'] as String;
    final refreshToken = response['refreshToken'] as String?;
    final userData = User.fromJson(response['user'] as Map<String, dynamic>);

    await SecureStorage.saveToken(token);
    if (refreshToken != null) {
      await SecureStorage.saveRefreshToken(refreshToken);
    }
    await SecureStorage.saveUser(userData);
    // Return token directly to avoid a redundant SecureStorage read-back which
    // can block on iOS (keychain access) on first install.
    return (user: userData, token: token);
  }
}
