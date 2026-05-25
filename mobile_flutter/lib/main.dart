import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:luvverse/app.dart';
import 'package:luvverse/core/cache/cache_providers.dart';
import 'package:luvverse/core/cache/cache_service.dart';
import 'package:luvverse/core/cache/platform.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
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
}
