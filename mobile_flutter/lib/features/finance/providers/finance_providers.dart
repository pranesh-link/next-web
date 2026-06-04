import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/cache/cache_providers.dart';
import 'package:luvverse/core/cache/cached_repositories.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/features/finance/repositories/accounts_repository.dart';
import 'package:luvverse/features/finance/repositories/transactions_repository.dart';
import 'package:luvverse/features/finance/repositories/budgets_repository.dart';
import 'package:luvverse/features/finance/repositories/loans_repository.dart';
import 'package:luvverse/features/finance/repositories/goals_repository.dart';
import 'package:luvverse/models/account.dart';
import 'package:luvverse/models/transaction.dart';
import 'package:luvverse/models/budget.dart';
import 'package:luvverse/models/loan.dart';
import 'package:luvverse/models/goal.dart';

// -- Repositories (original, for mutations that haven't been migrated) --

/// The authenticated user's internal DB user ID (resolved from API responses).
final dbUserIdProvider = StateProvider<String?>((ref) => null);

final accountsRepositoryProvider = Provider<AccountsRepository>((ref) {
  return AccountsRepository(ref.read(apiClientProvider));
});

final transactionsRepositoryProvider = Provider<TransactionsRepository>((ref) {
  return TransactionsRepository(ref.read(apiClientProvider));
});

final budgetsRepositoryProvider = Provider<BudgetsRepository>((ref) {
  return BudgetsRepository(ref.read(apiClientProvider));
});

final loansRepositoryProvider = Provider<LoansRepository>((ref) {
  return LoansRepository(ref.read(apiClientProvider));
});

final goalsRepositoryProvider = Provider<GoalsRepository>((ref) {
  return GoalsRepository(ref.read(apiClientProvider));
});

// -- Cached repositories (for reads with offline fallback) --

final cachedAccountsProvider = Provider<CachedAccountsRepository>((ref) {
  return CachedAccountsRepository(
    ref.read(apiClientProvider),
    ref.read(cacheServiceProvider),
  );
});

final cachedTransactionsProvider = Provider<CachedTransactionsRepository>((ref) {
  return CachedTransactionsRepository(
    ref.read(apiClientProvider),
    ref.read(cacheServiceProvider),
  );
});

final cachedBudgetsProvider = Provider<CachedBudgetsRepository>((ref) {
  return CachedBudgetsRepository(
    ref.read(apiClientProvider),
    ref.read(cacheServiceProvider),
  );
});

final cachedLoansProvider = Provider<CachedLoansRepository>((ref) {
  return CachedLoansRepository(
    ref.read(apiClientProvider),
    ref.read(cacheServiceProvider),
  );
});

final cachedGoalsProvider = Provider<CachedGoalsRepository>((ref) {
  return CachedGoalsRepository(
    ref.read(apiClientProvider),
    ref.read(cacheServiceProvider),
  );
});

// -- Accounts --

final accountsProvider =
    AsyncNotifierProvider<AccountsNotifier, List<Account>>(
  AccountsNotifier.new,
);

class AccountsNotifier extends AsyncNotifier<List<Account>> {
  @override
  Future<List<Account>> build() async {
    return _fetchAccounts();
  }

  Future<List<Account>> _fetchAccounts() async {
    final result = await ref.read(cachedAccountsProvider).getAccountsRaw();
    final currentUserId = result['currentUserId'] as String?;
    if (currentUserId != null) {
      ref.read(dbUserIdProvider.notifier).state = currentUserId;
    }
    final list = (result['data'] as List)
        .map((e) => Account.fromJson(e as Map<String, dynamic>))
        .toList();
    return list;
  }

  Future<void> refresh() async {
    state = const AsyncLoading<List<Account>>().copyWithPrevious(state);
    state = await AsyncValue.guard(() => _fetchAccounts());
  }

  Future<void> create({
    required String name,
    required String type,
    required double balance,
    String? nickname,
  }) async {
    await ref.read(accountsRepositoryProvider).createAccount(
          name: name,
          type: type,
          balance: balance,
          nickname: nickname,
        );
    await refresh();
  }

  Future<void> updateAccountData(String id, Map<String, dynamic> data) async {
    // Capture original state for rollback
    final original = state.valueOrNull?.firstWhere(
      (a) => a.id == id,
      orElse: () => throw StateError('Account not found'),
    );
    if (original == null) return;

    // Optimistic update: reflect change immediately in UI
    updateAccountOptimistic(id, data);

    try {
      await ref.read(accountsRepositoryProvider).updateAccountData(id, data);
    } catch (_) {
      // Rollback on failure
      revertAccountOptimistic(id, original.toJson());
      rethrow;
    }
  }

