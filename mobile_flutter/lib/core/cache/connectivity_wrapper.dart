import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/cache/cache_providers.dart';
import 'package:luvverse/core/cache/connectivity_service.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/features/finance/providers/extended_providers.dart';
import 'package:luvverse/shared/widgets/offline_widgets.dart';

/// Wraps the app to handle connectivity changes and auto-refresh.
class ConnectivityWrapper extends ConsumerStatefulWidget {
  final Widget child;
  const ConnectivityWrapper({super.key, required this.child});

  @override
  ConsumerState<ConnectivityWrapper> createState() =>
      _ConnectivityWrapperState();
}

class _ConnectivityWrapperState extends ConsumerState<ConnectivityWrapper> {
  bool _wasOffline = false;

  @override
  void initState() {
    super.initState();
    // Start sync polling
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(syncManagerProvider).startPolling();
    });
  }

  @override
  Widget build(BuildContext context) {
    // Listen to connectivity changes
    ref.listen(connectivityProvider, (prev, next) {
      next.whenData((isOnline) async {
        if (isOnline && _wasOffline) {
          // Reconnected — replay mutations and refresh data
          await _onReconnect();
        }
        _wasOffline = !isOnline;
        ref.read(isOnlineProvider.notifier).state = isOnline;
      });
    });

    return Column(
      children: [
        const OfflineBanner(),
        Expanded(child: widget.child),
      ],
    );
  }

  Future<void> _onReconnect() async {
    // Replay pending mutations
    final syncManager = ref.read(syncManagerProvider);
    final result = await syncManager.replayMutations();

    // Update pending count
    final queue = ref.read(mutationQueueProvider);
    final remaining = await queue.getPendingCount();
    ref.read(pendingSyncCountProvider.notifier).state = remaining;

    // Refresh all active providers
    ref.invalidate(accountsProvider);
    ref.invalidate(transactionsProvider);
    ref.invalidate(budgetsProvider);
    ref.invalidate(loansProvider);
    ref.invalidate(goalsProvider);
    ref.invalidate(depositsProvider);
    ref.invalidate(investmentsProvider);
    ref.invalidate(dashboardInsightsProvider);
    ref.invalidate(notificationsProvider);

    // Show sync result if there were failures
    if (result.hasFailures && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Synced ${result.succeeded} changes. ${result.failed} failed.',
          ),
        ),
      );
    }
  }
}
