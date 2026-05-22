import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:luvverse/core/auth/secure_storage.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/models/user.dart';

/// Web OAuth client ID for Google Sign-In (from Google Cloud Console).
const _webClientId =
    '24282158014-46vngus6rh904t1pi4rbpsauaqqggb8h.apps.googleusercontent.com';

/// Android/iOS OAuth client ID.
const _mobileClientId =
    '24282158014-lj19o58fhi59jdd5qgip68bh41f6hvj6.apps.googleusercontent.com';

class AuthRepository {
  final ApiClient _api;

  AuthRepository(this._api);

  // On web, clientId comes from the <meta name="google-signin-client_id"> tag
  // in web/index.html. Passing it here too causes GIS double-initialization.
  final _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    clientId: kIsWeb ? null : _mobileClientId,
    serverClientId: kIsWeb ? null : _webClientId,
  );

  Future<User> signInWithGoogle() async {
    // Disconnect first to force account picker popup on web
    await _googleSignIn.disconnect().catchError((_) => null);

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
  }

  Future<({User? user, String? token})> getStoredCredentials() async {
    final token = await SecureStorage.getToken();
    final user = await SecureStorage.getUser();
    return (user: user, token: token);
  }
}
