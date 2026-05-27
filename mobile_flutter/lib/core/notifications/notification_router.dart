import 'package:go_router/go_router.dart';

/// Maps notification type strings to app routes for deep-link navigation.
/// Only COUPLE_INVITE and BUDGET_ALERT notifications are supported.
abstract final class NotificationRouter {
  /// Supported notification types - only these should be created by backend.
  static const List<String> supportedTypes = [
    'COUPLE_INVITE',
    'BUDGET_ALERT',
    'PUSH_BUDGET_ALERT',
  ];

  /// Returns the route path for a given notification type.
  static String routeForType(String type) {
    return switch (type) {
      'COUPLE_INVITE' => '/finance/notifications',
      'BUDGET_ALERT' || 'PUSH_BUDGET_ALERT' => '/finance/budget-planner',
      _ => '/finance/notifications',
    };
  }

  /// Navigate to the appropriate screen based on notification type.
  /// Uses [push] to preserve the navigation stack, allowing back navigation.
  static void navigate(GoRouter router, String type) {
    router.push(routeForType(type));
  }
}
