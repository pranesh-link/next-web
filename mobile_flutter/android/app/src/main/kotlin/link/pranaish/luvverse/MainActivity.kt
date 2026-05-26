package link.pranaish.luvverse

import io.flutter.embedding.android.FlutterFragmentActivity

// Must extend FlutterFragmentActivity (not FlutterActivity) so the local_auth
// plugin can host the BiometricPrompt fragment. Otherwise authenticate() fails
// silently and the biometric toggle never persists.
class MainActivity : FlutterFragmentActivity()
