import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

const _biometricEnabledKey = 'biometric_enabled';

/// Provider for biometric authentication service.
final biometricServiceProvider = Provider<BiometricService>((ref) {
  return BiometricService();
});

/// Provider that tracks whether biometric is enabled by user.
final biometricEnabledProvider =
    StateNotifierProvider<BiometricEnabledNotifier, bool>((ref) {
  return BiometricEnabledNotifier();
});

/// Notifier that persists the biometric enabled preference.
class BiometricEnabledNotifier extends StateNotifier<bool> {
  final _storage = const FlutterSecureStorage();

  BiometricEnabledNotifier() : super(false) {
    _load();
  }

  Future<void> _load() async {
    final value = await _storage.read(key: _biometricEnabledKey);
    state = value == 'true';
  }

  Future<void> toggle(bool enabled) async {
    await _storage.write(key: _biometricEnabledKey, value: enabled.toString());
    state = enabled;
  }
}

/// Service for biometric authentication (fingerprint/Face ID).
class BiometricService {
  final _auth = LocalAuthentication();

  /// Check if device supports biometric authentication.
  Future<bool> isAvailable() async {
    try {
      final canCheck = await _auth.canCheckBiometrics;
      final isSupported = await _auth.isDeviceSupported();
      return canCheck && isSupported;
    } on PlatformException {
      return false;
    }
  }

  /// Returns true if the user has at least one biometric enrolled on device.
  Future<bool> hasEnrolledBiometrics() async {
    try {
      final available = await _auth.getAvailableBiometrics();
      return available.isNotEmpty;
    } on PlatformException {
      return false;
    }
  }

  /// Authenticate the user with biometrics.
  Future<bool> authenticate() async {
    try {
      return await _auth.authenticate(
        localizedReason: 'Authenticate to access LuvVerse',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } on PlatformException {
      return false;
    }
  }
}
