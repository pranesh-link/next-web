/**
 * Unified tool registry for "Chat with your Couple data".
 * Combines finance and lifestyle tools — all read-only, all couple-scoped.
 */

import { prisma } from "@/_lib/prisma";

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
      const rows = await prisma.transaction.groupBy({
        by: ["category"],
        where: { userId: { in: coupleUserIds }, type: "EXPENSE", date: { gte: start, lt: end } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      });
      if (rows.length === 0) {
        // Fallback: find the latest month that actually has data
        const latestTx = await prisma.transaction.findFirst({
          where: { userId: { in: coupleUserIds }, type: "EXPENSE" },
          orderBy: { date: "desc" },
          select: { date: true },
        });
        if (!latestTx) return { note: "No expense transactions found." };
        const ld = latestTx.date;
        const ly = ld.getFullYear();
        const lm = ld.getMonth() + 1;
        const latestMonth = `${ly}-${String(lm).padStart(2, "0")}`;
        const lStart = new Date(ly, lm - 1, 1);
        const lEnd = new Date(ly, lm, 1);
        const fallbackRows = await prisma.transaction.groupBy({
          by: ["category"],
          where: { userId: { in: coupleUserIds }, type: "EXPENSE", date: { gte: lStart, lt: lEnd } },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
        });
        return {
          note: `No data for ${month}. Showing latest available month: ${latestMonth}.`,
          data: fallbackRows.map((r) => ({ category: r.category, total: r._sum.amount ?? 0 })),
        };
      }
      return rows.map((r) => ({ category: r.category, total: r._sum.amount ?? 0 }));
    }

    case "getMonthlyTrend": {
      const months = Math.min(Math.max(Number(args.months) || 6, 1), 12);
      // Anchor to the latest transaction date so old datasets work correctly
      const latestTx = await prisma.transaction.findFirst({
        where: { userId: { in: coupleUserIds } },
        orderBy: { date: "desc" },
        select: { date: true },
      });
      const anchor = latestTx?.date ?? new Date();
      const startDate = new Date(anchor.getFullYear(), anchor.getMonth() - months + 1, 1);
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

    case "getRecentTransactions": {
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50);
      const typeFilter = (args.type as string | undefined)?.toUpperCase();
      const txs = await prisma.transaction.findMany({
        where: {
          userId: { in: coupleUserIds },
          ...(typeFilter && typeFilter !== "ALL" ? { type: typeFilter as "INCOME" | "EXPENSE" } : {}),
        },
        orderBy: { date: "desc" },
        take: limit,
        select: { date: true, type: true, amount: true, category: true, description: true },
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
      const logs = await prisma.nutritionLog.findMany({
        where: { userId: { in: coupleUserIds }, loggedOn: { gte: since } },
        select: { calories: true, proteinG: true, carbsG: true, fatG: true, loggedOn: true },
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
      const meals = await prisma.nutritionLog.findMany({
        where: { userId: { in: coupleUserIds } },
        orderBy: { loggedOn: "desc" },
        take: limit,
        select: { loggedOn: true, mealType: true, name: true, calories: true, proteinG: true },
      });
      return meals.map((m) => ({
        date: m.loggedOn.toISOString().split("T")[0],
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
      const logs = await prisma.exerciseLog.findMany({
        where: { userId: { in: coupleUserIds }, loggedOn: { gte: since } },
        select: { durationMins: true, caloriesBurned: true, loggedOn: true },
      });
      if (logs.length === 0) return { note: "No exercise logs found for this period." };
      const uniqueDays = new Set(logs.map((l) => l.loggedOn.toISOString().split("T")[0])).size;
      return {
        days,
        daysActive: uniqueDays,
        totalMins: logs.reduce((s, l) => s + l.durationMins, 0),
        totalCaloriesBurned: logs.reduce((s, l) => s + (l.caloriesBurned ?? 0), 0),
      };
    }

    case "getRecentWorkouts": {
      const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 30);
      const workouts = await prisma.exerciseLog.findMany({
        where: { userId: { in: coupleUserIds } },
        orderBy: { loggedOn: "desc" },
        take: limit,
        select: { loggedOn: true, type: true, name: true, durationMins: true, caloriesBurned: true },
      });
      return workouts.map((w) => ({
        date: w.loggedOn.toISOString().split("T")[0],
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
      const logs = await prisma.sleepLog.findMany({
        where: { userId: { in: coupleUserIds }, date: { gte: since } },
        select: { durationMins: true, quality: true },
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
      const habits = await prisma.habit.findMany({
        where: { userId: { in: coupleUserIds }, isActive: true },
        select: {
          id: true,
          name: true,
          targetDays: true,
          logs: {
            where: { loggedOn: { gte: since }, completed: true },
            select: { loggedOn: true },
          },
        },
      });
      return habits.map((h) => ({
        name: h.name,
        targetDaysPerWeek: h.targetDays,
        completedDays: h.logs.length,
        completionPct: Math.round((h.logs.length / days) * 100),
      }));
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
