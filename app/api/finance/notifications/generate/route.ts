import { NextRequest, NextResponse } from "next/server";
import { db } from "@db";
import {
  users,
  coupleMembers,
  budgets,
  transactions,
  notifications,
  investmentHoldings,
  depositInstallments,
  depositInstruments,
} from "@db/schema";
import { eq, and, inArray, gte, lte, lt, sum } from "drizzle-orm";
import { sendPushToUser } from "@/_services/finance/push-service";

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
  const [budgetRows, spentGroups] = await Promise.all([
    db.query.budgets.findMany({
      where: and(inArray(budgets.userId, coupleUserIds), eq(budgets.month, month)),
    }),
    db
      .select({ category: transactions.category, total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          inArray(transactions.userId, coupleUserIds),
          eq(transactions.type, "EXPENSE"),
          gte(transactions.date, monthStart),
          lt(transactions.date, monthEnd),
        ),
      )
      .groupBy(transactions.category),
  ]);

  const spentMap = new Map<string, number>(
    spentGroups.map((g) => [g.category, Number(g.total ?? 0)])
  );

  let created = 0;
  for (const budget of budgetRows) {
    const spent = spentMap.get(budget.category) ?? 0;
    const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    if (pct < 80) continue;

    // Dedup: one alert per budget per month
    const featureId = `${budget.id}:${month}`;
    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.type, "BUDGET_ALERT"),
        eq(notifications.featureId, featureId),
      ),
    });
    if (existing) continue;

    await db.insert(notifications).values({
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

  const sipHoldings = await db.query.investmentHoldings.findMany({
    where: and(
      inArray(investmentHoldings.userId, coupleUserIds),
      eq(investmentHoldings.mode, "SIP"),
      gte(investmentHoldings.nextSipDate, now),
      lte(investmentHoldings.nextSipDate, threeDaysFromNow),
    ),
  });

  let created = 0;
  for (const holding of sipHoldings) {
    if (!holding.nextSipDate) continue;
    const featureId = `${holding.id}:${String(holding.nextSipDate).slice(0, 10)}`;
    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.type, "SIP_REMINDER"),
        eq(notifications.featureId, featureId),
      ),
    });
    if (existing) continue;

    await db.insert(notifications).values({
      userId,
      type: "SIP_REMINDER",
      featureId,
      payload: {
        holdingId: holding.id,
        name: holding.name,
        sipAmount: holding.sipAmount,
        nextSipDate: String(holding.nextSipDate).slice(0, 10),
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

  const pendingInstallments = await db
    .select({
      id: depositInstallments.id,
      amount: depositInstallments.amount,
      dueDate: depositInstallments.dueDate,
      depositName: depositInstruments.name,
    })
    .from(depositInstallments)
    .innerJoin(depositInstruments, eq(depositInstallments.depositId, depositInstruments.id))
    .where(
      and(
        eq(depositInstallments.status, "PENDING"),
        gte(depositInstallments.dueDate, now),
        lte(depositInstallments.dueDate, threeDaysFromNow),
        inArray(depositInstruments.userId, coupleUserIds),
      ),
    );

  let created = 0;
  for (const installment of pendingInstallments) {
    const featureId = `${installment.id}:${String(installment.dueDate).slice(0, 10)}`;
    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.type, "DEPOSIT_REMINDER"),
        eq(notifications.featureId, featureId),
      ),
    });
    if (existing) continue;

    await db.insert(notifications).values({
      userId,
      type: "DEPOSIT_REMINDER",
      featureId,
      payload: {
        installmentId: installment.id,
        depositName: installment.depositName,
        amount: installment.amount,
        dueDate: String(installment.dueDate).slice(0, 10),
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

  // Get all users and couple memberships upfront for efficient couple resolution
  const allUsers = await db.select({ id: users.id }).from(users);
  const allCoupleMembers = await db
    .select({ coupleId: coupleMembers.coupleId, userId: coupleMembers.userId })
    .from(coupleMembers);

  // Build lookup maps: coupleId → [userIds], userId → [coupleIds]
  const coupleIdToUserIds = new Map<string, string[]>();
  const userIdToCoupleIds = new Map<string, string[]>();
  for (const m of allCoupleMembers) {
    if (!coupleIdToUserIds.has(m.coupleId)) coupleIdToUserIds.set(m.coupleId, []);
    coupleIdToUserIds.get(m.coupleId)!.push(m.userId);
    if (!userIdToCoupleIds.has(m.userId)) userIdToCoupleIds.set(m.userId, []);
    userIdToCoupleIds.get(m.userId)!.push(m.coupleId);
  }

  let totalCreated = 0;

  for (const user of allUsers) {
    // Resolve couple user IDs (self + partner)
    const coupleUserIdSet = new Set<string>([user.id]);
    const userCoupleIds = userIdToCoupleIds.get(user.id) ?? [];
    for (const coupleId of userCoupleIds) {
      for (const memberId of coupleIdToUserIds.get(coupleId) ?? []) {
        coupleUserIdSet.add(memberId);
      }
    }
    const ids = Array.from(coupleUserIdSet);

    const [budgetCount, sipCount, depositCount] = await Promise.all([
      generateBudgetAlerts(user.id, ids, month, monthStart, monthEnd),
      generateSipReminders(user.id, ids, now),
      generateDepositReminders(user.id, ids, now),
    ]);

    const userCreated = budgetCount + sipCount + depositCount;
    totalCreated += userCreated;

    // Fire push notifications for newly generated alerts
    if (budgetCount > 0) {
      sendPushToUser(user.id, 'Budget Alert', 'You\'re close to exceeding your budget.', {
        type: 'BUDGET_ALERT', featureId: '', notificationId: '',
      }).catch(() => {});
    }
    if (sipCount > 0) {
      sendPushToUser(user.id, 'SIP Reminder', 'Your SIP payment is due in the next few days.', {
        type: 'SIP_REMINDER', featureId: '', notificationId: '',
      }).catch(() => {});
    }
    if (depositCount > 0) {
      sendPushToUser(user.id, 'Deposit Reminder', 'A deposit installment is due soon.', {
        type: 'DEPOSIT_REMINDER', featureId: '', notificationId: '',
      }).catch(() => {});
    }
  }

  return NextResponse.json({ created: totalCreated });
}
