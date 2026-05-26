import 'package:go_router/go_router.dart';
import 'package:quick_actions/quick_actions.dart';

/// Defines home screen quick actions (3D Touch / long-press app icon).
class QuickActionsService {
  final QuickActions _quickActions = const QuickActions();

  /// Initializes quick action shortcuts and handles action callbacks.
  ///
  /// Uses [router] to navigate when a shortcut is triggered.
  void init(GoRouter router) {
    _quickActions.setShortcutItems([
      const ShortcutItem(
        type: 'add_transaction',
        localizedTitle: 'Add Transaction',
        icon: 'add_circle',
      ),
      const ShortcutItem(
        type: 'scan_receipt',
        localizedTitle: 'Scan Receipt',
        icon: 'camera',
      ),
    ]);

    _quickActions.initialize((type) {
      switch (type) {
        case 'add_transaction':
          router.go('/finance/transactions');
          break;
        case 'scan_receipt':
          router.go('/finance/scan-receipt');
          break;
      }
    });
  }
}
