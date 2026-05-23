import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
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
  _NoOpSyncManager()
      : super(
          ApiClient(),
          CacheService(CacheDatabase(NativeDatabase.memory())),
          MutationQueueService(CacheDatabase(NativeDatabase.memory())),
        );

  @override
  void startPolling() {
    // No-op: avoid timers in test.
  }
}

void main() {
  testWidgets('App renders without crashing', (WidgetTester tester) async {
    final db = CacheDatabase(NativeDatabase.memory());
    addTearDown(() => db.close());

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cacheDatabaseProvider.overrideWithValue(db),
          connectivityProvider.overrideWith(
            (ref) => Stream.value(true),
          ),
          syncManagerProvider.overrideWithValue(_NoOpSyncManager()),
        ],
        child: const LuvVerseApp(),
      ),
    );

    await tester.pump();

    // App should render MaterialApp
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
