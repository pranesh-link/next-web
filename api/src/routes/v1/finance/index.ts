import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/auth.js";
import { db } from "../../../plugins/db.js";
import {
  transactions, financialAccounts, budgets, loans, savingsGoals,
  depositInstruments, depositInstallments, investmentHoldings, budgetPlans,
  notifications, balanceHistory, overallBalanceLog, users,
} from "../../../shared/schema.js";
import { inArray, desc, eq, and, gte, lt, count, isNull, sql } from "drizzle-orm";
import { getUserIdsForCouple, getCoupleIdForUser } from "../../../shared/couple-membership.js";

type AuthReq = { userId: string };

async function coupleCtx(userId: string) {
  const [userIds, coupleId] = await Promise.all([getUserIdsForCouple(userId), getCoupleIdForUser(userId)]);
  return { userIds, coupleId };
}

function calcTenure(balance: number, emi: number, annualRate: number): number {
  if (balance <= 0) return 0;
  if (annualRate === 0) return Math.ceil(balance / emi);
  const r = annualRate / 12 / 100;
  if (emi <= balance * r) return Infinity;
  return Math.ceil(Math.log(emi / (emi - balance * r)) / Math.log(1 + r));
}

function goalProgress(goal: { targetAmount: number; currentAmount: number; deadline?: Date | string | null }) {
  const { targetAmount, currentAmount, deadline } = goal;
  if (targetAmount <= 0) return { percentage: 100, remaining: 0, onTrack: true };
  const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
  const remaining = Math.max(targetAmount - currentAmount, 0);
  if (!deadline) return { percentage, remaining, onTrack: remaining === 0 };
  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  const now = new Date();
  const monthsLeft = (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth());
  return { percentage, remaining, onTrack: remaining === 0 || monthsLeft > 0, monthsToGoal: Math.max(0, monthsLeft) };
}

