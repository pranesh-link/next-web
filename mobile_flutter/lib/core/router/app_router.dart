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
import 'package:luvverse/features/lifestyle/lifestyle_screen.dart';
import 'package:luvverse/features/settings/settings_screen.dart';
import 'package:luvverse/features/couple/invite_screen.dart';
import 'package:luvverse/features/onboarding/onboarding_screen.dart';
import 'package:luvverse/core/auth/auth_provider.dart';

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
      final auth = ref.read(authProvider);
      final isLoggedIn = auth.isAuthenticated;
      final isLoggingIn = state.uri.path == '/login';
      final isSplash = state.uri.path == '/splash';
      final isOnboarding = state.uri.path == '/onboarding';

      if (isSplash) return null;
      if (isOnboarding) return null;
      if (!isLoggedIn) return isLoggingIn ? null : '/login';
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
                    path: 'notifications',
                    builder: (context, state) => const NotificationsScreen(),
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
            path: '/settings',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: SettingsScreen(),
            ),
          ),
        ],
      ),

      // Couple management
      GoRoute(
        path: '/couple/manage',
        builder: (context, state) => const CoupleManagementScreen(),
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
class ScaffoldWithNavBar extends StatelessWidget {
  final Widget child;

  const ScaffoldWithNavBar({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _calculateSelectedIndex(context),
        onDestinationSelected: (index) => _onItemTapped(index, context),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet),
            label: 'Finance',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }

  int _calculateSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/finance')) return 1;
    if (location.startsWith('/settings')) return 2;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
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

/// Bridges Riverpod auth state changes to GoRouter's Listenable refresh.
class RouterRefreshNotifier extends ChangeNotifier {
  RouterRefreshNotifier(Ref ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
}
