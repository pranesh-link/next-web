import cron from "node-cron";
import { purgeExpiredMessages, cleanupDeliveredMessages } from "../shared/message-purge.js";
import { db } from "../shared/db.js";
import {
  investmentHoldings, users, coupleMembers, budgets, transactions,
  notifications, depositInstallments, depositInstruments,
} from "../shared/schema.js";
import { eq, and, inArray, gte, lte, lt, sum } from "drizzle-orm";
import { sendPushToUser } from "../shared/chat-push.js";

// ── Investment price sync ─────────────────────────────────────────────────────

const EXCHANGE_SUFFIX: Record<string, string> = { NSE: ".NS", BSE: ".BO" };

async function fetchStockPrice(ticker: string, exchange: string): Promise<number | null> {
  try {
    const suffix = EXCHANGE_SUFFIX[exchange] ?? ".NS";
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker + suffix)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const json = await res.json() as any;
    const closes: number[] | undefined = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
    const price = closes?.filter(Boolean).at(-1);
    return typeof price === "number" ? price : null;
  } catch { return null; }
}

async function fetchMutualFundNav(schemeCode: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}/latest`);
    if (!res.ok) return null;
    const json = await res.json() as any;
    const nav = json?.data?.[0]?.nav;
    return nav !== undefined ? parseFloat(nav) : null;
  } catch { return null; }
}

async function syncInvestmentPrices(): Promise<number> {
  const holdings = await db.query.investmentHoldings.findMany({
    where: inArray(investmentHoldings.assetType, ["STOCK", "MUTUAL_FUND"]),
  });
  let updated = 0;
  for (const holding of holdings) {
    try {
      if (holding.assetType === "STOCK") {
        if (!holding.ticker || !holding.exchange) continue;
        const price = await fetchStockPrice(holding.ticker, holding.exchange);
        if (price === null) continue;
        const currentValue = holding.quantity != null ? holding.quantity * price : holding.currentValue;
        await db.update(investmentHoldings)
          .set({ currentPrice: price, currentValue: currentValue ?? undefined })
          .where(eq(investmentHoldings.id, holding.id));
        updated++;
      } else if (holding.assetType === "MUTUAL_FUND") {
        if (!holding.ticker) continue;
        const nav = await fetchMutualFundNav(holding.ticker);
        if (nav === null) continue;
        const currentValue = holding.quantity != null ? holding.quantity * nav : holding.currentValue;
        await db.update(investmentHoldings)
          .set({ currentPrice: nav, currentValue: currentValue ?? undefined })
          .where(eq(investmentHoldings.id, holding.id));
        updated++;
      }
    } catch { /* skip individual failures */ }
  }
  return updated;
}

// ── Notification generation ───────────────────────────────────────────────────

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function generateBudgetAlerts(userId: string, coupleUserIds: string[], month: string, monthStart: Date, monthEnd: Date): Promise<number> {
  const [budgetRows, spentGroups] = await Promise.all([
    db.query.budgets.findMany({ where: and(inArray(budgets.userId, coupleUserIds), eq(budgets.month, month)) }),
    db.select({ category: transactions.category, total: sum(transactions.amount) })
      .from(transactions)
      .where(and(inArray(transactions.userId, coupleUserIds), eq(transactions.type, "EXPENSE"), gte(transactions.date, monthStart), lt(transactions.date, monthEnd)))
      .groupBy(transactions.category),
  ]);
  const spentMap = new Map(spentGroups.map((g) => [g.category, Number(g.total ?? 0)]));
  let created = 0;
  for (const budget of budgetRows) {
    const spent = spentMap.get(budget.category) ?? 0;
    const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
    if (pct < 80) continue;
    const featureId = `${budget.id}:${month}`;
    const existing = await db.query.notifications.findFirst({ where: and(eq(notifications.userId, userId), eq(notifications.type, "BUDGET_ALERT"), eq(notifications.featureId, featureId)) });
    if (existing) continue;
    await db.insert(notifications).values({ userId, type: "BUDGET_ALERT", featureId, payload: { budgetId: budget.id, category: budget.category, limit: budget.limit, spent, pct: Math.round(pct), month } });
    created++;
  }
  return created;
}

async function generateSipReminders(userId: string, coupleUserIds: string[], now: Date): Promise<number> {
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sipHoldings = await db.query.investmentHoldings.findMany({
    where: and(inArray(investmentHoldings.userId, coupleUserIds), eq(investmentHoldings.mode, "SIP"), gte(investmentHoldings.nextSipDate, now), lte(investmentHoldings.nextSipDate, threeDaysFromNow)),
  });
  let created = 0;
  for (const holding of sipHoldings) {
    if (!holding.nextSipDate) continue;
    const featureId = `${holding.id}:${String(holding.nextSipDate).slice(0, 10)}`;
    const existing = await db.query.notifications.findFirst({ where: and(eq(notifications.userId, userId), eq(notifications.type, "SIP_REMINDER"), eq(notifications.featureId, featureId)) });
    if (existing) continue;
    await db.insert(notifications).values({ userId, type: "SIP_REMINDER", featureId, payload: { holdingId: holding.id, name: holding.name, sipAmount: holding.sipAmount, nextSipDate: String(holding.nextSipDate).slice(0, 10) } });
    created++;
  }
  return created;
}

async function generateDepositReminders(userId: string, coupleUserIds: string[], now: Date): Promise<number> {
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const pendingInstallments = await db
    .select({ id: depositInstallments.id, amount: depositInstallments.amount, dueDate: depositInstallments.dueDate, depositName: depositInstruments.name })
    .from(depositInstallments)
    .innerJoin(depositInstruments, eq(depositInstallments.depositId, depositInstruments.id))
    .where(and(eq(depositInstallments.status, "PENDING"), gte(depositInstallments.dueDate, now), lte(depositInstallments.dueDate, threeDaysFromNow), inArray(depositInstruments.userId, coupleUserIds)));
  let created = 0;
  for (const inst of pendingInstallments) {
    const featureId = `${inst.id}:${String(inst.dueDate).slice(0, 10)}`;
    const existing = await db.query.notifications.findFirst({ where: and(eq(notifications.userId, userId), eq(notifications.type, "DEPOSIT_REMINDER"), eq(notifications.featureId, featureId)) });
    if (existing) continue;
    await db.insert(notifications).values({ userId, type: "DEPOSIT_REMINDER", featureId, payload: { installmentId: inst.id, depositName: inst.depositName, amount: inst.amount, dueDate: String(inst.dueDate).slice(0, 10) } });
    created++;
  }
  return created;
}

async function generateNotifications(): Promise<number> {
  const now = new Date();
  const month = currentMonthKey();
  const [year, m] = month.split("-").map(Number);
  const monthStart = new Date(year, m - 1, 1);
  const monthEnd = new Date(year, m, 1);

  const allUsers = await db.select({ id: users.id }).from(users);
  const allMembers = await db.select({ coupleId: coupleMembers.coupleId, userId: coupleMembers.userId }).from(coupleMembers);

  const coupleIdToUserIds = new Map<string, string[]>();
  const userIdToCoupleIds = new Map<string, string[]>();
  for (const mem of allMembers) {
    if (!coupleIdToUserIds.has(mem.coupleId)) coupleIdToUserIds.set(mem.coupleId, []);
    coupleIdToUserIds.get(mem.coupleId)!.push(mem.userId);
    if (!userIdToCoupleIds.has(mem.userId)) userIdToCoupleIds.set(mem.userId, []);
    userIdToCoupleIds.get(mem.userId)!.push(mem.coupleId);
  }

  let totalCreated = 0;
  for (const user of allUsers) {
    const ids = new Set<string>([user.id]);
    for (const coupleId of userIdToCoupleIds.get(user.id) ?? []) {
      for (const uid of coupleIdToUserIds.get(coupleId) ?? []) ids.add(uid);
    }
    const coupleUserIds = Array.from(ids);

    const [budgetCount, sipCount, depositCount] = await Promise.all([
      generateBudgetAlerts(user.id, coupleUserIds, month, monthStart, monthEnd),
      generateSipReminders(user.id, coupleUserIds, now),
      generateDepositReminders(user.id, coupleUserIds, now),
    ]);
    totalCreated += budgetCount + sipCount + depositCount;

    if (budgetCount > 0) sendPushToUser(user.id, "Budget Alert", "You're close to exceeding your budget.", { type: "BUDGET_ALERT", featureId: "", notificationId: "" }).catch(() => {});
    if (sipCount > 0) sendPushToUser(user.id, "SIP Reminder", "Your SIP payment is due in the next few days.", { type: "SIP_REMINDER", featureId: "", notificationId: "" }).catch(() => {});
    if (depositCount > 0) sendPushToUser(user.id, "Deposit Reminder", "A deposit installment is due soon.", { type: "DEPOSIT_REMINDER", featureId: "", notificationId: "" }).catch(() => {});
  }
  return totalCreated;
}

// ── Cron scheduler ────────────────────────────────────────────────────────────

export function startCrons() {
  // Chat purge every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    try {
      const [expired, delivered] = await Promise.all([purgeExpiredMessages(), cleanupDeliveredMessages()]);
      console.log(`[cron:chat-purge] expired=${expired} delivered=${delivered}`);
    } catch (e) { console.error("[cron:chat-purge] error:", e); }
  });

  // Investment price sync weekdays at 9am UTC (2:30pm IST)
  cron.schedule("0 9 * * 1-5", async () => {
    try {
      const updated = await syncInvestmentPrices();
      console.log(`[cron:investment-sync] updated=${updated}`);
    } catch (e) { console.error("[cron:investment-sync] error:", e); }
  });

  // Finance notifications daily at 8am UTC (1:30pm IST)
  cron.schedule("0 8 * * *", async () => {
    try {
      const created = await generateNotifications();
      console.log(`[cron:notifications] created=${created}`);
    } catch (e) { console.error("[cron:notifications] error:", e); }
  });

  console.log("[crons] scheduled: chat-purge(*/6h), investment-sync(weekdays 9am UTC), notifications(daily 8am UTC)");
}
