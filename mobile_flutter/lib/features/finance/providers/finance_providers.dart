import 'package:flutter_riverpod/flutter_riverpod.dart';
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

// -- Repositories --

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

// -- Accounts --

final accountsProvider =
    AsyncNotifierProvider<AccountsNotifier, List<Account>>(
  AccountsNotifier.new,
);

class AccountsNotifier extends AsyncNotifier<List<Account>> {
  @override
  Future<List<Account>> build() async {
    return ref.read(accountsRepositoryProvider).getAccounts();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(accountsRepositoryProvider).getAccounts(),
    );
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

  Future<void> delete(String id) async {
    await ref.read(accountsRepositoryProvider).deleteAccount(id);
    await refresh();
  }
}

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
    return ref.read(transactionsRepositoryProvider).getTransactions(
          month: month,
        );
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    final month = ref.read(selectedMonthProvider);
    state = await AsyncValue.guard(
      () => ref.read(transactionsRepositoryProvider).getTransactions(
            month: month,
          ),
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
    return ref.read(budgetsRepositoryProvider).getBudgets(month: month);
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    final month = ref.read(selectedMonthProvider);
    state = await AsyncValue.guard(
      () => ref.read(budgetsRepositoryProvider).getBudgets(month: month),
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
    return ref.read(loansRepositoryProvider).getLoans();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(loansRepositoryProvider).getLoans(),
    );
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
    return ref.read(goalsRepositoryProvider).getGoals();
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => ref.read(goalsRepositoryProvider).getGoals(),
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
