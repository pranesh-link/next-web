import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import {
  calculateMonthlyCashFlow,
  calculateMonthlyTrends,
  calculateExpenseBreakdown,
  calculateSavingsRate,
  calculateFinancialHealthScore,
  calculateGoalProgress,
} from "@/_services/finance";
import type { TransactionData } from "@/_services/finance";
import type {
  FinancialAccount,
  Transaction,
  Budget,
  Loan,
  SavingsGoal,
} from "@prisma/client";
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
    const accountsP = prisma.financialAccount.findMany({
      where: { userId: { in: coupleUserIds } },
    });
    const allTransactionsP = prisma.transaction.findMany({
      where: { userId: { in: coupleUserIds } },
      orderBy: { date: "desc" as const },
    });
    const currentMonthTxP = prisma.transaction.findMany({
      where: {
        userId: { in: coupleUserIds },
        date: { gte: monthStart, lt: monthEnd },
      },
    });
    const budgetsP = prisma.budget.findMany({
      where: { userId: { in: coupleUserIds }, month },
    });
    const budgetSpentP = prisma.transaction.groupBy({
      by: ["category"] as const,
      where: {
        userId: { in: coupleUserIds },
        type: "EXPENSE" as const,
        date: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    });
    const loansP = prisma.loan.findMany({
      where: { userId: { in: coupleUserIds } },
    });
    const goalsP = prisma.savingsGoal.findMany({
      where: { userId: { in: coupleUserIds } },
    });
    const recentTxP = prisma.transaction.findMany({
      where: { userId: { in: coupleUserIds } },
      orderBy: { date: "desc" as const },
      take: 5,
      include: { account: { select: { name: true } } },
    });

    const accounts: FinancialAccount[] = await accountsP;
    const allTransactions: Transaction[] = await allTransactionsP;
    const currentMonthTransactions: Transaction[] = await currentMonthTxP;
    const budgets: Budget[] = await budgetsP;
    const budgetSpent = await budgetSpentP;
    const loans: Loan[] = await loansP;
    const goals: SavingsGoal[] = await goalsP;
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
      budgetSpent.map(
        (s: { category: string; _sum: { amount: number | null } }) => [
          s.category,
          s._sum.amount ?? 0,
        ],
      ),
    );
    const budgetStatus = budgets.map((budget) => {
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
      count: loans.length,
      totalRemaining: loans.reduce((sum, l) => sum + l.remainingBalance, 0),
      totalEMI: loans.reduce((sum, l) => sum + l.emiAmount, 0),
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

    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalBudgetSpent = budgets.reduce(
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
