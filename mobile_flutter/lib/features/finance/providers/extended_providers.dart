import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/cache/cache_providers.dart';
import 'package:luvverse/core/cache/cached_repositories_ext.dart';
import 'package:luvverse/core/network/api_client.dart';
import 'package:luvverse/features/finance/repositories/deposits_repository.dart';
import 'package:luvverse/features/finance/repositories/investments_repository.dart';
import 'package:luvverse/features/finance/repositories/budget_plans_repository.dart';
import 'package:luvverse/features/finance/repositories/notifications_repository.dart';
import 'package:luvverse/features/finance/repositories/insights_repository.dart';
import 'package:luvverse/features/finance/providers/finance_providers.dart';
import 'package:luvverse/models/deposit.dart';
import 'package:luvverse/models/investment.dart';
import 'package:luvverse/models/budget_plan.dart';
import 'package:luvverse/models/notification_model.dart';
import 'package:luvverse/models/insight.dart';

// -- Repository Providers (original, for mutations) --

final depositsRepositoryProvider = Provider<DepositsRepository>((ref) {
  return DepositsRepository(ref.read(apiClientProvider));
});

final investmentsRepositoryProvider = Provider<InvestmentsRepository>((ref) {
  return InvestmentsRepository(ref.read(apiClientProvider));
});

final budgetPlansRepositoryProvider = Provider<BudgetPlansRepository>((ref) {
  return BudgetPlansRepository(ref.read(apiClientProvider));
});

final notificationsRepositoryProvider =
    Provider<NotificationsRepository>((ref) {
  return NotificationsRepository(ref.read(apiClientProvider));
});

final insightsRepositoryProvider = Provider<InsightsRepository>((ref) {
  return InsightsRepository(ref.read(apiClientProvider));
});

// -- Cached Repository Providers --

final cachedDepositsProvider = Provider<CachedDepositsRepository>((ref) {
  return CachedDepositsRepository(
    ref.read(apiClientProvider),
    ref.read(cacheServiceProvider),
  );
});

final cachedInvestmentsProvider = Provider<CachedInvestmentsRepository>((ref) {
  return CachedInvestmentsRepository(
    ref.read(apiClientProvider),
    ref.read(cacheServiceProvider),
  );
});

final cachedNotificationsProvider =
    Provider<CachedNotificationsRepository>((ref) {
  return CachedNotificationsRepository(
    ref.read(apiClientProvider),
    ref.read(cacheServiceProvider),
  );
});

final cachedInsightsProvider = Provider<CachedInsightsRepository>((ref) {
  return CachedInsightsRepository(
    ref.read(apiClientProvider),
    ref.read(cacheServiceProvider),
  );
});

final cachedBudgetPlansProvider = Provider<CachedBudgetPlansRepository>((ref) {
  return CachedBudgetPlansRepository(
    ref.read(apiClientProvider),
    ref.read(cacheServiceProvider),
  );
});

// -- Deposits --

final depositsProvider =
    AsyncNotifierProvider<DepositsNotifier, List<Deposit>>(
  DepositsNotifier.new,
);

class DepositsNotifier extends AsyncNotifier<List<Deposit>> {
  @override
  Future<List<Deposit>> build() async {
    return ref.read(cachedDepositsProvider).getDeposits();
  }

  Future<void> refresh() async {
    state = const AsyncLoading<List<Deposit>>().copyWithPrevious(state);
    state = await AsyncValue.guard(
      () => ref.read(cachedDepositsProvider).getDeposits(),
    );
  }

  Future<void> create({
    required String name,
    required String type,
    required double principalAmount,
    required double interestRate,
    required int tenureMonths,
    required DateTime startDate,
    required DateTime maturityDate,
    required double maturityAmount,
    String? provider,
    double? installmentAmount,
    String installmentFrequency = 'MONTHLY',
    int? totalInstallments,
    String? sourceAccountId,
  }) async {
    await ref.read(depositsRepositoryProvider).createDeposit(
          name: name,
          type: type,
          principalAmount: principalAmount,
          interestRate: interestRate,
          tenureMonths: tenureMonths,
          startDate: startDate,
          maturityDate: maturityDate,
          maturityAmount: maturityAmount,
          provider: provider,
          installmentAmount: installmentAmount,
          installmentFrequency: installmentFrequency,
          totalInstallments: totalInstallments,
          sourceAccountId: sourceAccountId,
        );
    await refresh();
  }

