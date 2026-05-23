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
    // Disconnect to force account picker on subsequent sign-ins.
    await _googleSignIn.disconnect().catchError((_) => null);

    final googleUser = await _googleSignIn.signIn();
    if (googleUser == null) throw Exception('Google sign-in cancelled');

    final googleAuth = await googleUser.authentication;
    final idToken = googleAuth.idToken;

    // Prefer idToken exchange with backend (gives us a long-lived JWT).
    // Falls back to accessToken if idToken is unavailable (e.g. web or
    // when serverClientId isn't configured).
    if (idToken != null) {
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

    // Fallback: use Google access token directly as Bearer.
    // Backend's getAuthUserId() supports Google access tokens.
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
