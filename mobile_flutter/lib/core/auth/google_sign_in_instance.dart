import 'package:google_sign_in/google_sign_in.dart';

/// Web OAuth client ID for Google Sign-In (from Google Cloud Console).
/// Must be from the SAME GCP project (24282158014) that has the Android
/// OAuth client registered with package link.pranaish.luvverse + SHA-1.
const _webClientId =
    '24282158014-46vngus6rh904t1pi4rbpsauaqqggb8h.apps.googleusercontent.com';

/// Shared singleton GoogleSignIn instance used across the app.
/// On Android: do NOT pass clientId — Play Services uses the Android OAuth
/// client matched by package name + signing cert SHA-1 automatically.
/// [serverClientId] requests an idToken for backend verification.
final googleSignInInstance = GoogleSignIn(
  scopes: ['email', 'profile'],
  serverClientId: _webClientId,
);