  Future<void> updateDeposit({
    required String id,
    String? name,
    String? provider,
    double? principalAmount,
    double? interestRate,
    int? tenureMonths,
    double? installmentAmount,
    String? installmentFrequency,
    int? paidInstallments,
    int? totalInstallments,
    double? maturityAmount,
    String? status,
    String? sourceAccountId,
  }) async {
    await ref.read(depositsRepositoryProvider).updateDeposit(
          id: id,
          name: name,
          provider: provider,
          principalAmount: principalAmount,
          interestRate: interestRate,
          tenureMonths: tenureMonths,
          installmentAmount: installmentAmount,
          installmentFrequency: installmentFrequency,
          paidInstallments: paidInstallments,
          totalInstallments: totalInstallments,
          maturityAmount: maturityAmount,
          status: status,
          sourceAccountId: sourceAccountId,
        );
    await refresh();
  }

  Future<void> delete(String id) async {
    await ref.read(depositsRepositoryProvider).deleteDeposit(id);
    await refresh();
  }
}

// -- Investments --

final investmentsProvider =
    AsyncNotifierProvider<InvestmentsNotifier, List<Investment>>(
  InvestmentsNotifier.new,
);

class InvestmentsNotifier extends AsyncNotifier<List<Investment>> {
  @override
  Future<List<Investment>> build() async {
    return ref.read(cachedInvestmentsProvider).getInvestments();
  }

  Future<void> refresh() async {
    state = const AsyncLoading<List<Investment>>().copyWithPrevious(state);
    state = await AsyncValue.guard(
      () => ref.read(cachedInvestmentsProvider).getInvestments(),
    );
  }

  Future<void> create({
    required String name,
    required String assetType,
    required String mode,
    required double investedAmount,
    required DateTime startDate,
    String? ticker,
    String? exchange,
    double? quantity,
    double? quantityGrams,
    double? currentPrice,
    double? currentValue,
    double? sipAmount,
    int? sipDayOfMonth,
  }) async {
    await ref.read(investmentsRepositoryProvider).createInvestment(
          name: name,
          assetType: assetType,
          mode: mode,
          investedAmount: investedAmount,
          startDate: startDate,
          ticker: ticker,
          exchange: exchange,
          quantity: quantity,
          quantityGrams: quantityGrams,
          currentPrice: currentPrice,
          currentValue: currentValue,
          sipAmount: sipAmount,
          sipDayOfMonth: sipDayOfMonth,
        );
    await refresh();
  }

  Future<void> updateInvestment({
    required String id,
    String? name,
    String? assetType,
    String? mode,
    double? investedAmount,
    String? ticker,
    String? exchange,
    double? quantity,
    double? quantityGrams,
    double? currentPrice,
    double? currentValue,
    double? sipAmount,
    int? sipDayOfMonth,
  }) async {
    await ref.read(investmentsRepositoryProvider).updateInvestment(
          id: id,
          name: name,
          assetType: assetType,
          mode: mode,
          investedAmount: investedAmount,
          ticker: ticker,
          exchange: exchange,
          quantity: quantity,
          quantityGrams: quantityGrams,
          currentPrice: currentPrice,
          currentValue: currentValue,
          sipAmount: sipAmount,
          sipDayOfMonth: sipDayOfMonth,
        );
    await refresh();
  }

  Future<void> delete(String id) async {
    await ref.read(investmentsRepositoryProvider).deleteInvestment(id);
    await refresh();
  }
}

// -- Budget Plans --

final budgetPlanMonthProvider = StateProvider<String>((ref) {
  final now = DateTime.now();
  return '${now.year}-${now.month.toString().padLeft(2, '0')}';
});

final budgetPlanModeProvider = StateProvider<String>((ref) => 'monthly');

final budgetPlanProvider =
    AsyncNotifierProvider<BudgetPlanNotifier, BudgetPlan?>(
  BudgetPlanNotifier.new,
);

class BudgetPlanNotifier extends AsyncNotifier<BudgetPlan?> {
  @override
  Future<BudgetPlan?> build() async {
    final monthAndYear = ref.watch(budgetPlanMonthProvider);
    final mode = ref.watch(budgetPlanModeProvider);
    return ref.read(cachedBudgetPlansProvider).getBudgetPlan(
          monthAndYear: monthAndYear,
          mode: mode,
        );
  }

  Future<void> refresh() async {
    state = const AsyncLoading<BudgetPlan?>().copyWithPrevious(state);
    final monthAndYear = ref.read(budgetPlanMonthProvider);
    final mode = ref.read(budgetPlanModeProvider);
    state = await AsyncValue.guard(
      () => ref.read(cachedBudgetPlansProvider).getBudgetPlan(
            monthAndYear: monthAndYear,
            mode: mode,
          ),
    );
  }

