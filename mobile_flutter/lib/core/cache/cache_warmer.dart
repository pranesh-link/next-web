import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:luvverse/core/cache/cache_providers.dart';
import 'package:luvverse/core/cache/cached_repositories.dart';
import 'package:luvverse/core/cache/cached_repositories_ext.dart';
import 'package:luvverse/core/network/api_client.dart';

/// Eagerly fetches all finance data to populate the offline cache.
///
/// Called after login and session restore so that going offline immediately
/// still returns data from cache instead of "no cached data available".
class CacheWarmer {
  CacheWarmer._();

  /// Warms all finance entity caches in parallel. Failures are silenced.
  static Future<void> warmAll(Ref ref) async {
    try {
      final api = ref.read(apiClientProvider);
      final cache = ref.read(cacheServiceProvider);

      final accounts = CachedAccountsRepository(api, cache);
      final transactions = CachedTransactionsRepository(api, cache);
      final budgets = CachedBudgetsRepository(api, cache);
      final loans = CachedLoansRepository(api, cache);
      final goals = CachedGoalsRepository(api, cache);
      final deposits = CachedDepositsRepository(api, cache);
      final investments = CachedInvestmentsRepository(api, cache);

      await Future.wait<void>([
        accounts.getAccountsRaw(),
        transactions.getTransactions(),
        budgets.getBudgets(),
        loans.getLoans(),
        goals.getGoals(),
        deposits.getDeposits(),
        investments.getInvestments(),
      ].map((f) => f.then((_) {}).catchError((_) {})));
    } catch (e) {
      if (kDebugMode) debugPrint('CacheWarmer: $e');
    }
  }
}
