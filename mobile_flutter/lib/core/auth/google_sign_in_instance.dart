import 'package:google_sign_in/google_sign_in.dart';

/// Web OAuth client ID from GCP project luvverse-pranaish (613218271037).
/// Same project as google-services.json — required for idToken issuance.
const _serverClientId =
    '613218271037-oht848dvug59av1tjclb0ga85vplhb97.apps.googleusercontent.com';

/// Shared singleton GoogleSignIn instance used across the app.
/// On Android: Play Services uses the Android OAuth client matched by
/// package name + signing cert SHA-1 from google-services.json project.
/// [serverClientId] requests an idToken for backend verification.
final googleSignInInstance = GoogleSignIn(
  scopes: ['email', 'profile'],
  serverClientId: _serverClientId,
);
