import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';

/// Web OAuth client ID from GCP project luvverse-pranaish (613218271037).
/// Same project as google-services.json — required for idToken issuance.
const _serverClientId =
    '613218271037-0ggpisbgjhqit56nt9ep47vb73dh117i.apps.googleusercontent.com';

/// Shared singleton GoogleSignIn instance used across the app.
/// On Android: Play Services uses the Android OAuth client matched by
/// package name + signing cert SHA-1 from google-services.json project.
/// [serverClientId] requests an idToken for backend verification.
/// On iOS: the iOS OAuth client ID from GoogleService-Info.plist is used
/// automatically; serverClientId is needed for backend token exchange.
/// On Web: serverClientId is not supported — client ID is set via meta tag
/// in web/index.html instead.
final googleSignInInstance = GoogleSignIn(
  scopes: ['email', 'profile'],
  serverClientId: kIsWeb ? null : _serverClientId,
);
