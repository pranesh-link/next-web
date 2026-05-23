import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';

/// Web OAuth client ID for Google Sign-In (from Google Cloud Console).
const _webClientId =
    '24282158014-46vngus6rh904t1pi4rbpsauaqqggb8h.apps.googleusercontent.com';

/// Android/iOS OAuth client ID.
const _mobileClientId =
    '24282158014-lj19o58fhi59jdd5qgip68bh41f6hvj6.apps.googleusercontent.com';

/// Shared singleton GoogleSignIn instance used across the app.
/// Ensures token refresh reuses the same session as the initial sign-in.
final googleSignInInstance = GoogleSignIn(
  scopes: ['email', 'profile'],
  clientId: kIsWeb ? null : _mobileClientId,
  serverClientId: kIsWeb ? null : _webClientId,
);
