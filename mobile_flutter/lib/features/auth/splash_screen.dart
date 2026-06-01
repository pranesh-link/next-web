import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
import 'package:luvverse/core/auth/secure_storage.dart';
import 'package:luvverse/core/lifecycle/app_lifecycle_manager.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/core/network/api_endpoints.dart';
import 'package:luvverse/core/prefetch/prefetch_progress_provider.dart';
import 'package:luvverse/core/prefetch/splash_prefetch_service.dart';
import 'package:luvverse/core/quick_actions/quick_actions_service.dart';
import 'package:luvverse/core/router/app_router.dart';
import 'package:luvverse/core/theme/app_colors_extension.dart';
import 'package:luvverse/core/router/pending_invite_provider.dart';
import 'package:luvverse/features/chat/services/chat_key_bootstrap.dart';
import 'package:luvverse/features/onboarding/onboarding_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

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

    // On stale resume, proactively refresh the JWT to avoid 401 cascade
    if (await AppLifecycleManager.shouldShowSplash()) {
      await _proactiveTokenRefresh();
    }

    // Start prefetch + minimum 3s wait
    final prefetchFuture = _prefetchData();
    final completer = Completer<void>();
    _minWaitTimer = Timer(const Duration(seconds: 3), completer.complete);
    await Future.wait([prefetchFuture, completer.future]);
    _minWaitTimer = null;

    if (mounted) _navigate();
  }

  /// Attempts to refresh the JWT token proactively before making API calls.
  /// Prevents the "session expired" dialog on stale resume.
  Future<void> _proactiveTokenRefresh() async {
    try {
      final refreshToken = await SecureStorage.getRefreshToken();
      if (refreshToken == null) return;
      final dio = Dio(BaseOptions(baseUrl: kApiBaseUrl));
      final response = await dio.post<Map<String, dynamic>>(
        ApiEndpoints.refreshToken,
        data: {'refreshToken': refreshToken},
      );
      final body = response.data;
      final newToken = body?['token'] as String?;
      final newRefresh = body?['refreshToken'] as String?;
      if (newToken != null) await SecureStorage.saveToken(newToken);
      if (newRefresh != null) await SecureStorage.saveRefreshToken(newRefresh);
      debugPrint('[Splash] Proactive token refresh succeeded');
    } catch (e) {
      debugPrint('[Splash] Proactive token refresh failed: $e');
    }
  }

  Future<void> _prefetchData() async {
    debugPrint('[Splash] Starting background prefetch...');
    final service = SplashPrefetchService(ref);
    _prefetchResult = await service.prefetchAll();
    debugPrint('[Splash] Prefetch complete: ${_prefetchResult?.summary}');

    // Bootstrap E2E chat keys early so both partners have keys uploaded
    // before either opens chat. Fire-and-forget — doesn't block navigation.
    ref.read(chatKeyBootstrapProvider).ensureBootstrapped().then((ready) {
      debugPrint('[Splash] Chat key bootstrap: ready=$ready');
    }).catchError((_) {});

    // If a COUPLE_FORMED push arrived while app was terminated, bootstrap now
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool('pendingE2EBootstrap') == true) {
      await prefs.remove('pendingE2EBootstrap');
      ref.read(chatKeyBootstrapProvider).ensureBootstrapped().then((ready) {
        debugPrint('[Splash] Pending bootstrap after COUPLE_FORMED: ready=$ready');
      }).catchError((_) {});
    }
  }

  void _navigate() {
    if (!mounted || _isNavigating) return;
    _isNavigating = true;
    
    final auth = ref.read(authProvider);

    // Initialize quick actions after splash
    final router = ref.read(routerProvider);
    QuickActionsService().init(router);

    // If an invite deep link arrived before login, honour it now
    final pendingToken = ref.read(pendingInviteTokenProvider);
    if (pendingToken != null) {
      ref.read(pendingInviteTokenProvider.notifier).state = null;
      context.go('/couple/invite/$pendingToken');
      return;
    }

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
