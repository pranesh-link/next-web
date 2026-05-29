import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
import 'package:luvverse/core/auth/session_expired_provider.dart';
import 'package:luvverse/core/cache/cache_providers.dart';
import 'package:luvverse/core/cache/connectivity_service.dart';
import 'package:luvverse/core/lifecycle/app_lifecycle_manager.dart';
import 'package:luvverse/core/prefetch/wifi_cache_warmer.dart';
import 'package:luvverse/core/router/app_router.dart';
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

class _ConnectivityWrapperState extends ConsumerState<ConnectivityWrapper>
    with WidgetsBindingObserver {
  bool _wasOffline = false;
  bool _showBackOnline = false;
  Timer? _backOnlineTimer;
  bool _isHandlingResume = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    
    // Initialize WiFi cache warmer and start sync polling
    WidgetsBinding.instance.addPostFrameCallback((_) {
      WiFiCacheWarmer(ref).init();
      ref.read(syncManagerProvider).startPolling();
    });
  }

  @override
  void dispose() {
    _backOnlineTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) async {
    if (state == AppLifecycleState.paused) {
      // App going to background - record timestamp
      await AppLifecycleManager.recordBackgroundTime();
    } else if (state == AppLifecycleState.resumed) {
      // App resumed - check if data is stale
      await _handleResume();
    }
  }

  Future<void> _handleResume() async {
    if (_isHandlingResume) return;
    _isHandlingResume = true;
    
    final shouldShowSplash = await AppLifecycleManager.shouldShowSplash();
    final isOnline = ref.read(isOnlineProvider);
    
    if (shouldShowSplash && isOnline) {
      debugPrint('[Resume] Data stale, showing splash screen');
      await _navigateToSplash();
    } else if (!shouldShowSplash && isOnline) {
      debugPrint('[Resume] Data fresh, lightweight check');
      await _lightweightCacheCheck();
    }
    
    _isHandlingResume = false;
  }

  Future<void> _navigateToSplash() async {
    _invalidateAllProviders();
    final router = ref.read(routerProvider);
    router.go('/splash');
    await AppLifecycleManager.clearBackgroundTime();
  }

  void _invalidateAllProviders() {
    ref.invalidate(accountsProvider);
    ref.invalidate(transactionsProvider);
    ref.invalidate(budgetsProvider);
    ref.invalidate(loansProvider);
    ref.invalidate(goalsProvider);
    ref.invalidate(depositsProvider);
    ref.invalidate(investmentsProvider);
    ref.invalidate(dashboardInsightsProvider);
    ref.invalidate(notificationsProvider);
    ref.invalidate(healthScoreProvider);
  }

  Future<void> _lightweightCacheCheck() async {
    final cacheService = ref.read(cacheServiceProvider);
    final userId = ref.read(dbUserIdProvider);
    if (userId == null) return;
    
    final accountsStale = await cacheService.isStale('accounts:$userId');
    final notifStale = await cacheService.isStale('notifications:$userId');
    
    if (accountsStale) ref.read(accountsProvider.notifier).refresh();
    if (notifStale) ref.read(notificationsProvider.notifier).refresh();
  }

  @override
  Widget build(BuildContext context) {
    // Listen to connectivity changes
    ref.listen(connectivityProvider, (prev, next) {
      next.whenData((isOnline) async {
        if (isOnline && _wasOffline) {
          // Reconnected — replay mutations and refresh data
          await _onReconnect();
          _showBackOnlineBanner();
        }
        _wasOffline = !isOnline;
        ref.read(isOnlineProvider.notifier).state = isOnline;
      });
    });

    // Listen for session expiry — show dialog before forced logout.
    ref.listen(sessionExpiredProvider, (prev, next) {
      if (next && !(prev ?? false) && mounted) {
        _showSessionExpiredDialog();
      }
    });

    return Column(
      children: [
        if (_showBackOnline)
          const _BackOnlineBanner()
        else
          const OfflineBanner(),
        Expanded(child: widget.child),
      ],
    );
  }

  void _showBackOnlineBanner() {
    setState(() => _showBackOnline = true);
    _backOnlineTimer?.cancel();
    _backOnlineTimer = Timer(const Duration(seconds: 3), () {
      if (mounted) setState(() => _showBackOnline = false);
    });
  }

  Future<void> _onReconnect() async {
    // Replay pending mutations
    final syncManager = ref.read(syncManagerProvider);
    final result = await syncManager.replayMutations();

    // Update pending count
    final queue = ref.read(mutationQueueProvider);
    final remaining = await queue.getPendingCount();
    ref.read(pendingSyncCountProvider.notifier).state = remaining;

    // Refresh all active providers on reconnect
    await _lightweightCacheCheck();

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

  void _showSessionExpiredDialog() {
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Session Expired'),
        content: const Text(
          'Your session has expired. Please sign in again.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              ref.read(sessionExpiredProvider.notifier).state = false;
              ref.read(authProvider.notifier).signOut();
            },
            child: const Text('Sign In'),
          ),
        ],
      ),
    );
  }
}

/// Green banner shown for 3 seconds when connectivity is restored.
class _BackOnlineBanner extends StatelessWidget {
  const _BackOnlineBanner();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
        color: const Color(0xFF4CAF50),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.wifi, size: 16, color: Colors.white),
            SizedBox(width: 8),
            Text(
              'You are back online',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
