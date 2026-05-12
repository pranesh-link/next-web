/**
 * Finance AI chat — tool definitions and executors.
 * Uses the OpenAI function-calling format directly (no ai-sdk dependency).
 * All Prisma queries are read-only and scoped to couple member IDs.
 */

import { prisma } from "@/_lib/prisma";

// ─── Minimal types for OpenAI tool format ────────────────────────────────────

export type ToolParam = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string }>;
      required?: string[];
    };
  };
};

// ─── Tool Definitions ─────────────────────────────────────────────────────────

export const FINANCE_TOOLS: ToolParam[] = [
  {
    type: "function",
    function: {
      name: "getSpendingByCategory",
      description:
        "Sum of expenses grouped by category for a given month. Use for 'how much did I spend on X?' queries.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "string", description: "Month in YYYY-MM format, e.g. 2026-05" },
        },
        required: ["month"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getMonthlyTrend",
      description: "Monthly income vs expense totals for the last N months (max 12).",
      parameters: {
        type: "object",
        properties: {
          months: { type: "number", description: "Number of past months to include (1-12)" },
        },
        required: ["months"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAccountBalances",
      description: "All financial account names, types, and current balances.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getTopMerchants",
      description: "Top N merchants by total spend derived from transaction descriptions.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of top merchants to return (1-20)" },
        },
        required: ["limit"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getLoanSummary",
      description: "All loans with remaining balance, monthly EMI, and interest rate.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getGoalProgress",
      description:
        "All savings goals with current amount vs target and completion percentage.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getNetWorth",
      description:
        "Net worth: total assets (accounts + investments + deposits) minus liabilities (loans).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "getBudgetStatus",
      description: "Budget limits vs actual spend per category for a given month.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "string", description: "Month in YYYY-MM format" },
        },
        required: ["month"],
      },
    },
  },
];

// ─── Human-readable tool labels (used in the UI) ──────────────────────────────

export const TOOL_LABELS: Record<string, string> = {
  getSpendingByCategory: "Fetching your spending data...",
  getMonthlyTrend: "Analyzing monthly trends...",
  getAccountBalances: "Checking your account balances...",
  getTopMerchants: "Finding your top merchants...",
  getLoanSummary: "Loading your loan summary...",
  getGoalProgress: "Checking your savings goals...",
  getNetWorth: "Calculating your net worth...",
  getBudgetStatus: "Fetching your budget status...",
};

// ─── Tool Executors ───────────────────────────────────────────────────────────

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
  coupleUserIds: string[]
): Promise<unknown> {
  switch (name) {
    case "getSpendingByCategory": {
      const month = args.month as string;
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      const rows = await prisma.transaction.groupBy({
        by: ["category"],
        where: { userId: { in: coupleUserIds }, type: "EXPENSE", date: { gte: start, lt: end } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      });
      return rows.map((r) => ({ category: r.category, total: r._sum.amount ?? 0 }));
    }

    case "getMonthlyTrend": {
      const months = Math.min(Math.max(Number(args.months) || 6, 1), 12);
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
      const txs = await prisma.transaction.findMany({
        where: { userId: { in: coupleUserIds }, date: { gte: startDate } },
        select: { date: true, type: true, amount: true },
      });
      const map: Record<string, { income: number; expense: number }> = {};
      for (const tx of txs) {
        const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, "0")}`;
        if (!map[key]) map[key] = { income: 0, expense: 0 };
        if (tx.type === "INCOME") map[key].income += tx.amount;
        else map[key].expense += tx.amount;
      }
      return Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, ...v }));
    }

    case "getAccountBalances":
      return prisma.financialAccount.findMany({
        where: { userId: { in: coupleUserIds } },
        select: { name: true, type: true, balance: true },
        orderBy: { balance: "desc" },
      });

    case "getTopMerchants": {
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);
      const rows = await prisma.transaction.groupBy({
        by: ["description"],
        where: { userId: { in: coupleUserIds }, type: "EXPENSE", description: { not: null } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: limit,
      });
      return rows.map((r) => ({ merchant: r.description ?? "Unknown", total: r._sum.amount ?? 0 }));
    }

    case "getLoanSummary":
      return prisma.loan.findMany({
        where: { userId: { in: coupleUserIds } },
        select: { name: true, remainingBalance: true, emiAmount: true, interestRate: true },
      });

    case "getGoalProgress": {
      const goals = await prisma.savingsGoal.findMany({
        where: { userId: { in: coupleUserIds } },
        select: { name: true, currentAmount: true, targetAmount: true, deadline: true },
      });
      return goals.map((g) => ({
        name: g.name,
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount,
        progressPct: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
        deadline: g.deadline?.toISOString().split("T")[0] ?? null,
      }));
    }

    case "getNetWorth": {
      const [accounts, loans, investments, deposits] = await Promise.all([
        prisma.financialAccount.findMany({
          where: { userId: { in: coupleUserIds } },
          select: { balance: true },
        }),
        prisma.loan.findMany({
          where: { userId: { in: coupleUserIds } },
          select: { remainingBalance: true },
        }),
        prisma.investmentHolding.findMany({
          where: { userId: { in: coupleUserIds } },
          select: { currentValue: true },
        }),
        prisma.depositInstrument.findMany({
          where: { userId: { in: coupleUserIds }, status: "ACTIVE" },
          select: { principalAmount: true },
        }),
      ]);
      const totalAccounts = accounts.reduce((s, a) => s + a.balance, 0);
      const totalInvestments = investments.reduce((s, i) => s + (i.currentValue ?? 0), 0);
      const totalDeposits = deposits.reduce((s, d) => s + d.principalAmount, 0);
      const totalLiabilities = loans.reduce((s, l) => s + l.remainingBalance, 0);
      const totalAssets = totalAccounts + totalInvestments + totalDeposits;
      return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
    }

    case "getBudgetStatus": {
      const month = args.month as string;
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      const [budgets, spent] = await Promise.all([
        prisma.budget.findMany({
          where: { userId: { in: coupleUserIds }, month },
          select: { category: true, limit: true },
        }),
        prisma.transaction.groupBy({
          by: ["category"],
          where: { userId: { in: coupleUserIds }, type: "EXPENSE", date: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
      ]);
      const spentMap = Object.fromEntries(spent.map((s) => [s.category, s._sum.amount ?? 0]));
      return budgets.map((b) => ({
        category: b.category,
        limit: b.limit,
        spent: spentMap[b.category] ?? 0,
        overBudget: (spentMap[b.category] ?? 0) > b.limit,
      }));
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
