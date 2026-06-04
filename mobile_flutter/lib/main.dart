import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
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
import 'package:luvverse/features/chat/cache/chat_database.dart';
import 'package:luvverse/features/chat/cache/chat_db_providers.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();

    // Initialize Firebase — must not crash the app if misconfigured.
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // Enable Crashlytics — captures native + Flutter crashes remotely.
      await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);
      FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
    } catch (e) {
      debugPrint('[main] Firebase init failed: $e');
      // Fallback error handler if Crashlytics fails to init.
      FlutterError.onError = (details) {
        FlutterError.presentError(details);
        debugPrint('FlutterError: ${details.exception}');
      };
    }

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

    // Initialize chat-specific local database.
    late ChatLocalDatabase chatDb;
    try {
      chatDb = await openChatDatabase();
    } catch (e, st) {
      // Record the failure — this should never happen in normal operation.
      // Do NOT fall back to NativeDatabase.memory(): an in-memory DB loses all
      // messages on force-close, making the problem invisible and recurring.
      FirebaseCrashlytics.instance.recordError(
        e,
        st,
        reason: 'chat-db-init-failed',
        fatal: false,
      );
      debugPrint('[main] Chat DB init failed: $e — resetting sentinel and retrying');
      // Clear the sentinel so openChatDatabase() treats next launch as first-launch
      // and generates a fresh key instead of entering the retry loop again.
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('chat_db_key_written');
      // Retry once with a clean slate (fresh encrypted DB, empty cache).
      // Messages will be re-synced from the server on first fetch.
      chatDb = await openChatDatabase();
    }

    runApp(
      ProviderScope(
        overrides: [
          cacheDatabaseProvider.overrideWithValue(cacheDb),
          chatLocalDatabaseProvider.overrideWithValue(chatDb),
        ],
        child: const LuvVerseApp(),
      ),
    );
  }, (error, stack) {
    // Catches async errors not handled by Flutter framework.
    // Report to Crashlytics for remote visibility.
    FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    debugPrint('Unhandled error: $error');
    debugPrint('$stack');
  });
}
