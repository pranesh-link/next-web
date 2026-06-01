import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:luvverse/features/auth/splash_screen.dart';
import 'package:luvverse/features/auth/login_screen.dart';
import 'package:luvverse/features/home/home_screen.dart';
import 'package:luvverse/features/finance/dashboard/finance_dashboard_screen.dart';
import 'package:luvverse/features/finance/accounts/accounts_screen.dart';
import 'package:luvverse/features/finance/accounts/account_detail_screen.dart';
import 'package:luvverse/features/finance/transactions/transactions_screen.dart';
import 'package:luvverse/features/finance/budgets/budgets_screen.dart';
import 'package:luvverse/features/finance/loans/loans_screen.dart';
import 'package:luvverse/features/finance/loans/loan_detail_screen.dart';
import 'package:luvverse/features/finance/goals/goals_screen.dart';
import 'package:luvverse/features/finance/deposits/deposits_screen.dart';
import 'package:luvverse/features/finance/investments/investments_screen.dart';
import 'package:luvverse/features/finance/budget_planner/budget_planner_screen.dart';
import 'package:luvverse/features/finance/notifications/notifications_screen.dart';
import 'package:luvverse/features/finance/scanning/scan_receipt_screen.dart';
import 'package:luvverse/features/finance/scanning/scan_schedule_screen.dart';
import 'package:luvverse/features/finance/finance_shell.dart';
import 'package:luvverse/features/couple/couple_management_screen.dart';
import 'package:luvverse/features/couple/couple_status_provider.dart';
import 'package:luvverse/features/lifestyle/lifestyle_screen.dart';
import 'package:luvverse/features/chat/chat_screen.dart';
import 'package:luvverse/features/chat/widgets/chat_gate_screen.dart';
import 'package:luvverse/features/settings/settings_screen.dart';
import 'package:luvverse/features/couple/invite_screen.dart';
import 'package:luvverse/features/onboarding/onboarding_screen.dart';
import 'package:luvverse/features/chat/pages/backup_settings_page.dart';
import 'package:luvverse/core/auth/auth_provider.dart';
import 'package:luvverse/core/router/pending_invite_provider.dart';

/// Navigation shell keys for nested navigation.
final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();
final _financeShellNavigatorKey = GlobalKey<NavigatorState>();

