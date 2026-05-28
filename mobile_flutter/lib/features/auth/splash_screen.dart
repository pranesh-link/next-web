import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
import 'package:luvverse/core/lifecycle/app_lifecycle_manager.dart';
import 'package:luvverse/core/prefetch/prefetch_progress_provider.dart';
import 'package:luvverse/core/prefetch/splash_prefetch_service.dart';
import 'package:luvverse/core/quick_actions/quick_actions_service.dart';
import 'package:luvverse/core/router/app_router.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/features/onboarding/onboarding_screen.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  PrefetchResult? _prefetchResult;
  bool _isNavigating = false;
  Timer? _minWaitTimer;

  @override
  void initState() {
    super.initState();
    _checkResumeType();
    _initializeAndPrefetch();
  }

  @override
  void dispose() {
    _minWaitTimer?.cancel();
    super.dispose();
  }

  void _checkResumeType() async {
    final elapsed = await AppLifecycleManager.getTimeSinceBackground();
    if (elapsed != null && elapsed >= AppLifecycleManager.staleThreshold) {
      debugPrint('[Splash] Stale resume detected: ${elapsed.inMinutes} min');
    }
  }

  Future<void> _initializeAndPrefetch() async {
    final auth = ref.read(authProvider);

    // Only prefetch if authenticated
    if (!auth.isAuthenticated) {
      final completer = Completer<void>();
      _minWaitTimer = Timer(const Duration(seconds: 3), completer.complete);
      await completer.future;
      _minWaitTimer = null;
      if (mounted) _navigate();
      return;
    }

    // Start prefetch + minimum 3s wait
    final prefetchFuture = _prefetchData();
    final completer = Completer<void>();
    _minWaitTimer = Timer(const Duration(seconds: 3), completer.complete);
    await Future.wait([prefetchFuture, completer.future]);
    _minWaitTimer = null;

    if (mounted) _navigate();
  }

  Future<void> _prefetchData() async {
    debugPrint('[Splash] Starting background prefetch...');
    final service = SplashPrefetchService(ref);
    _prefetchResult = await service.prefetchAll();
    debugPrint('[Splash] Prefetch complete: ${_prefetchResult?.summary}');
  }

  void _navigate() {
    if (!mounted || _isNavigating) return;
    _isNavigating = true;
    
    final auth = ref.read(authProvider);

    // Initialize quick actions after splash
    final router = ref.read(routerProvider);
    QuickActionsService().init(router);

    // Check onboarding status
    final onboarding = ref.read(onboardingCompleteProvider);
    onboarding.when(
      data: (complete) {
        if (!complete) {
          context.go('/onboarding');
        } else if (auth.isAuthenticated) {
          context.go('/home');
        } else {
          context.go('/login');
        }
      },
      loading: () {
        // Default to login while loading
        if (auth.isAuthenticated) {
          context.go('/home');
        } else {
          context.go('/login');
        }
      },
      error: (_, __) {
        if (auth.isAuthenticated) {
          context.go('/home');
        } else {
          context.go('/login');
        }
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final progress = ref.watch(prefetchProgressProvider);

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [context.colors.gradientStart, context.colors.gradientEnd],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'LuvVerse',
                style: TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -0.5),
              ),
              const SizedBox(height: 8),
              const Text(
                'Everyday for the couple',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: Colors.white70, letterSpacing: 0.3),
              ),
              const SizedBox(height: 32),
              if (progress.currentItem.isNotEmpty) ...[
                SizedBox(
                  width: 200,
                  child: LinearProgressIndicator(
                    value: progress.completedItems / progress.totalItems,
                    backgroundColor: Colors.white24,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.white70),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  progress.currentItem,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: Colors.white60),
                ),
              ] else
                const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white70),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