  /// Update account optimistically (UI-only, no API call).
  void updateAccountOptimistic(String id, Map<String, dynamic> data) {
    state.whenData((accounts) {
      final updated = accounts.map((acc) {
        if (acc.id != id) return acc;
        final json = acc.toJson();
        json.addAll(data);
        return Account.fromJson(json);
      }).toList();
      state = AsyncData(updated);
    });
  }

  /// Revert account to original state (rollback after failed update).
  void revertAccountOptimistic(String id, Map<String, dynamic> originalData) {
    updateAccountOptimistic(id, originalData);
  }

  Future<void> togglePin(String id, bool currentPinned) async {
    await ref.read(accountsRepositoryProvider).updateAccountData(
      id,
      {'isPinned': !currentPinned},
    );
    await refresh();
  }

  Future<void> delete(String id) async {
    await ref.read(accountsRepositoryProvider).deleteAccount(id);
    await refresh();
  }
}

/// Fetches balance history for a specific account (last 20 entries).
final accountBalanceHistoryProvider = FutureProvider.family<List<BalanceHistoryEntry>, String>(
  (ref, accountId) async {
    final result = await ref.read(accountsRepositoryProvider).getAccountDetail(accountId);
    final data = result['data'] as Map<String, dynamic>? ?? {};
    final historyJson = data['balanceHistory'] as List<dynamic>? ?? [];
    return historyJson
        .map((e) => BalanceHistoryEntry.fromJson(e as Map<String, dynamic>))
        .toList();
  },
);

// -- Transactions --

final selectedMonthProvider = StateProvider<String>((ref) {
  final now = DateTime.now();
  return '${now.year}-${now.month.toString().padLeft(2, '0')}';
});

final transactionsProvider =
    AsyncNotifierProvider<TransactionsNotifier, List<Transaction>>(
  TransactionsNotifier.new,
);

class TransactionsNotifier extends AsyncNotifier<List<Transaction>> {
  @override
  Future<List<Transaction>> build() async {
    final month = ref.watch(selectedMonthProvider);
    return ref.read(cachedTransactionsProvider).getTransactions(month: month);
  }

  Future<void> refresh() async {
    state = const AsyncLoading<List<Transaction>>().copyWithPrevious(state);
    final month = ref.read(selectedMonthProvider);
    state = await AsyncValue.guard(
      () => ref.read(cachedTransactionsProvider).getTransactions(month: month),
    );
  }

  Future<void> create({
    required String accountId,
    required double amount,
    required String type,
    required String category,
    required DateTime date,
    String? description,
  }) async {
    await ref.read(transactionsRepositoryProvider).createTransaction(
          accountId: accountId,
          amount: amount,
          type: type,
          category: category,
          date: date,
          description: description,
        );
    await refresh();
  }

  Future<void> updateTransaction({
    required String id,
    String? accountId,
    double? amount,
    String? type,
    String? category,
    DateTime? date,
    String? description,
  }) async {
    await ref.read(transactionsRepositoryProvider).updateTransaction(
          id: id,
          accountId: accountId,
          amount: amount,
          type: type,
          category: category,
          date: date,
          description: description,
        );
    await refresh();
  }

  Future<void> delete(String id) async {
    await ref.read(transactionsRepositoryProvider).deleteTransaction(id);
    await refresh();
  }
}

// -- Budgets --

final budgetsProvider =
    AsyncNotifierProvider<BudgetsNotifier, List<Budget>>(
  BudgetsNotifier.new,
);

class BudgetsNotifier extends AsyncNotifier<List<Budget>> {
  @override
  Future<List<Budget>> build() async {
    final month = ref.watch(selectedMonthProvider);
    return ref.read(cachedBudgetsProvider).getBudgets(month: month);
  }

  Future<void> refresh() async {
    state = const AsyncLoading<List<Budget>>().copyWithPrevious(state);
    final month = ref.read(selectedMonthProvider);
    state = await AsyncValue.guard(
      () => ref.read(cachedBudgetsProvider).getBudgets(month: month),
    );
  }

