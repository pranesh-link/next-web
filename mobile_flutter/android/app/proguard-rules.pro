## Flutter-specific ProGuard rules for release builds
## Prevents R8 from stripping native library bindings

# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }
-dontwarn io.flutter.embedding.**

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Flutter Secure Storage
-keep class com.it_nomads.fluttersecurestorage.** { *; }
-keep class androidx.security.crypto.** { *; }
-keep class com.google.crypto.tink.** { *; }
-dontwarn com.it_nomads.fluttersecurestorage.**

# SQLCipher (used by Drift)
-keep class net.zetetic.** { *; }
-keep class net.zetetic.database.** { *; }
-dontwarn net.zetetic.**

# Cryptography (ECDH key exchange for chat)
-keep class android.security.keystore.** { *; }
-keep class java.security.** { *; }
-dontwarn java.security.**

# Audioplayers
-keep class xyz.luan.audioplayers.** { *; }
-dontwarn xyz.luan.audioplayers.**

# Connectivity Plus
-keep class dev.fluttercommunity.plus.connectivity.** { *; }
-dontwarn dev.fluttercommunity.plus.connectivity.**

# Home Widget
-keep class es.antonborri.home_widget.** { *; }
-dontwarn es.antonborri.home_widget.**

# App widget provider
-keep class link.pranaish.luvverse.ChatWidgetProvider { *; }
-keep class link.pranaish.luvverse.MainActivity { *; }

# Keep annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes InnerClasses
-keepattributes EnclosingMethod

# Multidex
-keep class androidx.multidex.** { *; }
