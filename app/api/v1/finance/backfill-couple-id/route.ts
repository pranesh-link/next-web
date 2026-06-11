import { NextResponse } from "next/server";
import { db } from "@db";
import { coupleMembers, financialAccounts, transactions, budgets, loans, savingsGoals } from "@db/schema";
import { and, eq, isNull } from "drizzle-orm";

/**
 * POST /api/v1/finance/backfill-couple-id
 *
 * Backfills `coupleId` on existing financial records (accounts, transactions,
 * budgets, loans, savings goals) for users who are in a couple but whose
 * records were created before the couple-sharing feature.
 *
 * Requires `Authorization: Bearer <BACKFILL_SECRET>` header.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.BACKFILL_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all couple memberships
  const memberships = await db
    .select({ userId: coupleMembers.userId, coupleId: coupleMembers.coupleId })
    .from(coupleMembers);

  if (memberships.length === 0) {
    return NextResponse.json({ message: "No couples found", updated: {} });
  }

  // Build userId -> coupleId map
  const userCoupleMap = new Map<string, string>();
  for (const m of memberships) {
    userCoupleMap.set(m.userId, m.coupleId);
  }

  const userIds = [...userCoupleMap.keys()];

  // Backfill each table in parallel
  const [accountUpdates, txUpdates, budgetUpdates, loanUpdates, goalUpdates] = await Promise.all([
    // FinancialAccount
    Promise.all(
      userIds.map((userId) =>
        db
          .update(financialAccounts)
          .set({ coupleId: userCoupleMap.get(userId)! })
          .where(and(eq(financialAccounts.userId, userId), isNull(financialAccounts.coupleId)))
          .returning({ id: financialAccounts.id })
      )
    ),
    // Transaction
    Promise.all(
      userIds.map((userId) =>
        db
          .update(transactions)
          .set({ coupleId: userCoupleMap.get(userId)! })
          .where(and(eq(transactions.userId, userId), isNull(transactions.coupleId)))
          .returning({ id: transactions.id })
      )
    ),
    // Budget
    Promise.all(
      userIds.map((userId) =>
        db
          .update(budgets)
          .set({ coupleId: userCoupleMap.get(userId)! })
          .where(and(eq(budgets.userId, userId), isNull(budgets.coupleId)))
          .returning({ id: budgets.id })
      )
    ),
    // Loan
    Promise.all(
      userIds.map((userId) =>
        db
          .update(loans)
          .set({ coupleId: userCoupleMap.get(userId)! })
          .where(and(eq(loans.userId, userId), isNull(loans.coupleId)))
          .returning({ id: loans.id })
      )
    ),
    // SavingsGoal
    Promise.all(
      userIds.map((userId) =>
        db
          .update(savingsGoals)
          .set({ coupleId: userCoupleMap.get(userId)! })
          .where(and(eq(savingsGoals.userId, userId), isNull(savingsGoals.coupleId)))
          .returning({ id: savingsGoals.id })
      )
    ),
  ]);

  const sum = (results: { id: string }[][]) =>
    results.reduce((s, r) => s + r.length, 0);

  return NextResponse.json({
    message: "Backfill complete",
    couplesProcessed: new Set(userCoupleMap.values()).size,
    usersProcessed: userIds.length,
    updated: {
      accounts: sum(accountUpdates),
      transactions: sum(txUpdates),
      budgets: sum(budgetUpdates),
      loans: sum(loanUpdates),
      goals: sum(goalUpdates),
    },
  });
}
