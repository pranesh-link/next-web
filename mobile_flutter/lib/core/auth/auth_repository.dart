import 'package:flutter/foundation.dart' show kIsWeb;
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

  Future<User> signInWithGoogle() async {
    // On native, disconnect to force account picker. On web, skip it —
    // the async gap breaks the user-gesture chain and browsers block the popup.
    if (!kIsWeb) {
      await _googleSignIn.disconnect().catchError((_) => null);
    }

    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) throw Exception('Google sign-in cancelled');

    final googleAuth = await googleUser.authentication;

    if (kIsWeb) {
      // Web: idToken is not available. Use access token as Bearer.
      // Backend's getAuthUserId() supports Google access tokens directly.
      final accessToken = googleAuth.accessToken;
      if (accessToken == null) throw Exception('No access token received');

      await SecureStorage.saveToken(accessToken);

      final user = User(
        id: googleUser.id,
        name: googleUser.displayName ?? '',
        email: googleUser.email,
        image: googleUser.photoUrl,
      );
      await SecureStorage.saveUser(user);
      return user;
    }

    // Native: exchange idToken for our own long-lived JWT
    final idToken = googleAuth.idToken;
    if (idToken == null) throw Exception('No ID token received');

    final response = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.auth,
      data: {'idToken': idToken},
    );

    final token = response['token'] as String;
    final userData = User.fromJson(response['user'] as Map<String, dynamic>);

    await SecureStorage.saveToken(token);
    await SecureStorage.saveUser(userData);

    return userData;
  }

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
}
