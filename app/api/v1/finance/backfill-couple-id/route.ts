import { NextResponse } from "next/server";
import prisma from "@/_lib/prisma";

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
  const memberships = await prisma.coupleMember.findMany({
    select: { userId: true, coupleId: true },
  });

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
  const [accounts, transactions, budgets, loans, goals] = await Promise.all([
    // FinancialAccount
    Promise.all(
      userIds.map((userId) =>
        prisma.financialAccount.updateMany({
          where: { userId, coupleId: null },
          data: { coupleId: userCoupleMap.get(userId)! },
        })
      )
    ),
    // Transaction
    Promise.all(
      userIds.map((userId) =>
        prisma.transaction.updateMany({
          where: { userId, coupleId: null },
          data: { coupleId: userCoupleMap.get(userId)! },
        })
      )
    ),
    // Budget
    Promise.all(
      userIds.map((userId) =>
        prisma.budget.updateMany({
          where: { userId, coupleId: null },
          data: { coupleId: userCoupleMap.get(userId)! },
        })
      )
    ),
    // Loan
    Promise.all(
      userIds.map((userId) =>
        prisma.loan.updateMany({
          where: { userId, coupleId: null },
          data: { coupleId: userCoupleMap.get(userId)! },
        })
      )
    ),
    // SavingsGoal
    Promise.all(
      userIds.map((userId) =>
        prisma.savingsGoal.updateMany({
          where: { userId, coupleId: null },
          data: { coupleId: userCoupleMap.get(userId)! },
        })
      )
    ),
  ]);

  const sum = (results: { count: number }[]) =>
    results.reduce((s, r) => s + r.count, 0);

  return NextResponse.json({
    message: "Backfill complete",
    couplesProcessed: new Set(userCoupleMap.values()).size,
    usersProcessed: userIds.length,
    updated: {
      accounts: sum(accounts),
      transactions: sum(transactions),
      budgets: sum(budgets),
      loans: sum(loans),
      goals: sum(goals),
    },
  });
}
