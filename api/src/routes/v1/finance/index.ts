import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/auth.js";
import { db } from "../../../plugins/db.js";
import { transactions, financialAccounts, budgets, loans, savingsGoals, depositInstruments, investmentHoldings, budgetPlans, notifications } from "../../../shared/schema.js";
import { inArray, desc, eq, and, gte, lt, ne } from "drizzle-orm";
import { getUserIdsForCouple, getCoupleIdForUser } from "../../../shared/couple-membership.js";

type AuthReq = { userId: string };
type Req = AuthReq & FastifyInstance;

async function coupleCtx(userId: string) {
  const [userIds, coupleId] = await Promise.all([getUserIdsForCouple(userId), getCoupleIdForUser(userId)]);
  return { userIds, coupleId };
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
    const [tx] = await db.insert(transactions).values({ userId, coupleId: coupleId ?? undefined, accountId: body.accountId as string, amount: body.amount as number, type: body.type as string, category: body.category as string, description: (body.description as string) ?? null, date: new Date(body.date as string) }).returning();
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
    const [updated] = await db.update(transactions).set({ ...(body as Record<string, unknown>), updatedAt: new Date() }).where(eq(transactions.id, id)).returning();
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

  app.post("/accounts", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const body = req.body as Record<string, unknown>;
    const [account] = await db.insert(financialAccounts).values({ userId, coupleId: coupleId ?? undefined, ...(body as Record<string, unknown>) }).returning();
    return reply.code(201).send({ success: true, data: account });
  });

  app.put("/accounts/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.financialAccounts.findFirst({ where: and(eq(financialAccounts.id, id), inArray(financialAccounts.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [updated] = await db.update(financialAccounts).set({ ...(req.body as Record<string, unknown>), updatedAt: new Date() }).where(eq(financialAccounts.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.delete("/accounts/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.financialAccounts.findFirst({ where: and(eq(financialAccounts.id, id), inArray(financialAccounts.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    await db.delete(financialAccounts).where(eq(financialAccounts.id, id));
    return reply.send({ success: true });
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
    const [row] = await db.insert(budgets).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as Record<string, unknown>) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  app.put("/budgets/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.budgets.findFirst({ where: and(eq(budgets.id, id), inArray(budgets.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [updated] = await db.update(budgets).set({ ...(req.body as Record<string, unknown>), updatedAt: new Date() }).where(eq(budgets.id, id)).returning();
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

  app.post("/loans", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const [row] = await db.insert(loans).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as Record<string, unknown>) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  app.put("/loans/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.loans.findFirst({ where: and(eq(loans.id, id), inArray(loans.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [updated] = await db.update(loans).set({ ...(req.body as Record<string, unknown>), updatedAt: new Date() }).where(eq(loans.id, id)).returning();
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
    const rows = await db.select().from(goals).where(inArray(goals.userId, userIds) as never).orderBy(desc(goals.createdAt));
    return reply.send({ success: true, data: rows });
  });

  app.post("/goals", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const [row] = await db.insert(goals).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as Record<string, unknown>) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  app.put("/goals/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.savingsGoals.findFirst({ where: and(eq(goals.id, id), inArray(goals.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    const [updated] = await db.update(goals).set({ ...(req.body as Record<string, unknown>), updatedAt: new Date() }).where(eq(goals.id, id)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.delete("/goals/:id", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const { id } = req.params as { id: string };
    const existing = await db.query.savingsGoals.findFirst({ where: and(eq(goals.id, id), inArray(goals.userId, userIds) as never) });
    if (!existing) return reply.code(404).send({ success: false, error: "Not found" });
    await db.delete(goals).where(eq(goals.id, id));
    return reply.send({ success: true });
  });

  // ── Deposits ──
  app.get("/deposits", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const rows = await db.select().from(deposits).where(inArray(deposits.userId, userIds) as never).orderBy(desc(deposits.createdAt));
    return reply.send({ success: true, data: rows });
  });

  app.post("/deposits", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const [row] = await db.insert(deposits).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as Record<string, unknown>) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  // ── Investments ──
  app.get("/investments", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const rows = await db.select().from(investments).where(inArray(investments.userId, userIds) as never).orderBy(investments.name);
    return reply.send({ success: true, data: rows });
  });

  app.post("/investments", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const [row] = await db.insert(investments).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as Record<string, unknown>) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  // ── Finance Notifications ──
  app.get("/notifications", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { userIds } = await coupleCtx(userId);
    const rows = await db.select().from(financeNotifications).where(inArray(financeNotifications.userId, userIds) as never).orderBy(desc(financeNotifications.createdAt));
    return reply.send({ success: true, data: rows });
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

  app.post("/budget-plans", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { coupleId } = await coupleCtx(userId);
    const [row] = await db.insert(budgetPlans).values({ userId, coupleId: coupleId ?? undefined, ...(req.body as Record<string, unknown>) }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  // ── Insights health-score stub ──
  app.get("/insights", { preHandler: requireAuth }, async (req, reply) => {
    return reply.send({ success: true, data: {} });
  });

  app.get("/insights/health-score", { preHandler: requireAuth }, async (req, reply) => {
    return reply.send({ success: true, data: { score: 0 } });
  });
}
