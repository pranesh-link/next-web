import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

/**
 * GET /api/v1/finance/sync-status
 *
 * Returns last modification timestamps per entity for cache invalidation.
 * Couple-aware: checks both user's and partner's modifications.
 *
 * @remarks GET · auth: JWT via getAuthUserId
 */
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const coupleUserIds = await getUserIdsForCouple(userId);

  // Get the latest updatedAt for each entity type
  const [accounts, transactions, budgets, loans, goals, budgetPlans] =
    await Promise.all([
      prisma.financialAccount.findFirst({
        where: { userId: { in: coupleUserIds } },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.transaction.findFirst({
        where: { userId: { in: coupleUserIds } },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.budget.findFirst({
        where: { userId: { in: coupleUserIds } },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.loan.findFirst({
        where: { userId: { in: coupleUserIds } },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.savingsGoal.findFirst({
        where: { userId: { in: coupleUserIds } },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
      prisma.budgetPlan.findFirst({
        where: { userId: { in: coupleUserIds } },
        orderBy: { updatedAt: "desc" },
        select: { updatedAt: true },
      }),
    ]);

  const toMs = (d: Date | null | undefined) => d?.getTime() ?? 0;

  return NextResponse.json({
    accounts: toMs(accounts?.updatedAt),
    transactions: toMs(transactions?.updatedAt),
    budgets: toMs(budgets?.updatedAt),
    loans: toMs(loans?.updatedAt),
    goals: toMs(goals?.updatedAt),
    budget_plans: toMs(budgetPlans?.updatedAt),
  });
}