  Future<void> save({
    required double income,
    required List<BudgetPlanLineItem> lineItems,
  }) async {
    final monthAndYear = ref.read(budgetPlanMonthProvider);
    final mode = ref.read(budgetPlanModeProvider);
    await ref.read(cachedBudgetPlansProvider).saveBudgetPlan(
          monthAndYear: monthAndYear,
          mode: mode,
          income: income,
          lineItems: lineItems,
        );
    await refresh();
  }

  Future<void> delete(String id) async {
    await ref.read(cachedBudgetPlansProvider).deleteBudgetPlan(id);
    await refresh();
  }
}

// -- Notifications --

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, NotificationsResponse>(
  NotificationsNotifier.new,
);

class NotificationsNotifier extends AsyncNotifier<NotificationsResponse> {
  @override
  Future<NotificationsResponse> build() async {
    return ref.read(cachedNotificationsProvider).getNotifications();
  }

  Future<void> refresh() async {
    state = const AsyncLoading<NotificationsResponse>().copyWithPrevious(state);
    state = await AsyncValue.guard(
      () => ref.read(cachedNotificationsProvider).getNotifications(),
    );
  }

  Future<void> markAsRead(String id) async {
    await ref.read(notificationsRepositoryProvider).markAsRead(id);
    await refresh();
  }

  Future<void> markAllAsRead() async {
    await ref.read(notificationsRepositoryProvider).markAllAsRead();
    await refresh();
  }
}

final unreadNotificationCountProvider = Provider<AsyncValue<int>>((ref) {
  return ref.watch(notificationsProvider).whenData(
        (response) => response.unreadCount,
      );
});

// -- Insights / Dashboard --

final dashboardInsightsProvider =
    AsyncNotifierProvider<DashboardInsightsNotifier, DashboardInsights>(
  DashboardInsightsNotifier.new,
);

class DashboardInsightsNotifier extends AsyncNotifier<DashboardInsights> {
  @override
  Future<DashboardInsights> build() async {
    final month = ref.watch(selectedMonthProvider);
    return ref.read(cachedInsightsProvider).getDashboardInsights(month: month);
  }

  Future<void> refresh() async {
    state = const AsyncLoading<DashboardInsights>().copyWithPrevious(state);
    final month = ref.read(selectedMonthProvider);
    state = await AsyncValue.guard(
      () => ref.read(cachedInsightsProvider).getDashboardInsights(month: month),
    );
  }
}

final healthScoreProvider = FutureProvider<HealthScore>((ref) async {
  return ref.read(cachedInsightsProvider).getHealthScore();
});

// -- Derived Dashboard Providers --

/// Data container for net worth breakdown.
class NetWorthData {
  final double accountsTotal;
  final double investmentsTotal;
  final double depositsTotal;
  final double totalAssets;
  final double liabilities;
  final double netWorth;

  const NetWorthData({
    required this.accountsTotal,
    required this.investmentsTotal,
    required this.depositsTotal,
    required this.totalAssets,
    required this.liabilities,
    required this.netWorth,
  });
}

/// Computes net worth: Assets (accounts) - Liabilities (loans).
/// Deposits and investments excluded until their APIs are deployed.
final netWorthProvider = Provider<AsyncValue<NetWorthData>>((ref) {
  final accounts = ref.watch(accountsProvider);
  final loans = ref.watch(loansProvider);

  if (accounts.isLoading || loans.isLoading) {
    return const AsyncValue.loading();
  }

  if (accounts.hasError) return AsyncValue.error(accounts.error!, accounts.stackTrace!);

  final accountsTotal = accounts.valueOrNull?.fold(0.0, (sum, a) => sum + a.balance) ?? 0.0;
  final loansTotal = loans.valueOrNull?.fold(0.0, (sum, l) => sum + l.remainingBalance) ?? 0.0;

  final totalAssets = accountsTotal;
  final netWorth = totalAssets - loansTotal;

  return AsyncValue.data(NetWorthData(
    accountsTotal: accountsTotal,
    investmentsTotal: 0.0,
    depositsTotal: 0.0,
    totalAssets: totalAssets,
    liabilities: loansTotal,
    netWorth: netWorth,
  ));
});

/// Savings rate: (income - expense) / income * 100.
final savingsRateProvider = Provider<AsyncValue<double>>((ref) {
  final income = ref.watch(monthlyIncomeProvider);
  final expense = ref.watch(monthlyExpenseProvider);

  return income.whenData((inc) {
    final exp = expense.valueOrNull ?? 0.0;
    if (inc <= 0) return 0.0;
    return ((inc - exp) / inc) * 100;
  });
});
