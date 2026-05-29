import { cacheDel } from './redis';

/**
 * Invalidate user-specific cached API responses.
 *
 * @param userId - The user ID to invalidate cache for.
 * @param patterns - Array of cache key patterns (e.g., ['/api/v1/finance/accounts*']).
 * @return Promise that resolves when cache invalidation completes.
 */
async function invalidateUserCache(
  userId: string,
  patterns: string[]
): Promise<void> {
  if (process.env.ENABLE_API_CACHE !== 'true') {
    return;
  }

  const keys = patterns.map((pattern) => `api:${userId}:${pattern}`);
  await cacheDel(...keys);
}

/**
 * Cache invalidation helpers for data mutations.
 */
export const CacheInvalidation = {
  /**
   * Invalidate cache after account changes.
   *
   * @param userId - The user ID whose account cache should be invalidated.
   * @return Promise that resolves when cache invalidation completes.
   */
  async onAccountChange(userId: string): Promise<void> {
    await invalidateUserCache(userId, [
      '/api/v1/finance/accounts*',
      '/api/v1/finance/sync-status',
    ]);
  },

  /**
   * Invalidate cache after transaction changes.
   *
   * @param userId - The user ID whose transaction cache should be invalidated.
   * @param accountId - Optional account ID to invalidate specific account cache.
   * @return Promise that resolves when cache invalidation completes.
   */
  async onTransactionChange(
    userId: string,
    accountId?: string
  ): Promise<void> {
    const patterns = [
      '/api/v1/finance/transactions*',
      '/api/v1/finance/accounts*',
      '/api/v1/finance/insights*',
    ];

    if (accountId) {
      patterns.push(`/api/v1/finance/accounts/${accountId}*`);
    }

    await invalidateUserCache(userId, patterns);
  },

  /**
   * Invalidate cache after budget changes.
   *
   * @param userId - The user ID whose budget cache should be invalidated.
   * @return Promise that resolves when cache invalidation completes.
   */
  async onBudgetChange(userId: string): Promise<void> {
    await invalidateUserCache(userId, [
      '/api/v1/finance/budgets*',
      '/api/v1/finance/budget-plans*',
    ]);
  },

  /**
   * Invalidate cache after loan changes.
   *
   * @param userId - The user ID whose loan cache should be invalidated.
   * @return Promise that resolves when cache invalidation completes.
   */
  async onLoanChange(userId: string): Promise<void> {
    await invalidateUserCache(userId, [
      '/api/v1/finance/loans*',
      '/api/v1/finance/insights*',
    ]);
  },

  /**
   * Invalidate cache after goal changes.
   *
   * @param userId - The user ID whose goal cache should be invalidated.
   * @return Promise that resolves when cache invalidation completes.
   */
  async onGoalChange(userId: string): Promise<void> {
    await invalidateUserCache(userId, ['/api/v1/finance/goals*']);
  },

  /**
   * Invalidate cache after notification changes.
   *
   * @param userId - The user ID whose notification cache should be invalidated.
   * @return Promise that resolves when cache invalidation completes.
   */
  async onNotificationChange(userId: string): Promise<void> {
    await invalidateUserCache(userId, ['/api/v1/finance/notifications*']);
  },

  /**
   * Invalidate cache after couple changes.
   *
   * @param userId - The user ID whose couple cache should be invalidated.
   * @return Promise that resolves when cache invalidation completes.
   */
  async onCoupleChange(userId: string): Promise<void> {
    await invalidateUserCache(userId, [
      '/api/v1/couple*',
      '/api/v1/couple/members',
    ]);
  },
};
