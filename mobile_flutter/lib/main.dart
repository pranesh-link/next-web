import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/app.dart';
import 'package:luvverse/core/cache/cache_providers.dart';
import 'package:luvverse/core/cache/cache_service.dart';
import 'package:luvverse/core/cache/database.dart';
import 'package:luvverse/core/cache/platform.dart';
import 'package:luvverse/core/notifications/push_notification_service.dart';

void main() async {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();

    // Initialize Firebase — must not crash the app if misconfigured.
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    } catch (e) {
      debugPrint('[main] Firebase init failed: $e');
    }

    // Global Flutter error handler — prevents crashes on unhandled exceptions.
    FlutterError.onError = (details) {
      FlutterError.presentError(details);
      debugPrint('FlutterError: ${details.exception}');
    };

    Intl.defaultLocale = 'en_IN';
    await initializeDateFormatting('en_IN');

    // Initialize offline cache database with fallback.
    late CacheDatabase cacheDb;
    try {
      cacheDb = await openCacheDatabase();
      final cacheService = CacheService(cacheDb);
      await cacheService.prune();
    } catch (e) {
      debugPrint('[main] Cache DB init failed: $e');
      // Fallback: create in-memory database so the app still launches.
      cacheDb = await openCacheDatabase(fallbackToMemory: true);
    }

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
    // Log in ALL modes — silent swallow in release causes invisible crashes.
    debugPrint('Unhandled error: $error');
    debugPrint('$stack');
  });
}
