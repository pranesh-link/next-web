---
name: mobile-flutter-finance
description: "Flutter finance module for LuvVerse (mobile_flutter/lib/features/finance/ and mobile_flutter/lib/core/finance/). Covers provider map, optimistic CRUD pattern, balance masking, model field names, and which widgets show monetary values. Use when building or modifying any Flutter finance screen, notifier, or form."
applyTo: "mobile_flutter/lib/features/finance/**,mobile_flutter/lib/core/finance/**"
---

# Mobile Flutter Finance Module

## Provider Map

### `lib/features/finance/providers/finance_providers.dart`
Core CRUD providers — accounts, transactions, budgets, loans, goals.

| Provider | Notifier class | State type |
|----------|---------------|------------|
| `accountsProvider` | `AccountsNotifier` | `List<Account>` |
| `accountBalanceHistoryProvider(accountId)` | FutureProvider.family | `List<BalanceHistoryEntry>` |
| `transactionsProvider` | `TransactionsNotifier` | `List<Transaction>` |
| `budgetsProvider` | `BudgetsNotifier` | `List<Budget>` |
| `loansProvider` | `LoansNotifier` | `List<Loan>` |
| `goalsProvider` | `GoalsNotifier` | `List<Goal>` |
| `totalBalanceProvider` | — (Provider) | `AsyncValue<double>` |
| `monthlyIncomeProvider` | — (Provider) | `AsyncValue<double>` |
| `monthlyExpenseProvider` | — (Provider) | `AsyncValue<double>` |
| `savingsRateProvider` | — (Provider) | `AsyncValue<double>` |
| `selectedMonthProvider` | StateProvider | `String` (`"yyyy-MM"`) |
| `dbUserIdProvider` | StateProvider | `String?` |

### `lib/features/finance/providers/extended_providers.dart`
Extended providers — deposits, investments, insights, health, budget plans, notifications.

| Provider | Notifier class | State type |
|----------|---------------|------------|
| `depositsProvider` | `DepositsNotifier` | `List<Deposit>` |
| `investmentsProvider` | `InvestmentsNotifier` | `List<Investment>` |
| `budgetPlanProvider` | `BudgetPlanNotifier` | `BudgetPlan?` |
| `notificationsProvider` | `NotificationsNotifier` | `NotificationsResponse` |
| `dashboardInsightsProvider` | `DashboardInsightsNotifier` | `DashboardInsights` |
| `healthScoreProvider` | — (FutureProvider) | `HealthScore` |
| `netWorthProvider` | — (Provider) | `AsyncValue<NetWorthData>` |
| `unreadNotificationCountProvider` | — (Provider) | `AsyncValue<int>` |

### `lib/core/finance/balance_masked_provider.dart`
```dart
final balanceMaskedProvider = StateNotifierProvider<BalanceMaskedNotifier, bool>
// Persists to SharedPreferences key 'balanceMasked'
// Toggle: ref.read(balanceMaskedProvider.notifier).toggle()
```

## Optimistic CRUD Pattern

All notifiers expose:
- `updateOptimistic(id, Map<String, dynamic> data)` — patches state immediately, no API call
- `removeOptimistic(id)` — removes item immediately, no API call
- `AccountsNotifier` also has `revertAccountOptimistic(id, originalJson)`

### Standard mutation form `_submit()` pattern
Close modal first, API fires in background, roll back on failure:

```dart
Future<void> _submit() async {
  if (!_validate()) return;
  setState(() => _loading = true);

  final original = widget.item;  // capture before any change
  final patch = <String, dynamic>{ /* fields from form controllers */ };

  // 1. Optimistic update — dismisses modal immediately
  ref.read(xyzProvider.notifier).updateOptimistic(original.id, patch);
  final messenger = ScaffoldMessenger.of(context);
  if (mounted) Navigator.pop(context);

  // 2. API fires in background — no await
  ref.read(xyzProvider.notifier)
      .updateXyz(id: original.id, /* named args */)
      .catchError((Object e) {
    // 3. Rollback on failure
    ref.read(xyzProvider.notifier).updateOptimistic(original.id, original.toJson());
    messenger.showSnackBar(const SnackBar(
      content: Text('Update failed. Please try again.'),
      duration: Duration(seconds: 5),
    ));
  });
}
```

### Standard delete pattern
```dart
// In screen — after user confirms dialog:
final original = item;
ref.read(xyzProvider.notifier).removeOptimistic(original.id);
final messenger = ScaffoldMessenger.of(context);

ref.read(xyzProvider.notifier).delete(original.id).catchError((Object e) {
  // Restore on failure
  ref.read(xyzProvider.notifier)... // call notifier refresh or re-insert
  messenger.showSnackBar(const SnackBar(content: Text('Delete failed.')));
});
```