export async function registerFinanceRoutes(app: FastifyInstance) {
  // ── Transactions ──
  app.get("/transactions", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const qs = req.query as Record<string, string>;
    const conditions: ReturnType<typeof eq>[] = [inArray(transactions.userId, userIds) as never];
    if (qs.month) { const [y,m] = qs.month.split("-").map(Number); conditions.push(gte(transactions.date, new Date(y,m-1,1)) as never); conditions.push(lt(transactions.date, new Date(y,m,1)) as never); }
    if (qs.category) conditions.push(eq(transactions.category, qs.category) as never);
    if (qs.accountId) conditions.push(eq(transactions.accountId, qs.accountId) as never);
    const rows = await db.select().from(transactions).where(and(...(conditions as never[]))).orderBy(desc(transactions.date)).limit(qs.limit ? parseInt(qs.limit) : 1000);
    return reply.send({ success: true, data: rows });
  });

  app.post("/transactions", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds, coupleId } = await coupleCtx(userId);
    const body = req.body as Record<string, unknown>;
    const account = await db.query.financialAccounts.findFirst({ where: and(eq(financialAccounts.id, body.accountId as string), inArray(financialAccounts.userId, userIds) as never) });
    if (!account) return reply.code(404).send({ success: false, error: "Account not found" });
    const [tx] = await db.insert(transactions).values({ userId, coupleId: coupleId ?? undefined, accountId: body.accountId as string, amount: body.amount as number, type: body.type as string, category: body.category as string, description: (body.description as string) ?? null, date: new Date(body.date as string) } as any).returning();
    return reply.code(201).send({ success: true, data: tx });
  });

  app.get("/transactions/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const tx = await db.query.transactions.findFirst({ where: and(eq(transactions.id, id), inArray(transactions.userId, userIds) as never) });
    if (!tx) return reply.code(404).send({ success: false, error: "Not found" });
    return reply.send({ success: true, data: tx });
  });

  app.put("/transactions/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    const existing = await db.query.transactions.findFirst({ where: and(eq(transactions.id, id), inArray(transactions.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [updated] = await db.update(transactions).set({ ...(body as any), updatedAt: new Date() }).where(eq(transactions.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.delete("/transactions/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.transactions.findFirst({ where: and(eq(transactions.id, id), inArray(transactions.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    await db.delete(transactions).where(eq(transactions.id, id));
    return reply.send({ success: true });
  });

  // ── Accounts ──
  app.get("/accounts", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const rows = await db.select().from(financialAccounts).where(inArray(financialAccounts.userId, userIds) as never).orderBy(financialAccounts.name);
    return reply.send({ success: true, data: rows });
  });

  // MUST be before /accounts/:id
  app.get("/accounts/balance-history", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds, coupleId } = await coupleCtx(userId);
    const qs = req.query as Record<string, string>;
    const limit = Math.min(Number(qs.limit) || 20, 50);
    const cursor = qs.cursor ?? null;
    const whereClause = coupleId
      ? and(eq(overallBalanceLog.coupleId, coupleId), cursor ? lt(overallBalanceLog.id, cursor) : undefined)
      : and(inArray(overallBalanceLog.userId, userIds) as never, cursor ? lt(overallBalanceLog.id, cursor) : undefined);
    const logs = await db.query.overallBalanceLog.findMany({
      where: whereClause,
      orderBy: (l, { desc: d }) => [d(l.createdAt)],
      limit: limit + 1,
    });
    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    return reply.send({ success: true, data: { items, nextCursor, hasMore } });
  });

  app.get("/accounts/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const account = await db.query.financialAccounts.findFirst({ where: and(eq(financialAccounts.id, id), inArray(financialAccounts.userId, userIds) as never) });
    if (!account) return reply.code(404).send({ success: false, error: "Account not found" });
    const history = await db.query.balanceHistory.findMany({
      where: eq(balanceHistory.accountId, id),
      orderBy: (h, { desc: d }) => [d(h.createdAt)],
      limit: 20,
      columns: { id: true, balance: true, change: true, note: true, createdAt: true },
    });
    return reply.send({ success: true, data: { ...account, balanceHistory: history } });
  });

  app.post("/accounts", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const body = req.body as Record<string, unknown>;
    const [account] = await db.insert(financialAccounts).values({ userId, coupleId: coupleId ?? undefined, ...(body as any) }).returning();
    return reply.code(201).send({ success: true, data: account });
  });

  app.put("/accounts/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.financialAccounts.findFirst({ where: and(eq(financialAccounts.id, id), inArray(financialAccounts.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [updated] = await db.update(financialAccounts).set({ ...(req.body as any), updatedAt: new Date() }).where(eq(financialAccounts.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.delete("/accounts/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.financialAccounts.findFirst({ where: and(eq(financialAccounts.id, id), inArray(financialAccounts.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [linkedCount] = await db.select({ value: count() }).from(transactions).where(eq(transactions.accountId, id));
    if (linkedCount.value > 0) return reply.code(400).send({ success: false, error: `Cannot delete account with ${linkedCount.value} linked transaction(s). Delete transactions first.` });
    await db.delete(financialAccounts).where(eq(financialAccounts.id, id));
    return reply.send({ success: true, data: { id } });
  });

  // ── Budgets ──
  app.get("/budgets", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const rows = await db.select().from(budgets).where(inArray(budgets.userId, userIds) as never).orderBy(desc(budgets.createdAt));
    return reply.send({ success: true, data: rows });
  });

  app.post("/budgets", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const [row] = await db.insert(budgets).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as any) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  app.put("/budgets/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.budgets.findFirst({ where: and(eq(budgets.id, id), inArray(budgets.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [updated] = await db.update(budgets).set({ ...(req.body as any), updatedAt: new Date() }).where(eq(budgets.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.delete("/budgets/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.budgets.findFirst({ where: and(eq(budgets.id, id), inArray(budgets.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    await db.delete(budgets).where(eq(budgets.id, id));
    return reply.send({ success: true });
  });

  // ── Loans ──
  app.get("/loans", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const rows = await db.select().from(loans).where(inArray(loans.userId, userIds) as never).orderBy(desc(loans.createdAt));
    return reply.send({ success: true, data: rows });
  });

  // MUST be before POST /loans
  app.get("/loans/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const loan = await db.query.loans.findFirst({ where: and(eq(loans.id, id), inArray(loans.userId, userIds) as never) });
    if (!loan) return reply.code(404).send({ success: false, error: "Loan not found" });
    const monthsRemaining = calcTenure(loan.remainingBalance, loan.emiAmount, loan.interestRate);
    const totalInterestPayable = Math.max(0, loan.emiAmount * loan.tenureMonths - loan.principal);
    const insights = { totalInterestPayable, monthsRemaining, prepaymentAmount: loan.emiAmount, earlyPayoffSavings: 0 };
    return reply.send({ success: true, data: { ...loan, insights } });
  });

  app.post("/loans/:id/prepayment", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const loan = await db.query.loans.findFirst({ where: and(eq(loans.id, id), inArray(loans.userId, userIds) as never) });
    if (!loan) return reply.code(404).send({ success: false, error: "Loan not found" });
    const body = req.body as Record<string, unknown>;
    const amount = Number(body.amount);
    if (!amount || amount <= 0) return reply.code(400).send({ success: false, error: "amount must be a positive number" });
    const { interestRate, tenureMonths, emiAmount, remainingBalance } = loan;
    const newBalance = Math.max(0, remainingBalance - amount);
    const oldTenure = calcTenure(remainingBalance, emiAmount, interestRate);
    const newTenure = calcTenure(newBalance, emiAmount, interestRate);
    const oldInterest = Math.max(0, emiAmount * oldTenure - remainingBalance);
    const newInterest = newBalance === 0 ? 0 : Math.max(0, emiAmount * newTenure - newBalance);
    return reply.send({ success: true, data: { originalInterest: oldInterest, newInterest, interestSaved: Math.max(0, oldInterest - newInterest), newTenure, originalTenure: tenureMonths } });
  });

  app.post("/loans", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const [row] = await db.insert(loans).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as any) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  app.put("/loans/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.loans.findFirst({ where: and(eq(loans.id, id), inArray(loans.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [updated] = await db.update(loans).set({ ...(req.body as any), updatedAt: new Date() }).where(eq(loans.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.delete("/loans/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.loans.findFirst({ where: and(eq(loans.id, id), inArray(loans.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    await db.delete(loans).where(eq(loans.id, id));
    return reply.send({ success: true });
  });

  // ── Goals ──
  app.get("/goals", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const rows = await db.select().from(savingsGoals).where(inArray(savingsGoals.userId, userIds) as never).orderBy(desc(savingsGoals.createdAt));
    return reply.send({ success: true, data: rows });
  });

  // MUST be before POST /goals
  app.get("/goals/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const goal = await db.query.savingsGoals.findFirst({ where: and(eq(savingsGoals.id, id), inArray(savingsGoals.userId, userIds) as never) });
    if (!goal) return reply.code(404).send({ success: false, error: "Goal not found" });
    return reply.send({ success: true, data: { ...goal, progress: goalProgress(goal) } });
  });

  app.post("/goals/:id/contribute", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.savingsGoals.findFirst({ where: and(eq(savingsGoals.id, id), inArray(savingsGoals.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Goal not found" });
    const body = req.body as Record<string, unknown>;
    const amount = Number(body.amount);
    if (!amount || amount <= 0) return reply.code(400).send({ success: false, error: "amount must be positive" });
    const [updated] = await db.update(savingsGoals).set({ currentAmount: sql`${savingsGoals.currentAmount} + ${amount}` } as any).where(eq(savingsGoals.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.post("/goals", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const [row] = await db.insert(savingsGoals).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as any) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  // URL mismatch fix: was /savingsGoals/:id → now /goals/:id
  app.put("/goals/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.savingsGoals.findFirst({ where: and(eq(savingsGoals.id, id), inArray(savingsGoals.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [updated] = await db.update(savingsGoals).set({ ...(req.body as any), updatedAt: new Date() }).where(eq(savingsGoals.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.delete("/goals/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.savingsGoals.findFirst({ where: and(eq(savingsGoals.id, id), inArray(savingsGoals.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    await db.delete(savingsGoals).where(eq(savingsGoals.id, id));
    return reply.send({ success: true });
  });

  // ── Deposits ──
  app.get("/deposits", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const rows = await db.select().from(depositInstruments).where(inArray(depositInstruments.userId, userIds) as never).orderBy(desc(depositInstruments.createdAt));
    return reply.send({ success: true, data: rows });
  });

  // MUST be before POST /deposits
  app.get("/deposits/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const deposit = await db.query.depositInstruments.findFirst({ where: and(eq(depositInstruments.id, id), inArray(depositInstruments.userId, userIds) as never) });
    if (!deposit) return reply.code(404).send({ success: false, error: "Deposit not found" });
    const installments = await db.query.depositInstallments.findMany({
      where: eq(depositInstallments.depositId, id),
      orderBy: (t, { asc: a }) => [a(t.dueDate)],
    });
    return reply.send({ success: true, data: { ...deposit, installments } });
  });

  app.post("/deposits", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const [row] = await db.insert(depositInstruments).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as any) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  app.put("/deposits/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.depositInstruments.findFirst({ where: and(eq(depositInstruments.id, id), inArray(depositInstruments.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [updated] = await db.update(depositInstruments).set({ ...(req.body as any), updatedAt: new Date() }).where(eq(depositInstruments.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.delete("/deposits/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.depositInstruments.findFirst({ where: and(eq(depositInstruments.id, id), inArray(depositInstruments.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    await db.delete(depositInstallments).where(eq(depositInstallments.depositId, id));
    await db.delete(depositInstruments).where(eq(depositInstruments.id, id));
    return reply.send({ success: true });
  });

  // ── Investments ──
  app.get("/investments", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const rows = await db.select().from(investmentHoldings).where(inArray(investmentHoldings.userId, userIds) as never).orderBy(investmentHoldings.name);
    return reply.send({ success: true, data: rows });
  });

  // MUST be before POST /investments
  app.get("/investments/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const investment = await db.query.investmentHoldings.findFirst({ where: and(eq(investmentHoldings.id, id), inArray(investmentHoldings.userId, userIds) as never) });
    if (!investment) return reply.code(404).send({ success: false, error: "Investment not found" });
    return reply.send({ success: true, data: investment });
  });

  app.post("/investments", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const [row] = await db.insert(investmentHoldings).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as any) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  app.put("/investments/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.investmentHoldings.findFirst({ where: and(eq(investmentHoldings.id, id), inArray(investmentHoldings.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [updated] = await db.update(investmentHoldings).set({ ...(req.body as any), updatedAt: new Date() }).where(eq(investmentHoldings.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.delete("/investments/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.investmentHoldings.findFirst({ where: and(eq(investmentHoldings.id, id), inArray(investmentHoldings.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    await db.delete(investmentHoldings).where(eq(investmentHoldings.id, id));
    return reply.send({ success: true });
  });

  // ── Finance Notifications ──
  app.get("/notifications", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const rows = await db.select().from(notifications).where(inArray(notifications.userId, userIds) as never).orderBy(desc(notifications.createdAt));
    return reply.send({ success: true, data: rows });
  });

  // MUST be before /notifications/:id/* to avoid "archive-all-read" captured as :id
  app.put("/notifications/archive-all-read", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    await db.update(notifications).set({ archived: true, archivedAt: new Date() } as any)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, true), eq(notifications.archived, false) as never));
    return reply.send({ success: true, message: "All read notifications archived" });
  });

  app.put("/notifications/:id/archive", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { id } = req.params as { id: string };
    const existing = await db.query.notifications.findFirst({ where: and(eq(notifications.id, id), eq(notifications.userId, userId)) });
    if (!existing) return reply.code(404).send({ success: false, error: "Notification not found" });
    const [updated] = await db.update(notifications).set({ archived: true, archivedAt: new Date() } as any).where(eq(notifications.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.put("/notifications/:id/unarchive", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { id } = req.params as { id: string };
    const existing = await db.query.notifications.findFirst({ where: and(eq(notifications.id, id), eq(notifications.userId, userId)) });
    if (!existing) return reply.code(404).send({ success: false, error: "Notification not found" });
    const [updated] = await db.update(notifications).set({ archived: false, archivedAt: null } as any).where(eq(notifications.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.put("/notifications/:id/unread", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { id } = req.params as { id: string };
    const existing = await db.query.notifications.findFirst({ where: and(eq(notifications.id, id), eq(notifications.userId, userId)) });
    if (!existing) return reply.code(404).send({ success: false, error: "Notification not found" });
    const [updated] = await db.update(notifications).set({ read: false }).where(eq(notifications.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  // ── Sync Status ──
  app.get("/sync-status", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds, coupleId } = await coupleCtx(userId);
    const [txCount, accountCount] = await Promise.all([
      db.select().from(transactions).where(inArray(transactions.userId, userIds) as never).then(r => r.length),
      db.select().from(financialAccounts).where(inArray(financialAccounts.userId, userIds) as never).then(r => r.length),
    ]);
    return reply.send({ success: true, data: { userId, coupleId, txCount, accountCount, lastSync: new Date().toISOString() } });
  });

  // ── Budget Plans ──
  app.get("/budget-plans", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const rows = await db.select().from(budgetPlans).where(inArray(budgetPlans.userId, userIds) as never).orderBy(desc(budgetPlans.createdAt));
    return reply.send({ success: true, data: rows });
  });

  // MUST be before POST /budget-plans
  app.get("/budget-plans/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const whereClause = coupleId
      ? and(eq(budgetPlans.id, id), eq(budgetPlans.coupleId, coupleId))
      : and(eq(budgetPlans.id, id), eq(budgetPlans.userId, userId), isNull(budgetPlans.coupleId));
    const plan = await db.query.budgetPlans.findFirst({ where: whereClause });
    if (!plan) return reply.code(404).send({ success: false, error: "Budget plan not found" });
    return reply.send({ success: true, data: plan });
  });

  app.post("/budget-plans", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const [row] = await db.insert(budgetPlans).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as any) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  app.put("/budget-plans/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const whereClause = coupleId
      ? and(eq(budgetPlans.id, id), eq(budgetPlans.coupleId, coupleId))
      : and(eq(budgetPlans.id, id), eq(budgetPlans.userId, userId), isNull(budgetPlans.coupleId));
    const existing = await db.query.budgetPlans.findFirst({ where: whereClause });
    if (!existing) return reply.code(404).send({ success: false, error: "Budget plan not found" });
    const body = req.body as Record<string, unknown>;
    const [planRow] = await db.update(budgetPlans).set({
      ...(body.income !== undefined && { income: body.income as number }),
      ...(body.lineItems !== undefined && { lineItems: body.lineItems }),
      ...(body.mode !== undefined && { mode: body.mode as string }),
      lastUpdatedById: userId,
    } as any).where(eq(budgetPlans.id, id)).returning();
    const lastUpdatedBy = planRow.lastUpdatedById
      ? await db.query.users.findFirst({ where: eq(users.id, planRow.lastUpdatedById), columns: { id: true, name: true, email: true } })
      : null;
    return reply.send({ success: true, data: { ...planRow, lastUpdatedBy: lastUpdatedBy ?? null } });
  });

  app.delete("/budget-plans/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const whereClause = coupleId
      ? and(eq(budgetPlans.id, id), eq(budgetPlans.coupleId, coupleId))
      : and(eq(budgetPlans.id, id), eq(budgetPlans.userId, userId), isNull(budgetPlans.coupleId));
    const existing = await db.query.budgetPlans.findFirst({ where: whereClause });
    if (!existing) return reply.code(404).send({ success: false, error: "Budget plan not found" });
    await db.delete(budgetPlans).where(eq(budgetPlans.id, id));
    return reply.send({ success: true });
  });

  // ── Insights (stubs — full implementation needs Gemini) ──
  app.get("/insights", { preHandler: requireAuth }, async (_req, reply) => {
    return reply.send({ success: true, data: {} });
  });

  app.get("/insights/health-score", { preHandler: requireAuth }, async (_req, reply) => {
    return reply.send({ success: true, data: { score: 0 } });
  });
}
