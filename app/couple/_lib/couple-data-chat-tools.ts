/**
 * Unified tool registry for "Chat with your Couple data".
 * Combines finance and lifestyle tools — all read-only, all couple-scoped.
 */

import { db } from "@db";
import {
  transactions,
  financialAccounts,
  loans,
  savingsGoals,
  budgets,
  investmentHoldings,
  depositInstruments,
  nutritionLogs,
  exerciseLogs,
  sleepLogs,
  habits,
  habitLogs,
} from "@db/schema";
import { eq, and, inArray, desc, gte, lt, sum, isNotNull } from "drizzle-orm";

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

export const COUPLE_DATA_TOOLS: ToolParam[] = [
  // ── Finance ──────────────────────────────────────────────────────────────────
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
      description:
        "Fetch recent transactions optionally filtered by type (INCOME, EXPENSE, or ALL). Use for salary, income, or spending history queries.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Transaction type filter: INCOME, EXPENSE, or ALL (default ALL)",
          },
          limit: {
            type: "number",
            description: "Number of transactions to return (1-50, default 10)",
          },
        },
      },
    },
  },
  // ── Lifestyle ─────────────────────────────────────────────────────────────────
  {
    type: "function",
    function: {
      name: "getNutritionSummary",
      description:
        "Total calories, protein, carbs, fat averaged over the last N days (default 7). Use for 'how many calories', 'macro breakdown' queries.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of past days (1-30, default 7)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getRecentMeals",
      description:
        "List of recent meal log entries with date, mealType, name, calories. Use for 'what did I eat' queries.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of meals to return (1-50, default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getExerciseSummary",
      description:
        "Total exercise minutes, calories burned, and active days over the last N days (default 7).",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of past days (1-30, default 7)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getRecentWorkouts",
      description:
        "List of recent exercise log entries with date, type, name, duration. Use for 'what did I workout' queries.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of workouts to return (1-30, default 10)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getSleepSummary",
      description:
        "Average sleep duration and quality rating over the last N days (default 7).",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of past days (1-30, default 7)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getHabitCompletion",
      description:
        "Habit completion rates for all active habits over the last N days (default 7). Shows streak and completion percentage.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of past days (1-30, default 7)" },
        },
      },
    },
  },
];

// ─── Human-readable tool labels (used in the UI) ──────────────────────────────

export const COUPLE_DATA_TOOL_LABELS: Record<string, string> = {
  getSpendingByCategory: "Fetching your spending data...",
  getMonthlyTrend: "Analyzing monthly trends...",
  getAccountBalances: "Checking your account balances...",
  getTopMerchants: "Finding your top merchants...",
  getLoanSummary: "Loading your loan summary...",
  getGoalProgress: "Checking your savings goals...",
  getNetWorth: "Calculating your net worth...",
  getBudgetStatus: "Fetching your budget status...",
  getRecentTransactions: "Fetching your recent transactions...",
  getNutritionSummary: "Analyzing your nutrition...",
  getRecentMeals: "Loading your recent meals...",
  getExerciseSummary: "Checking your exercise stats...",
  getRecentWorkouts: "Loading your recent workouts...",
  getSleepSummary: "Analyzing your sleep...",
  getHabitCompletion: "Checking your habit streaks...",
};

// ─── Tool Executors ───────────────────────────────────────────────────────────

