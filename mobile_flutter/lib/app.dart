import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/auth/biometric_lock_screen.dart';
import 'package:luvverse/core/cache/connectivity_wrapper.dart';
import 'package:luvverse/core/notifications/notification_router.dart';
import 'package:luvverse/core/notifications/push_providers.dart';
import 'package:luvverse/core/router/app_router.dart';
import 'package:luvverse/core/theme/app_theme.dart';
import 'package:luvverse/core/theme/theme_provider.dart';
import 'package:luvverse/features/couple/couple_status_provider.dart';

class LuvVerseApp extends ConsumerStatefulWidget {
  const LuvVerseApp({super.key});

  @override
  ConsumerState<LuvVerseApp> createState() => _LuvVerseAppState();
}

class _LuvVerseAppState extends ConsumerState<LuvVerseApp> {
  @override
  void initState() {
    super.initState();
    // Wire notification taps to router navigation after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final pushService = ref.read(pushNotificationServiceProvider);
      final router = ref.read(routerProvider);
      pushService.setOnTapCallback((type) {
        NotificationRouter.navigate(router, type);
      });

      // Refresh couple state when partner accepts invite (foreground push)
      pushService.setOnCoupleFormedCallback(() {
        ref.invalidate(hasCoupleProvider);
      });

      // Handle notification that launched the app from terminated state
      final initialMessage = pushService.consumeInitialMessage();
      if (initialMessage != null) {
        final type = initialMessage.data['type'] as String? ?? '';
        NotificationRouter.navigate(router, type);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeProvider);

    return MaterialApp.router(
      title: 'LuvVerse',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        return BiometricLockScreen(
          child: ConnectivityWrapper(child: child ?? const SizedBox.shrink()),
        );
      },
    );
  }
}
