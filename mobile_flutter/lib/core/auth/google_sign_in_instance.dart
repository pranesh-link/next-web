import 'package:google_sign_in/google_sign_in.dart';

/// Web OAuth client ID for Google Sign-In (from Google Cloud Console).
/// Must be from the SAME GCP project as google-services.json (luvverse-pranaish).
/// Once created in GCP Console, replace this value.
/// When null, idToken won't be available — app falls back to accessToken flow.
const String? _serverClientId = String.fromEnvironment(
  'GOOGLE_SERVER_CLIENT_ID',
  defaultValue: '',
) == ''
    ? null
    : String.fromEnvironment('GOOGLE_SERVER_CLIENT_ID');

/// Shared singleton GoogleSignIn instance used across the app.
/// On Android: Play Services uses the Android OAuth client matched by
/// package name + signing cert SHA-1 from google-services.json project.
/// [serverClientId] requests an idToken for backend verification.
final googleSignInInstance = GoogleSignIn(
  scopes: ['email', 'profile'],
  serverClientId: _serverClientId,
);
