import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/cache/connectivity_wrapper.dart';
import 'package:luvverse/core/router/app_router.dart';
import 'package:luvverse/core/theme/app_theme.dart';

class LuvVerseApp extends ConsumerWidget {
  const LuvVerseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'LuvVerse',
      theme: AppTheme.light,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        return ConnectivityWrapper(child: child ?? const SizedBox.shrink());
      },
    );
  }
}