/// Provides the app router instance with auth-aware redirects.
final routerProvider = Provider<GoRouter>((ref) {
  final listenable = RouterRefreshNotifier(ref);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: listenable,
    redirect: (context, state) {
      // Normalize trailing slashes from deep links (e.g. luvverse://chat/ → /chat)
      final path = state.uri.path;
      if (path.length > 1 && path.endsWith('/')) {
        return path.substring(0, path.length - 1);
      }

      final auth = ref.read(authProvider);
      final isLoggedIn = auth.isAuthenticated;
      final isLoggingIn = state.uri.path == '/login';
      final isSplash = state.uri.path == '/splash';
      final isOnboarding = state.uri.path == '/onboarding';

      if (isSplash) return null;
      if (isOnboarding) return null;
      if (!isLoggedIn) {
        if (isLoggingIn) return null;
        // Preserve invite token across login redirect
        final inviteMatch = RegExp(r'^/couple/invite/(.+)$').firstMatch(state.uri.path);
        if (inviteMatch != null) {
          ref.read(pendingInviteTokenProvider.notifier).state = inviteMatch.group(1);
        }
        return '/login';
      }
      if (isLoggingIn) return '/home';
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => OnboardingScreen(
          onComplete: () => GoRouter.of(context).go('/login'),
        ),
      ),

      // Main shell with bottom navigation
      ShellRoute(
        navigatorKey: _shellNavigatorKey,
        builder: (context, state, child) => ScaffoldWithNavBar(child: child),
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: HomeScreen(),
            ),
          ),

          // Finance shell with nested routes
          ShellRoute(
            navigatorKey: _financeShellNavigatorKey,
            builder: (context, state, child) => FinanceShell(
              child: child,
              currentLocation: state.matchedLocation,
            ),
            routes: [
              GoRoute(
                path: '/finance',
                pageBuilder: (context, state) => const NoTransitionPage(
                  child: FinanceDashboardScreen(),
                ),
                routes: [
                  GoRoute(
                    path: 'accounts',
                    builder: (context, state) => const AccountsScreen(),
                    routes: [
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => AccountDetailScreen(
                          accountId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'transactions',
                    builder: (context, state) => const TransactionsScreen(),
                  ),
                  GoRoute(
                    path: 'budgets',
                    builder: (context, state) => const BudgetsScreen(),
                  ),
                  GoRoute(
                    path: 'loans',
                    builder: (context, state) => const LoansScreen(),
                    routes: [
                      GoRoute(
                        path: ':id',
                        builder: (context, state) => LoanDetailScreen(
                          loanId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'goals',
                    builder: (context, state) => const GoalsScreen(),
                  ),
                  GoRoute(
                    path: 'deposits',
                    builder: (context, state) => const DepositsScreen(),
                  ),
                  GoRoute(
                    path: 'investments',
                    builder: (context, state) => const InvestmentsScreen(),
                  ),
                  GoRoute(
                    path: 'budget-planner',
                    builder: (context, state) => const BudgetPlannerScreen(),
                  ),
                  GoRoute(
                    path: 'scan-receipt',
                    builder: (context, state) => const ScanReceiptScreen(),
                  ),
                  GoRoute(
                    path: 'scan-schedule',
                    builder: (context, state) => const ScanScheduleScreen(),
                  ),
                ],
              ),
            ],
          ),

          GoRoute(
            path: '/lifestyle',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: LifestyleScreen(),
            ),
          ),
          GoRoute(
            path: '/chat',
            pageBuilder: (context, state) {
              final hasCouple = ref.read(hasCoupleProvider);
              return NoTransitionPage(
                child: hasCouple.when(
                  data: (has) => has
                      ? const ChatScreen()
                      : const ChatGateScreen(),
                  loading: () => const ChatScreen(),
                  error: (_, __) => const ChatScreen(),
                ),
              );
            },
          ),
          GoRoute(
            path: '/settings',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: SettingsScreen(),
            ),
          ),
        ],
      ),

      // Notifications (outside FinanceShell to avoid double header)
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),

      // Couple management
      GoRoute(
        path: '/couple/manage',
        builder: (context, state) => const CoupleManagementScreen(),
      ),

      // Backup settings
      GoRoute(
        path: '/backup-settings',
        builder: (context, state) => const BackupSettingsPage(),
      ),

      // Deep link: couple invite
      GoRoute(
        path: '/couple/invite/:token',
        builder: (context, state) => InviteScreen(
          token: state.pathParameters['token']!,
        ),
      ),
    ],
  );
});

/// Bottom navigation bar scaffold wrapping the shell routes.
class ScaffoldWithNavBar extends ConsumerWidget {
  final Widget child;

  const ScaffoldWithNavBar({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Default to true (show Chat) — only hide when API confirms no couple.
    final hasCouple = ref.watch(hasCoupleProvider).valueOrNull ?? true;

    final destinations = <NavigationDestination>[
      const NavigationDestination(
        icon: Icon(Icons.home_outlined),
        selectedIcon: Icon(Icons.home),
        label: 'Home',
      ),
      const NavigationDestination(
        icon: Icon(Icons.account_balance_wallet_outlined),
        selectedIcon: Icon(Icons.account_balance_wallet),
        label: 'Finance',
      ),
      if (hasCouple)
        const NavigationDestination(
          icon: Icon(Icons.chat_bubble_outline),
          selectedIcon: Icon(Icons.chat_bubble),
          label: 'Chat',
        ),
      const NavigationDestination(
        icon: Icon(Icons.settings_outlined),
        selectedIcon: Icon(Icons.settings),
        label: 'Settings',
      ),
    ];

    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _calculateSelectedIndex(context, hasCouple),
        onDestinationSelected: (index) => _onItemTapped(index, context, hasCouple),
        destinations: destinations,
      ),
    );
  }

  int _calculateSelectedIndex(BuildContext context, bool hasCouple) {
    final location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/finance')) return 1;
    if (hasCouple && location.startsWith('/chat')) return 2;
    if (location.startsWith('/settings')) return hasCouple ? 3 : 2;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context, bool hasCouple) {
    if (hasCouple) {
      switch (index) {
        case 0:
          context.go('/home');
        case 1:
          context.go('/finance');
        case 2:
          context.go('/chat');
        case 3:
          context.go('/settings');
      }
    } else {
      switch (index) {
        case 0:
          context.go('/home');
        case 1:
          context.go('/finance');
        case 2:
          context.go('/settings');
      }
    }
  }
}

/// Bridges Riverpod auth state changes to GoRouter's Listenable refresh.
class RouterRefreshNotifier extends ChangeNotifier {
  RouterRefreshNotifier(Ref ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
}
