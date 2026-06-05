package link.pranaish.luvverse

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

// Must extend FlutterFragmentActivity (not FlutterActivity) so the local_auth
// plugin can host the BiometricPrompt fragment. Otherwise authenticate() fails
// silently and the biometric toggle never persists.
class MainActivity : FlutterFragmentActivity() {

    private val notifChannel = "luvverse/notifications"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            notifChannel,
        ).setMethodCallHandler { call, result ->
            if (call.method == "openNotificationSettings") {
                try {
                    val intent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                        putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(intent)
                    result.success(null)
                } catch (e: Exception) {
                    // Fallback: open generic app settings
                    try {
                        val fallback = Intent(
                            Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                            Uri.fromParts("package", packageName, null),
                        ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
                        startActivity(fallback)
                        result.success(null)
                    } catch (e2: Exception) {
                        result.error("SETTINGS_ERROR", e2.message, null)
                    }
                }
            } else {
                result.notImplemented()
            }
        }
    }
}
