import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
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
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(seconds: 3), _navigate);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _navigate() {
    if (!mounted) return;
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
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [context.colors.gradientStart, context.colors.gradientEnd],
          ),
        ),
        child: const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'LuvVerse',
                style: TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: -0.5),
              ),
              SizedBox(height: 8),
              Text(
                'Everyday for the couple',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: Colors.white70, letterSpacing: 0.3),
              ),
              SizedBox(height: 32),
              SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white70)),
            ],
          ),
        ),
      ),
    );
  }
}
