import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/auth/biometric_service.dart';

/// Full-screen lock overlay shown when app resumes and biometric is enabled.
class BiometricLockScreen extends ConsumerStatefulWidget {
  final Widget child;

  const BiometricLockScreen({super.key, required this.child});

  @override
  ConsumerState<BiometricLockScreen> createState() =>
      _BiometricLockScreenState();
}

class _BiometricLockScreenState extends ConsumerState<BiometricLockScreen>
    with WidgetsBindingObserver {
  bool _isLocked = false;
  bool _isAuthenticating = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final biometricEnabled = ref.read(biometricEnabledProvider);
    if (!biometricEnabled) return;

    if (state == AppLifecycleState.paused) {
      setState(() => _isLocked = true);
    } else if (state == AppLifecycleState.resumed && _isLocked) {
      _authenticate();
    }
  }

  Future<void> _authenticate() async {
    if (_isAuthenticating) return;
    _isAuthenticating = true;

    final service = ref.read(biometricServiceProvider);
    final success = await service.authenticate();

    if (success) {
      setState(() => _isLocked = false);
    }
    _isAuthenticating = false;
  }

  @override
  Widget build(BuildContext context) {
    if (!_isLocked) return widget.child;

    final colorScheme = Theme.of(context).colorScheme;

    return Stack(
      children: [
        widget.child,
        Positioned.fill(
          child: Material(
            color: colorScheme.surface,
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.lock_outline, size: 64, color: colorScheme.primary),
                  const SizedBox(height: 24),
                  Text(
                    'LuvVerse is Locked',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: colorScheme.onSurface,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Authenticate to continue',
                    style: TextStyle(
                      fontSize: 14,
                      color: colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                  const SizedBox(height: 32),
                  FilledButton.icon(
                    onPressed: _authenticate,
                    icon: const Icon(Icons.fingerprint),
                    label: const Text('Unlock'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
