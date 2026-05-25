import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
import 'package:luvverse/core/cache/cache_providers.dart';
import 'package:luvverse/core/cache/cache_service.dart';
import 'package:luvverse/core/cache/connectivity_service.dart';
import 'package:luvverse/core/cache/database.dart';
import 'package:luvverse/core/cache/mutation_queue.dart';
import 'package:luvverse/core/cache/sync_manager.dart';
import 'package:luvverse/core/network/api_client.dart';

import 'package:luvverse/app.dart';

/// A no-op SyncManager that does not start timers.
class _NoOpSyncManager extends SyncManager {
  _NoOpSyncManager(ApiClient client, CacheService cache, MutationQueueService queue)
      : super(client, cache, queue);

  @override
  void startPolling() {
    // No-op: avoid timers in test.
  }
}

void main() {
  testWidgets('App renders without crashing', (WidgetTester tester) async {
    final db = CacheDatabase(NativeDatabase.memory());
    final cacheService = CacheService(db);
    addTearDown(() => db.close());

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cacheDatabaseProvider.overrideWithValue(db),
          cacheServiceProvider.overrideWithValue(cacheService),
          connectivityProvider.overrideWith(
            (ref) => Stream.value(true),
          ),
          syncManagerProvider.overrideWith(
            (ref) => _NoOpSyncManager(
              ref.read(apiClientProvider),
              cacheService,
              MutationQueueService(db),
            ),
          ),
          authProvider.overrideWith(
            (ref) => AuthNotifier(ref.read(authRepositoryProvider), ref),
          ),
        ],
        child: const LuvVerseApp(),
      ),
    );

    await tester.pump();

    // App should render MaterialApp
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
