/**
 * Finance AI chat — tool definitions and executors.
 * Uses the OpenAI function-calling format directly (no ai-sdk dependency).
 * All Drizzle queries are read-only and scoped to couple member IDs.
 */

import { db } from "@db";
import {
  transactions,
  financialAccounts,
  loans,
  savingsGoals,
  investmentHoldings,
  depositInstruments,
  budgets,
} from "@db/schema";
import { and, inArray, eq, gte, lt, desc, sql } from "drizzle-orm";

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
  {
    type: "function",
    function: {
      name: "getRecentTransactions",
      description: "Fetch recent transactions for the couple, optionally filtered by type (INCOME, EXPENSE, or ALL). Returns date, amount, category, description, and type. Use for salary queries, recent spending, or income history.",
      parameters: {
        type: "object",
        properties: {
          type: { type: "string", description: "Filter by transaction type: INCOME, EXPENSE, or ALL (default ALL)" },
          limit: { type: "number", description: "Number of transactions to return (1-50, default 20)" },
        },
        required: [],
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
  getRecentTransactions: "Fetching your recent transactions...",
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
      const rows = await db
        .select({
          category: transactions.category,
          total: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .where(
          and(
            inArray(transactions.userId, coupleUserIds),
            eq(transactions.type, "EXPENSE"),
            gte(transactions.date, start),
            lt(transactions.date, end),
          ),
        )
        .groupBy(transactions.category)
        .orderBy(desc(sql`sum(${transactions.amount})`));
      if (rows.length > 0) {
        return rows.map((r) => ({ category: r.category, total: r.total ?? 0 }));
      }
      // No data for requested month — find the most recent month that has data
      const latestTx = await db.query.transactions.findFirst({
        where: and(inArray(transactions.userId, coupleUserIds), eq(transactions.type, "EXPENSE")),
        orderBy: [desc(transactions.date)],
        columns: { date: true },
      });
      if (!latestTx) return [];
      const ly = new Date(latestTx.date as string).getFullYear();
      const lm = new Date(latestTx.date as string).getMonth();
      const fallbackStart = new Date(ly, lm, 1);
      const fallbackEnd = new Date(ly, lm + 1, 1);
      const fallbackRows = await db
        .select({
          category: transactions.category,
          total: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .where(
          and(
            inArray(transactions.userId, coupleUserIds),
            eq(transactions.type, "EXPENSE"),
            gte(transactions.date, fallbackStart),
            lt(transactions.date, fallbackEnd),
          ),
        )
        .groupBy(transactions.category)
        .orderBy(desc(sql`sum(${transactions.amount})`));
      const fallbackMonth = `${ly}-${String(lm + 1).padStart(2, "0")}`;
      return { note: `No data for ${month}. Showing ${fallbackMonth} instead.`, data: fallbackRows.map((r) => ({ category: r.category, total: r.total ?? 0 })) };
    }

    case "getMonthlyTrend": {
      const months = Math.min(Math.max(Number(args.months) || 6, 1), 12);
      // Anchor to the most recent transaction date so historical data is never missed
      const latestTx = await db.query.transactions.findFirst({
        where: inArray(transactions.userId, coupleUserIds),
        orderBy: [desc(transactions.date)],
        columns: { date: true },
      });
      const anchor = latestTx?.date ?? new Date();
      const endDate = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
      const startDate = new Date(anchor.getFullYear(), anchor.getMonth() - months + 1, 1);
      const txs = await db
        .select({
          date: transactions.date,
          type: transactions.type,
          amount: transactions.amount,
        })
        .from(transactions)
        .where(
          and(
            inArray(transactions.userId, coupleUserIds),
            gte(transactions.date, startDate),
            lt(transactions.date, endDate),
          ),
        );
      const map: Record<string, { income: number; expense: number }> = {};
      for (const tx of txs) {
        const key = `${new Date(tx.date as string).getFullYear()}-${String(new Date(tx.date as string).getMonth() + 1).padStart(2, "0")}`;
        if (!map[key]) map[key] = { income: 0, expense: 0 };
        if (tx.type === "INCOME") map[key].income += tx.amount;
        else map[key].expense += tx.amount;
      }
      return Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, v]) => ({ month, ...v }));
    }

    case "getAccountBalances":
      return db
        .select({ name: financialAccounts.name, type: financialAccounts.type, balance: financialAccounts.balance })
        .from(financialAccounts)
        .where(inArray(financialAccounts.userId, coupleUserIds))
        .orderBy(desc(financialAccounts.balance));

    case "getTopMerchants": {
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);
      const rows = await db
        .select({
          description: transactions.description,
          total: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .where(
          and(
            inArray(transactions.userId, coupleUserIds),
            eq(transactions.type, "EXPENSE"),
            sql`${transactions.description} is not null`,
          ),
        )
        .groupBy(transactions.description)
        .orderBy(desc(sql`sum(${transactions.amount})`))
        .limit(limit);
      return rows.map((r) => ({ merchant: r.description ?? "Unknown", total: r.total ?? 0 }));
    }

    case "getLoanSummary":
      return db
        .select({
          name: loans.name,
          remainingBalance: loans.remainingBalance,
          emiAmount: loans.emiAmount,
          interestRate: loans.interestRate,
        })
        .from(loans)
        .where(inArray(loans.userId, coupleUserIds));

    case "getGoalProgress": {
      const goals = await db
        .select({
          name: savingsGoals.name,
          currentAmount: savingsGoals.currentAmount,
          targetAmount: savingsGoals.targetAmount,
          deadline: savingsGoals.deadline,
        })
        .from(savingsGoals)
        .where(inArray(savingsGoals.userId, coupleUserIds));
      return goals.map((g) => ({
        name: g.name,
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount,
        progressPct: g.targetAmount > 0 ? Math.round((g.currentAmount / g.targetAmount) * 100) : 0,
        deadline: g.deadline?.toISOString().split("T")[0] ?? null,
      }));
    }

    case "getNetWorth": {
      const [accountRows, loanRows, investmentRows, depositRows] = await Promise.all([
        db.select({ balance: financialAccounts.balance }).from(financialAccounts).where(inArray(financialAccounts.userId, coupleUserIds)),
        db.select({ remainingBalance: loans.remainingBalance }).from(loans).where(inArray(loans.userId, coupleUserIds)),
        db.select({ currentValue: investmentHoldings.currentValue }).from(investmentHoldings).where(inArray(investmentHoldings.userId, coupleUserIds)),
        db
          .select({ principalAmount: depositInstruments.principalAmount })
          .from(depositInstruments)
          .where(and(inArray(depositInstruments.userId, coupleUserIds), eq(depositInstruments.status, "ACTIVE"))),
      ]);
      const totalAccounts = accountRows.reduce((s, a) => s + a.balance, 0);
      const totalInvestments = investmentRows.reduce((s, i) => s + (i.currentValue ?? 0), 0);
      const totalDeposits = depositRows.reduce((s, d) => s + d.principalAmount, 0);
      const totalLiabilities = loanRows.reduce((s, l) => s + l.remainingBalance, 0);
      const totalAssets = totalAccounts + totalInvestments + totalDeposits;
      return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities };
    }

    case "getBudgetStatus": {
      const month = args.month as string;
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      const [budgetRows, spent] = await Promise.all([
        db
          .select({ category: budgets.category, limit: budgets.limit })
          .from(budgets)
          .where(and(inArray(budgets.userId, coupleUserIds), eq(budgets.month, month))),
        db
          .select({
            category: transactions.category,
            total: sql<number>`sum(${transactions.amount})`,
          })
          .from(transactions)
          .where(
            and(
              inArray(transactions.userId, coupleUserIds),
              eq(transactions.type, "EXPENSE"),
              gte(transactions.date, start),
              lt(transactions.date, end),
            ),
          )
          .groupBy(transactions.category),
      ]);
      const spentMap = Object.fromEntries(spent.map((s) => [s.category, s.total ?? 0]));
      return budgetRows.map((b) => ({
        category: b.category,
        limit: b.limit,
        spent: spentMap[b.category] ?? 0,
        overBudget: (spentMap[b.category] ?? 0) > b.limit,
      }));
    }

    case "getRecentTransactions": {
      const txType = (args.type as string | undefined)?.toUpperCase();
      const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
      const txs = await db
        .select({
          date: transactions.date,
          amount: transactions.amount,
          type: transactions.type,
          category: transactions.category,
          description: transactions.description,
        })
        .from(transactions)
        .where(
          and(
            inArray(transactions.userId, coupleUserIds),
            ...(txType === "INCOME" || txType === "EXPENSE"
              ? [eq(transactions.type, txType as "INCOME" | "EXPENSE")]
              : []),
          ),
        )
        .orderBy(desc(transactions.date))
        .limit(limit);
      return txs.map((t) => ({
        date: String(t.date).split("T")[0],
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description ?? null,
      }));
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
