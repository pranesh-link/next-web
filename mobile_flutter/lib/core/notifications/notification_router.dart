import 'package:go_router/go_router.dart';

/// Maps notification type strings to app routes for deep-link navigation.
abstract final class NotificationRouter {
  /// Returns the route path for a given notification type.
  static String routeForType(String type) {
    return switch (type) {
      'CHAT_MESSAGE' => '/chat',
      'COUPLE_INVITE' => '/notifications',
      'COUPLE_FORMED' => '/chat',
      'BUDGET_ALERT' || 'PUSH_BUDGET_ALERT' || 'BUDGET_EXCEEDED' => '/finance/budgets',
      'SIP_REMINDER' || 'PUSH_SIP_REMINDER' || 'INVESTMENT_SIP_REMINDER' => '/finance/investments',
      'DEPOSIT_REMINDER' || 'PUSH_DEPOSIT_REMINDER' || 'DEPOSIT_INSTALLMENT_REMINDER' || 'DEPOSIT_MATURITY_REMINDER' => '/finance/deposits',
      'GOAL_REACHED' || 'PUSH_GOAL_REMINDER' => '/finance/goals',
      'LOAN_EMI_REMINDER' || 'PUSH_LOAN_REMINDER' => '/finance/loans',
      'INCOME_REMINDER' => '/finance/transactions',
      'PUSH_TRANSACTION_ALERT' => '/finance/transactions',
      'PUSH_ACCOUNT_SYNC' => '/finance/accounts',
      _ => '/notifications',
    };
  }

  /// Navigate to the appropriate screen based on notification type.
  /// Uses go() to replace navigation instead of stacking.
  static void navigate(GoRouter router, String type) {
    router.go(routeForType(type));
  }
}