export async function executeCoupleDataToolCall(
  name: string,
  args: Record<string, unknown>,
  coupleUserIds: string[]
): Promise<unknown> {
  switch (name) {
    // ── Finance ────────────────────────────────────────────────────────────────

    case "getSpendingByCategory": {
      const month = args.month as string;
      const [y, m] = month.split("-").map(Number);
      const start = new Date(y, m - 1, 1);
      const end = new Date(y, m, 1);
      const rows = await db
        .select({ category: transactions.category, total: sum(transactions.amount) })
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
        .orderBy(desc(sum(transactions.amount)));
      if (rows.length === 0) {
        // Fallback: find the latest month that actually has data
        const latestTx = await db.query.transactions.findFirst({
          where: and(inArray(transactions.userId, coupleUserIds), eq(transactions.type, "EXPENSE")),
          orderBy: [desc(transactions.date)],
          columns: { date: true },
        });
        if (!latestTx) return { note: "No expense transactions found." };
        const ld = latestTx.date;
        const ly = ld.getFullYear();
        const lm = ld.getMonth() + 1;
        const latestMonth = `${ly}-${String(lm).padStart(2, "0")}`;
        const lStart = new Date(ly, lm - 1, 1);
        const lEnd = new Date(ly, lm, 1);
        const fallbackRows = await db
          .select({ category: transactions.category, total: sum(transactions.amount) })
          .from(transactions)
          .where(
            and(
              inArray(transactions.userId, coupleUserIds),
              eq(transactions.type, "EXPENSE"),
              gte(transactions.date, lStart),
              lt(transactions.date, lEnd),
            ),
          )
          .groupBy(transactions.category)
          .orderBy(desc(sum(transactions.amount)));
        return {
          note: `No data for ${month}. Showing latest available month: ${latestMonth}.`,
          data: fallbackRows.map((r) => ({ category: r.category, total: Number(r.total ?? 0) })),
        };
      }
      return rows.map((r) => ({ category: r.category, total: Number(r.total ?? 0) }));
    }

    case "getMonthlyTrend": {
      const months = Math.min(Math.max(Number(args.months) || 6, 1), 12);
      // Anchor to the latest transaction date so old datasets work correctly
      const latestTx = await db.query.transactions.findFirst({
        where: inArray(transactions.userId, coupleUserIds),
        orderBy: [desc(transactions.date)],
        columns: { date: true },
      });
      const anchor = latestTx?.date ?? new Date();
      const startDate = new Date(anchor.getFullYear(), anchor.getMonth() - months + 1, 1);
      const txs = await db.query.transactions.findMany({
        where: and(inArray(transactions.userId, coupleUserIds), gte(transactions.date, startDate)),
        columns: { date: true, type: true, amount: true },
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
      return db.query.financialAccounts.findMany({
        where: inArray(financialAccounts.userId, coupleUserIds),
        columns: { name: true, type: true, balance: true },
        orderBy: [desc(financialAccounts.balance)],
      });

    case "getTopMerchants": {
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 20);
      const rows = await db
        .select({ description: transactions.description, total: sum(transactions.amount) })
        .from(transactions)
        .where(
          and(
            inArray(transactions.userId, coupleUserIds),
            eq(transactions.type, "EXPENSE"),
            isNotNull(transactions.description),
          ),
        )
        .groupBy(transactions.description)
        .orderBy(desc(sum(transactions.amount)))
        .limit(limit);
      return rows.map((r) => ({ merchant: r.description ?? "Unknown", total: Number(r.total ?? 0) }));
    }

    case "getLoanSummary":
      return db.query.loans.findMany({
        where: inArray(loans.userId, coupleUserIds),
        columns: { name: true, remainingBalance: true, emiAmount: true, interestRate: true },
      });

    case "getGoalProgress": {
      const goals = await db.query.savingsGoals.findMany({
        where: inArray(savingsGoals.userId, coupleUserIds),
        columns: { name: true, currentAmount: true, targetAmount: true, deadline: true },
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
      const [accountRows, loanRows, investmentRows, depositRows] = await Promise.all([
        db.query.financialAccounts.findMany({
          where: inArray(financialAccounts.userId, coupleUserIds),
          columns: { balance: true },
        }),
        db.query.loans.findMany({
          where: inArray(loans.userId, coupleUserIds),
          columns: { remainingBalance: true },
        }),
        db.query.investmentHoldings.findMany({
          where: inArray(investmentHoldings.userId, coupleUserIds),
          columns: { currentValue: true },
        }),
        db.query.depositInstruments.findMany({
          where: and(
            inArray(depositInstruments.userId, coupleUserIds),
            eq(depositInstruments.status, "ACTIVE"),
          ),
          columns: { principalAmount: true },
        }),
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
      const [budgetRows, spentRows] = await Promise.all([
        db.query.budgets.findMany({
          where: and(inArray(budgets.userId, coupleUserIds), eq(budgets.month, month)),
          columns: { category: true, limit: true },
        }),
        db
          .select({ category: transactions.category, total: sum(transactions.amount) })
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
      const spentMap = Object.fromEntries(spentRows.map((s) => [s.category, Number(s.total ?? 0)]));
      return budgetRows.map((b) => ({
        category: b.category,
        limit: b.limit,
        spent: spentMap[b.category] ?? 0,
        overBudget: (spentMap[b.category] ?? 0) > b.limit,
      }));
    }

    case "getRecentTransactions": {
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50);
      const typeFilter = (args.type as string | undefined)?.toUpperCase();
      const baseWhere = inArray(transactions.userId, coupleUserIds);
      const typeWhere =
        typeFilter && typeFilter !== "ALL"
          ? eq(transactions.type, typeFilter as "INCOME" | "EXPENSE")
          : undefined;
      const txs = await db.query.transactions.findMany({
        where: typeWhere ? and(baseWhere, typeWhere) : baseWhere,
        orderBy: [desc(transactions.date)],
        limit,
        columns: { date: true, type: true, amount: true, category: true, description: true },
      });
      return txs.map((t) => ({
        date: t.date.toISOString().split("T")[0],
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description ?? null,
      }));
    }

    // ── Lifestyle ──────────────────────────────────────────────────────────────

    case "getNutritionSummary": {
      const days = Math.min(Math.max(Number(args.days) || 7, 1), 30);
      const since = new Date();
      since.setDate(since.getDate() - days);
      const logs = await db.query.nutritionLogs.findMany({
        where: and(
          inArray(nutritionLogs.userId, coupleUserIds),
          gte(nutritionLogs.loggedOn, since.toISOString().split("T")[0]),
        ),
        columns: { calories: true, proteinG: true, carbsG: true, fatG: true, loggedOn: true },
      });
      if (logs.length === 0) return { note: "No nutrition logs found for this period." };
      const totals = logs.reduce(
        (a, l) => ({
          calories: a.calories + l.calories,
          proteinG: a.proteinG + l.proteinG,
          carbsG: a.carbsG + l.carbsG,
          fatG: a.fatG + l.fatG,
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
      );
      return {
        days,
        totalEntries: logs.length,
        avgDailyCalories: Math.round(totals.calories / days),
        avgProteinG: Math.round(totals.proteinG / days),
        avgCarbsG: Math.round(totals.carbsG / days),
        avgFatG: Math.round(totals.fatG / days),
      };
    }

    case "getRecentMeals": {
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50);
      const meals = await db.query.nutritionLogs.findMany({
        where: inArray(nutritionLogs.userId, coupleUserIds),
        orderBy: [desc(nutritionLogs.loggedOn)],
        limit,
        columns: { loggedOn: true, mealType: true, name: true, calories: true, proteinG: true },
      });
      return meals.map((m) => ({
        date: typeof m.loggedOn === 'string' ? m.loggedOn.split('T')[0] : (m.loggedOn as Date).toISOString().split('T')[0],
        mealType: m.mealType,
        name: m.name,
        calories: m.calories,
        proteinG: m.proteinG,
      }));
    }

    case "getExerciseSummary": {
      const days = Math.min(Math.max(Number(args.days) || 7, 1), 30);
      const since = new Date();
      since.setDate(since.getDate() - days);
      const logs = await db.query.exerciseLogs.findMany({
        where: and(
          inArray(exerciseLogs.userId, coupleUserIds),
          gte(exerciseLogs.loggedOn, since.toISOString().split("T")[0]),
        ),
        columns: { durationMins: true, caloriesBurned: true, loggedOn: true },
      });
      if (logs.length === 0) return { note: "No exercise logs found for this period." };
      const uniqueDays = new Set(logs.map((l) => typeof l.loggedOn === 'string' ? l.loggedOn.split('T')[0] : (l.loggedOn as Date).toISOString().split('T')[0])).size;
      return {
        days,
        daysActive: uniqueDays,
        totalMins: logs.reduce((s, l) => s + l.durationMins, 0),
        totalCaloriesBurned: logs.reduce((s, l) => s + (l.caloriesBurned ?? 0), 0),
      };
    }

    case "getRecentWorkouts": {
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 30);
      const workouts = await db.query.exerciseLogs.findMany({
        where: inArray(exerciseLogs.userId, coupleUserIds),
        orderBy: [desc(exerciseLogs.loggedOn)],
        limit,
        columns: { loggedOn: true, type: true, name: true, durationMins: true, caloriesBurned: true },
      });
      return workouts.map((w) => ({
        date: w.loggedOn,
        type: w.type,
        name: w.name,
        durationMins: w.durationMins,
        caloriesBurned: w.caloriesBurned ?? null,
      }));
    }

    case "getSleepSummary": {
      const days = Math.min(Math.max(Number(args.days) || 7, 1), 30);
      const since = new Date();
      since.setDate(since.getDate() - days);
      const logs = await db.query.sleepLogs.findMany({
        where: and(
          inArray(sleepLogs.userId, coupleUserIds),
          gte(sleepLogs.date, since.toISOString().split("T")[0]),
        ),
        columns: { durationMins: true, quality: true },
      });
      if (logs.length === 0) return { note: "No sleep logs found for this period." };
      const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      return {
        days,
        entriesLogged: logs.length,
        avgDurationMins: avg(logs.map((l) => l.durationMins)),
        avgDurationHrs: Math.round((avg(logs.map((l) => l.durationMins)) / 60) * 10) / 10,
        avgQuality: Math.round((avg(logs.map((l) => l.quality)) / 5) * 100),
      };
    }

    case "getHabitCompletion": {
      const days = Math.min(Math.max(Number(args.days) || 7, 1), 30);
      const since = new Date();
      since.setDate(since.getDate() - days);
      const habitRows = await db.query.habits.findMany({
        where: and(inArray(habits.userId, coupleUserIds), eq(habits.isActive, true)),
        columns: { id: true, name: true, targetDays: true },
      });
      if (habitRows.length === 0) return [];
      const habitIds = habitRows.map((h) => h.id);
      const completedLogs = await db.query.habitLogs.findMany({
        where: and(
          inArray(habitLogs.habitId, habitIds),
          gte(habitLogs.loggedOn, since.toISOString().split("T")[0]),
          eq(habitLogs.completed, true),
        ),
        columns: { habitId: true },
      });
      const logCountByHabit = new Map<string, number>();
      for (const log of completedLogs) {
        logCountByHabit.set(log.habitId, (logCountByHabit.get(log.habitId) ?? 0) + 1);
      }
      return habitRows.map((h) => ({
        name: h.name,
        targetDaysPerWeek: h.targetDays,
        completedDays: logCountByHabit.get(h.id) ?? 0,
        completionPct: Math.round(((logCountByHabit.get(h.id) ?? 0) / days) * 100),
      }));
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
