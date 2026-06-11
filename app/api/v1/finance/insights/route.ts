import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { financialAccounts, transactions, budgets, loans, savingsGoals } from "@db/schema";
import { and, inArray, eq, gte, lt, desc, sql } from "drizzle-orm";
import {
  calculateMonthlyCashFlow,
  calculateMonthlyTrends,
  calculateExpenseBreakdown,
  calculateSavingsRate,
  calculateFinancialHealthScore,
  calculateGoalProgress,
} from "@/_services/finance";
import type { TransactionData } from "@/_services/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { withCache } from "@/_lib/middleware/cache";
import { withRateLimit } from "@/_lib/middleware/rate-limit";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function OPTIONS() {
  return handleOptions();
}

async function getHandler() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleUserIds = await getUserIdsForCouple(userId);

    const month = currentMonth();
    const [year, m] = month.split("-").map(Number);
    const monthStart = new Date(year, m - 1, 1);
    const monthEnd = new Date(year, m, 1);

    // Fire all queries in parallel
    const accountsP = db.query.financialAccounts.findMany({
      where: inArray(financialAccounts.userId, coupleUserIds),
    });
    const allTransactionsP = db.query.transactions.findMany({
      where: inArray(transactions.userId, coupleUserIds),
      orderBy: (t, { desc: d }) => [d(t.date)],
    });
    const currentMonthTxP = db.query.transactions.findMany({
      where: and(
        inArray(transactions.userId, coupleUserIds),
        gte(transactions.date, monthStart),
        lt(transactions.date, monthEnd),
      ),
    });
    const budgetsP = db.query.budgets.findMany({
      where: and(inArray(budgets.userId, coupleUserIds), eq(budgets.month, month)),
    });
    const budgetSpentP = db
      .select({
        category: transactions.category,
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(
        and(
          inArray(transactions.userId, coupleUserIds),
          eq(transactions.type, "EXPENSE"),
          gte(transactions.date, monthStart),
          lt(transactions.date, monthEnd),
        ),
      )
      .groupBy(transactions.category);
    const loansP = db.query.loans.findMany({
      where: inArray(loans.userId, coupleUserIds),
    });
    const goalsP = db.query.savingsGoals.findMany({
      where: inArray(savingsGoals.userId, coupleUserIds),
    });
    const recentTxP = db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        accountId: transactions.accountId,
        amount: transactions.amount,
        type: transactions.type,
        category: transactions.category,
        description: transactions.description,
        receiptSource: transactions.receiptSource,
        date: transactions.date,
        coupleId: transactions.coupleId,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        account: { name: financialAccounts.name },
      })
      .from(transactions)
      .leftJoin(financialAccounts, eq(transactions.accountId, financialAccounts.id))
      .where(inArray(transactions.userId, coupleUserIds))
      .orderBy(desc(transactions.date))
      .limit(5);

    const accounts = await accountsP;
    const allTransactions = await allTransactionsP;
    const currentMonthTransactions = await currentMonthTxP;
    const budgetRows = await budgetsP;
    const budgetSpent = await budgetSpentP;
    const loanRows = await loansP;
    const goals = await goalsP;
    const recentTransactions = await recentTxP;

    // 1. Total balance
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    // 2. Current month cash flow
    const txData: TransactionData[] = currentMonthTransactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
      description: t.description ?? undefined,
    }));
    const cashFlow = calculateMonthlyCashFlow(txData, month);

    // 3. Savings rate
    const savingsRate = calculateSavingsRate(cashFlow.income, cashFlow.expenses);

    // 4. Expense breakdown
    const expenseBreakdown = calculateExpenseBreakdown(txData);

    // 5. Budget status
    const spentMap = new Map<string, number>(
      budgetSpent.map((s) => [s.category, s.total ?? 0]),
    );
    const budgetStatus = budgetRows.map((budget) => {
      const spent = spentMap.get(budget.category) ?? 0;
      return {
        budget,
        spent,
        remaining: budget.limit - spent,
        exceeded: spent > budget.limit,
      };
    });

    // 6. Loans summary
    const loansSummary = {
      count: loanRows.length,
      totalRemaining: loanRows.reduce((sum, l) => sum + l.remainingBalance, 0),
      totalEMI: loanRows.reduce((sum, l) => sum + l.emiAmount, 0),
    };

    // 7. Goals summary
    const goalsWithProgress = goals.map((g) => ({
      ...g,
      progress: calculateGoalProgress({
        id: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        deadline: g.deadline ?? undefined,
      }),
    }));
    const goalsSummary = {
      count: goals.length,
      totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
      totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
    };

    // 8. Financial health score
    const totalMonthlyEMI = loansSummary.totalEMI;
    const monthlyIncome = cashFlow.income || 1;
    const debtToIncomeRatio = (totalMonthlyEMI / monthlyIncome) * 100;
    const emergencyFundMonths =
      cashFlow.expenses > 0 ? totalBalance / cashFlow.expenses : 0;

    const totalBudgetLimit = budgetRows.reduce((sum, b) => sum + b.limit, 0);
    const totalBudgetSpent = budgetRows.reduce(
      (sum, b) => sum + (spentMap.get(b.category) ?? 0),
      0,
    );
    const budgetAdherence =
      totalBudgetLimit > 0
        ? Math.max(
            0,
            100 -
              ((totalBudgetSpent - totalBudgetLimit) / totalBudgetLimit) * 100,
          )
        : 100;

    const healthScore = calculateFinancialHealthScore({
      savingsRate,
      debtToIncomeRatio,
      emergencyFundMonths,
      budgetAdherence: Math.min(budgetAdherence, 100),
    });

    // 9. Monthly trends (last 6 months)
    const allTxData: TransactionData[] = allTransactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
      description: t.description ?? undefined,
    }));
    const monthlyTrends = calculateMonthlyTrends(allTxData, 6);

    return NextResponse.json(
      {
        success: true,
        data: {
          totalBalance,
          cashFlow,
          savingsRate,
          expenseBreakdown,
          budgetStatus,
          loansSummary,
          goalsSummary,
          goalsWithProgress,
          healthScore,
          monthlyTrends,
          recentTransactions,
        },
      },
      { headers: corsHeaders("private, max-age=60") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get dashboard insights",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const GET = withRateLimit(
  withCache(getHandler, { ttl: 900, keyPrefix: 'finance:insights' }),
  { max: 100, window: 60 }
);
