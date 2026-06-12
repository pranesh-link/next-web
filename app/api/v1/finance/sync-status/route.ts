import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { financialAccounts, transactions, budgets, loans, savingsGoals, budgetPlans } from "@db/schema";
import { inArray, desc } from "drizzle-orm";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { withCache } from "@/_lib/middleware/cache";
import { withRateLimit } from "@/_lib/middleware/rate-limit";

/**
 * GET /api/v1/finance/sync-status
 *
 * Returns last modification timestamps per entity for cache invalidation.
 * Couple-aware: checks both user's and partner's modifications.
 *
 * @remarks GET · auth: JWT via getAuthUserId
 */
async function getHandler() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const coupleUserIds = await getUserIdsForCouple(userId);

  // Get the latest updatedAt for each entity type
  const [latestAccount, latestTx, latestBudget, latestLoan, latestGoal, latestBudgetPlan] =
    await Promise.all([
      db
        .select({ updatedAt: financialAccounts.updatedAt })
        .from(financialAccounts)
        .where(inArray(financialAccounts.userId, coupleUserIds))
        .orderBy(desc(financialAccounts.updatedAt))
        .limit(1),
      db
        .select({ updatedAt: transactions.updatedAt })
        .from(transactions)
        .where(inArray(transactions.userId, coupleUserIds))
        .orderBy(desc(transactions.updatedAt))
        .limit(1),
      db
        .select({ updatedAt: budgets.updatedAt })
        .from(budgets)
        .where(inArray(budgets.userId, coupleUserIds))
        .orderBy(desc(budgets.updatedAt))
        .limit(1),
      db
        .select({ updatedAt: loans.updatedAt })
        .from(loans)
        .where(inArray(loans.userId, coupleUserIds))
        .orderBy(desc(loans.updatedAt))
        .limit(1),
      db
        .select({ updatedAt: savingsGoals.updatedAt })
        .from(savingsGoals)
        .where(inArray(savingsGoals.userId, coupleUserIds))
        .orderBy(desc(savingsGoals.updatedAt))
        .limit(1),
      db
        .select({ updatedAt: budgetPlans.updatedAt })
        .from(budgetPlans)
        .where(inArray(budgetPlans.userId, coupleUserIds))
        .orderBy(desc(budgetPlans.updatedAt))
        .limit(1),
    ]);

  const toMs = (d: Date | string | null | undefined) => d ? new Date(d).getTime() : 0;

  return NextResponse.json({
    accounts: toMs(latestAccount[0]?.updatedAt),
    transactions: toMs(latestTx[0]?.updatedAt),
    budgets: toMs(latestBudget[0]?.updatedAt),
    loans: toMs(latestLoan[0]?.updatedAt),
    goals: toMs(latestGoal[0]?.updatedAt),
    budget_plans: toMs(latestBudgetPlan[0]?.updatedAt),
  });
}

export const GET = withRateLimit(
  withCache(getHandler, { ttl: 120, keyPrefix: 'finance:sync-status' }),
  { max: 100, window: 60 }
);