  Future<void> create({
    required String category,
    required double limit,
    required String month,
  }) async {
    await ref.read(budgetsRepositoryProvider).createBudget(
          category: category,
          limit: limit,
          month: month,
        );
    await refresh();
  }

  Future<void> updateBudget({
    required String id,
    String? category,
    double? limit,
    String? month,
  }) async {
    await ref.read(budgetsRepositoryProvider).updateBudget(
          id: id,
          category: category,
          limit: limit,
          month: month,
        );
    await refresh();
  }

  Future<void> delete(String id) async {
    await ref.read(budgetsRepositoryProvider).deleteBudget(id);
    await refresh();
  }
}

// -- Loans --

final loansProvider =
    AsyncNotifierProvider<LoansNotifier, List<Loan>>(
  LoansNotifier.new,
);

class LoansNotifier extends AsyncNotifier<List<Loan>> {
  @override
  Future<List<Loan>> build() async {
    return ref.read(cachedLoansProvider).getLoans();
  }

  Future<void> refresh() async {
    state = const AsyncLoading<List<Loan>>().copyWithPrevious(state);
    state = await AsyncValue.guard(
      () => ref.read(cachedLoansProvider).getLoans(),
    );
  }

  Future<void> updateLoan({
    required String id,
    String? name,
    double? principal,
    double? interestRate,
    int? tenureMonths,
    double? emiAmount,
    DateTime? startDate,
    String? loanProvider,
    String? loanAccountNumber,
  }) async {
    await ref.read(loansRepositoryProvider).updateLoan(
          id: id,
          name: name,
          principal: principal,
          interestRate: interestRate,
          tenureMonths: tenureMonths,
          emiAmount: emiAmount,
          startDate: startDate,
          loanProvider: loanProvider,
          loanAccountNumber: loanAccountNumber,
        );
    await refresh();
  }

  Future<void> delete(String id) async {
    await ref.read(loansRepositoryProvider).deleteLoan(id);
    await refresh();
  }
}

// -- Goals --

final goalsProvider =
    AsyncNotifierProvider<GoalsNotifier, List<Goal>>(
  GoalsNotifier.new,
);

class GoalsNotifier extends AsyncNotifier<List<Goal>> {
  @override
  Future<List<Goal>> build() async {
    return ref.read(cachedGoalsProvider).getGoals();
  }

  Future<void> refresh() async {
    state = const AsyncLoading<List<Goal>>().copyWithPrevious(state);
    state = await AsyncValue.guard(
      () => ref.read(cachedGoalsProvider).getGoals(),
    );
  }

  Future<void> create({
    required String name,
    required double targetAmount,
    double currentAmount = 0,
    DateTime? deadline,
  }) async {
    await ref.read(goalsRepositoryProvider).createGoal(
          name: name,
          targetAmount: targetAmount,
          currentAmount: currentAmount,
          deadline: deadline,
        );
    await refresh();
  }

  Future<void> updateGoal({
    required String id,
    String? name,
    double? targetAmount,
    double? currentAmount,
    DateTime? deadline,
  }) async {
    await ref.read(goalsRepositoryProvider).updateGoal(
          id: id,
          name: name,
          targetAmount: targetAmount,
          currentAmount: currentAmount,
          deadline: deadline,
        );
    await refresh();
  }

  Future<void> contribute({required String id, required double amount}) async {
    await ref.read(goalsRepositoryProvider).contributeToGoal(
          id: id,
          amount: amount,
        );
    await refresh();
  }

  Future<void> delete(String id) async {
    await ref.read(goalsRepositoryProvider).deleteGoal(id);
    await refresh();
  }
}

// -- Dashboard Computed Providers --

final totalBalanceProvider = Provider<AsyncValue<double>>((ref) {
  return ref.watch(accountsProvider).whenData(
        (accounts) => accounts.fold(0.0, (sum, a) => sum + a.balance),
      );
});

final monthlyIncomeProvider = Provider<AsyncValue<double>>((ref) {
  return ref.watch(transactionsProvider).whenData(
        (txns) => txns
            .where((t) => t.type == 'INCOME')
            .fold(0.0, (sum, t) => sum + t.amount),
      );
});

final monthlyExpenseProvider = Provider<AsyncValue<double>>((ref) {
  return ref.watch(transactionsProvider).whenData(
        (txns) => txns
            .where((t) => t.type == 'EXPENSE')
            .fold(0.0, (sum, t) => sum + t.amount),
      );
});
