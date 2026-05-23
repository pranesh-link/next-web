import 'package:google_sign_in/google_sign_in.dart';

/// Web OAuth client ID for Google Sign-In (from Google Cloud Console).
/// This must be a "Web application" type client from the SAME GCP project
/// that has the Android OAuth client registered with the app's SHA-1.
const _webClientId =
    '613218271037-REPLACE_WITH_WEB_CLIENT_ID.apps.googleusercontent.com';

/// Shared singleton GoogleSignIn instance used across the app.
/// On Android, the plugin uses google-services.json + GCP-registered Android
/// OAuth client (matched by package name + signing cert SHA-1).
/// [serverClientId] requests an idToken for backend verification.
final googleSignInInstance = GoogleSignIn(
  scopes: ['email', 'profile'],
  serverClientId: _webClientId,
);