### Account-specific optimistic update
`AccountsNotifier.updateAccountData()` already applies optimistic internally — just call it directly:
```dart
ref.read(accountsProvider.notifier)
    .updateAccountData(account.id, {'balance': newValue, 'note': note})
    .catchError((Object e) {
  messenger.showSnackBar(...);
});
// No need to call updateAccountOptimistic manually first
```

## Model JSON Field Names
Critical — these are the exact keys used in `toJson()` / `fromJson()`:

| Model | Key fields |
|-------|-----------|
| `Account` | `id`, `name`, `balance`, `type`, `nickname`, `isPinned`, `userId`, `coupleId` |
| `BalanceHistoryEntry` | `id`, `balance`, `change`, `note`, `createdAt` ← **not** `date` |
| `Transaction` | `id`, `accountId`, `amount`, `type`, `category`, `description`, `date`, `userId`, `coupleId` |
| `Budget` | `id`, `category`, `limit`, `month`, `spent`, `userId`, `coupleId` |
| `Loan` | `id`, `name`, `loanProvider`, `loanAccountNumber`, `principal`, `interestRate`, `tenureMonths`, `emiAmount`, `startDate`, `remainingBalance` |
| `Goal` | `id`, `name`, `targetAmount`, `currentAmount`, `deadline`, `userId`, `coupleId` |

DateTime fields serialize as ISO 8601 strings (`toIso8601String()` / `DateTime.parse()`).

## Balance Masking — `balanceMaskedProvider`

The eye toggle lives in `FinanceShell` AppBar. Every widget that renders a monetary amount must watch `balanceMaskedProvider` and mask when `true`.

**Complete list of widgets that must mask:**

| Widget | How to mask |
|--------|------------|
| `FinanceDashboardScreen` summary cards (`_AnimatedSummaryCard`, `_AnimatedPercentCard`) | `masked` param |
| `NetWorthCard` + `_BreakdownLine` | `masked` param passed down |
| `LoansSummaryWidget` — outstanding + EMI | `masked ? '₹ ••••' : format(val)` |
| `AccountCard` — balance via `CurrencyDisplay` | `CurrencyDisplay(masked: ref.watch(balanceMaskedProvider))` |
| `AccountDetailScreen` — balance | watch + pass to `CurrencyDisplay` |
| Home screen quick-stats total balance | `masked ? '₹ ••••' : format(val)` |
| `CurrencyDisplay` widget | `masked` param (default `false`) → renders `₹ ••••` |

**`CurrencyDisplay` signature:**
```dart
CurrencyDisplay({
  required double amount,
  bool colorCoded = true,
  bool showSign = false,
  TextStyle? style,
  bool masked = false,   // ← renders '₹ ••••' when true
})
```

## Eager Data Fetching
Dashboard eagerly initialises all tab providers so data is ready before user navigates:
```dart
// In FinanceDashboardScreen.build():
ref.read(loansProvider);
ref.read(goalsProvider);
ref.read(budgetsProvider);
ref.read(depositsProvider);
ref.read(healthScoreProvider);
ref.read(dashboardInsightsProvider);
```

## Finance Shell
`FinanceShell` is a `ConsumerWidget` (not `StatelessWidget`). AppBar has:
1. Eye toggle (`balanceMaskedProvider`) — `Icons.visibility_outlined` / `Icons.visibility_off_outlined`
2. `PopupMenuButton` — scan receipt, scan schedule, couple

Tab order: Dashboard → Accounts → Loans → Deposits → Planner → Transactions → Budgets → Goals  
Routes: `/finance`, `/finance/accounts`, `/finance/loans`, `/finance/deposits`, `/finance/budget-planner`, `/finance/transactions`, `/finance/budgets`, `/finance/goals`

## Push Notifications (Finance-Adjacent)

### Permission guard — ALWAYS check before registering
```dart
final granted = await pushService.hasPermission();
if (granted) await pushService.registerToken();
```
This applies in: `auth_provider.dart`, `connectivity_wrapper.dart`, `api_client.dart` (token refresh), `settings_screen.dart` test send.

### Opening device notification settings
```dart
import 'package:url_launcher/url_launcher.dart';  // already in pubspec

Future<void> _openSettings() async {
  try {
    final opened = await launchUrl(
      Uri.parse('app-settings:'),
      mode: LaunchMode.externalApplication,
    );
    if (opened) return;
    // Android fallback
    await launchUrl(
      Uri.parse('package:com.pranesh.luvverse'),
      mode: LaunchMode.externalApplication,
    );
  } catch (_) {}
}
```
Do **not** use `app_settings` package — not in pubspec. Use `url_launcher`.
