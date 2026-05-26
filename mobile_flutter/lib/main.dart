import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/app.dart';
import 'package:luvverse/core/cache/cache_providers.dart';
import 'package:luvverse/core/cache/cache_service.dart';
import 'package:luvverse/core/cache/platform.dart';
import 'package:luvverse/core/notifications/push_notification_service.dart';

void main() async {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();

    // Initialize Firebase
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Global Flutter error handler — prevents crashes on unhandled exceptions.
    FlutterError.onError = (details) {
      FlutterError.presentError(details);
      if (kDebugMode) debugPrint('FlutterError: ${details.exception}');
    };

    Intl.defaultLocale = 'en_IN';
    await initializeDateFormatting('en_IN');

    // Initialize offline cache database (web.dart has built-in fallback)
    final cacheDb = await openCacheDatabase();

    try {
      final cacheService = CacheService(cacheDb);
      await cacheService.prune();
    } catch (_) {}

    runApp(
      ProviderScope(
        overrides: [
          cacheDatabaseProvider.overrideWithValue(cacheDb),
        ],
        child: const LuvVerseApp(),
      ),
    );
  }, (error, stack) {
    // Catches async errors not handled by Flutter framework.
    if (kDebugMode) {
      debugPrint('Unhandled error: $error');
      debugPrint('$stack');
    }
  });
}
