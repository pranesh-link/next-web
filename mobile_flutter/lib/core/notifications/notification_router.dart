import 'package:go_router/go_router.dart';

/// Maps notification type strings to app routes for deep-link navigation.
abstract final class NotificationRouter {
  /// Returns the route path for a given notification type.
  static String routeForType(String type) {
    return switch (type) {
      'COUPLE_INVITE' => '/finance/notifications',
      'BUDGET_ALERT' => '/finance/budgets',
      'SIP_REMINDER' => '/finance/investments',
      'DEPOSIT_REMINDER' => '/finance/deposits',
      'GOAL_REACHED' => '/finance/goals',
      'LOAN_EMI_REMINDER' => '/finance/loans',
      'INCOME_REMINDER' => '/finance/transactions',
      _ => '/finance/notifications',
    };
  }

  /// Navigate to the appropriate screen based on notification type.
  static void navigate(GoRouter router, String type) {
    router.go(routeForType(type));
  }
}
