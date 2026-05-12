import { NextRequest, NextResponse } from "next/server";
import prisma from "@/_lib/prisma";

/** Current month string in "YYYY-MM" format. */
function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Generate BUDGET_ALERT notifications for a single user.
 * Skips creation if a notification for the same userId + type + featureId
 * already exists within the current month.
 *
 * @param userId - The user to check budgets for.
 * @param coupleUserIds - The user IDs sharing couple data (includes self).
 * @param month - The current month key "YYYY-MM".
 * @param monthStart - Start of the month as a Date.
 * @param monthEnd - Exclusive end of the month as a Date.
 * @returns Number of new notifications created.
 */
async function generateBudgetAlerts(
  userId: string,
  coupleUserIds: string[],
  month: string,
  monthStart: Date,
  monthEnd: Date
): Promise<number> {
  const [budgets, spentGroups] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: { in: coupleUserIds }, month },
    }),
    prisma.transaction.groupBy({
      by: ["category"] as const,
      where: {
        userId: { in: coupleUserIds },
        type: "EXPENSE" as const,
        date: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  const spentMap = new Map<string, number>(
    spentGroups.map((g) => [g.category, g._sum.amount ?? 0])
  );

  let created = 0;
  for (const budget of budgets) {
    const spent = spentMap.get(budget.category) ?? 0;
    const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    if (pct < 80) continue;

    // Dedup: one alert per budget per month
    const featureId = `${budget.id}:${month}`;
    const existing = await prisma.notification.findFirst({
      where: { userId, type: "BUDGET_ALERT", featureId },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId,
        type: "BUDGET_ALERT",
        featureId,
        payload: {
          budgetId: budget.id,
          category: budget.category,
          limit: budget.limit,
          spent,
          pct: Math.round(pct),
          month,
        },
      },
    });
    created++;
  }
  return created;
}

/**
 * Generate SIP_REMINDER notifications for upcoming SIP dates within 3 days.
 *
 * @param userId - The user to generate reminders for.
 * @param coupleUserIds - The couple user IDs to query investments from.
 * @param now - Current date reference.
 * @returns Number of new notifications created.
 */
async function generateSipReminders(
  userId: string,
  coupleUserIds: string[],
  now: Date
): Promise<number> {
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const sipHoldings = await prisma.investmentHolding.findMany({
    where: {
      userId: { in: coupleUserIds },
      mode: "SIP",
      nextSipDate: { gte: now, lte: threeDaysFromNow },
    },
  });

  let created = 0;
  for (const holding of sipHoldings) {
    if (!holding.nextSipDate) continue;
    const featureId = `${holding.id}:${holding.nextSipDate.toISOString().slice(0, 10)}`;
    const existing = await prisma.notification.findFirst({
      where: { userId, type: "SIP_REMINDER", featureId },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId,
        type: "SIP_REMINDER",
        featureId,
        payload: {
          holdingId: holding.id,
          name: holding.name,
          sipAmount: holding.sipAmount,
          nextSipDate: holding.nextSipDate.toISOString().slice(0, 10),
        },
      },
    });
    created++;
  }
  return created;
}

/**
 * Generate DEPOSIT_REMINDER notifications for pending installments due within 3 days.
 *
 * @param userId - The user to generate reminders for.
 * @param coupleUserIds - The couple user IDs to query installments from.
 * @param now - Current date reference.
 * @returns Number of new notifications created.
 */
async function generateDepositReminders(
  userId: string,
  coupleUserIds: string[],
  now: Date
): Promise<number> {
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const pendingInstallments = await prisma.depositInstallment.findMany({
    where: {
      status: "PENDING",
      dueDate: { gte: now, lte: threeDaysFromNow },
      deposit: { userId: { in: coupleUserIds } },
    },
    include: {
      deposit: { select: { name: true, userId: true } },
    },
  });

  let created = 0;
  for (const installment of pendingInstallments) {
    const featureId = `${installment.id}:${installment.dueDate.toISOString().slice(0, 10)}`;
    const existing = await prisma.notification.findFirst({
      where: { userId, type: "DEPOSIT_REMINDER", featureId },
    });
    if (existing) continue;

    await prisma.notification.create({
      data: {
        userId,
        type: "DEPOSIT_REMINDER",
        featureId,
        payload: {
          installmentId: installment.id,
          depositName: installment.deposit.name,
          amount: installment.amount,
          dueDate: installment.dueDate.toISOString().slice(0, 10),
        },
      },
    });
    created++;
  }
  return created;
}

/**
 * GET /api/finance/notifications/generate
 *
 * Cron-protected route that proactively generates notifications for all
 * active users: budget alerts, SIP reminders, and deposit installment reminders.
 *
 * @remarks Auth: CRON_SECRET header must match `process.env.CRON_SECRET`.
 * @returns JSON with total count of notifications created.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const secret = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const month = currentMonthKey();
  const [year, m] = month.split("-").map(Number);
  const monthStart = new Date(year, m - 1, 1);
  const monthEnd = new Date(year, m, 1);

  // Get all users with their couple members
  const users = await prisma.user.findMany({
    select: {
      id: true,
      coupleMembers: {
        select: {
          couple: {
            select: {
              members: { select: { userId: true } },
            },
          },
        },
      },
    },
  });

  let totalCreated = 0;

  for (const user of users) {
    // Resolve couple user IDs (self + partner)
    const coupleUserIds = new Set<string>([user.id]);
    for (const membership of user.coupleMembers) {
      for (const member of membership.couple.members) {
        coupleUserIds.add(member.userId);
      }
    }
    const ids = Array.from(coupleUserIds);

    const [budgetCount, sipCount, depositCount] = await Promise.all([
      generateBudgetAlerts(user.id, ids, month, monthStart, monthEnd),
      generateSipReminders(user.id, ids, now),
      generateDepositReminders(user.id, ids, now),
    ]);

    totalCreated += budgetCount + sipCount + depositCount;
  }

  return NextResponse.json({ created: totalCreated });
}
