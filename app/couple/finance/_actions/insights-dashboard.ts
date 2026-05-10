"use server";

import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
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
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/_lib/cache";
import { currentMonth } from "./insights-helpers";

const fetchDashboardData = unstable_cache(
  async (coupleUserIds: string[]) => {
    const month = currentMonth();
    const [year, m] = month.split("-").map(Number);
    const monthStart = new Date(year, m - 1, 1);
    const monthEnd = new Date(year, m, 1);

    const accountsP = prisma.financialAccount.findMany({ where: { userId: { in: coupleUserIds } } });
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
    const budgetsP = prisma.budget.findMany({ where: { userId: { in: coupleUserIds }, month } });
    const budgetSpentP = prisma.transaction.groupBy({
      by: ["category"] as const,
      where: {
        userId: { in: coupleUserIds },
        type: "EXPENSE" as const,
        date: { gte: monthStart, lt: monthEnd },
      },
      _sum: { amount: true },
    });
    const loansP = prisma.loan.findMany({ where: { userId: { in: coupleUserIds } } });
    const goalsP = prisma.savingsGoal.findMany({ where: { userId: { in: coupleUserIds } } });
    const investmentsP = prisma.investmentHolding.findMany({
      where: { userId: { in: coupleUserIds } },
      select: { id: true, investedAmount: true, currentValue: true },
    });
    const depositsP = prisma.depositInstrument.findMany({
      where: { userId: { in: coupleUserIds } },
      select: { id: true, status: true, principalAmount: true, maturityAmount: true },
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
    const investments = await investmentsP;
    const deposits = await depositsP;
    const recentTransactions = await recentTxP;

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    const txData: TransactionData[] = currentMonthTransactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
      description: t.description ?? undefined,
    }));
    const cashFlow = calculateMonthlyCashFlow(txData, month);
    const savingsRate = calculateSavingsRate(cashFlow.income, cashFlow.expenses);
    const expenseBreakdown = calculateExpenseBreakdown(txData);

    const spentMap = new Map<string, number>(
      budgetSpent.map((s: { category: string; _sum: { amount: number | null } }) => [s.category, s._sum.amount ?? 0]),
    );
    const budgetStatus = budgets.map((budget) => {
      const spent = spentMap.get(budget.category) ?? 0;
      return { budget, spent, remaining: budget.limit - spent, exceeded: spent > budget.limit };
    });

    const loansSummary = {
      count: loans.length,
      totalRemaining: loans.reduce((sum, l) => sum + l.remainingBalance, 0),
      totalEMI: loans.reduce((sum, l) => {
        const schedule = Array.isArray(l.schedule) ? (l.schedule as { date: string; emi: number }[]) : null;
        if (schedule && schedule.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const nextEntry = schedule.find((e) => {
            const d = new Date(e.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() >= today.getTime();
          });
          return sum + (nextEntry ? nextEntry.emi : l.emiAmount);
        }
        return sum + l.emiAmount;
      }, 0),
    };

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

    const investmentsSummary = {
      count: investments.length,
      totalInvested: investments.reduce((sum, item) => sum + item.investedAmount, 0),
      currentValue: investments.reduce(
        (sum, item) => sum + (item.currentValue ?? item.investedAmount),
        0,
      ),
    };

    const activeDeposits = deposits.filter((item) => item.status === "ACTIVE");
    const depositsSummary = {
      count: deposits.length,
      activeCount: activeDeposits.length,
      totalPrincipal: activeDeposits.reduce((sum, item) => sum + item.principalAmount, 0),
      totalMaturity: activeDeposits.reduce((sum, item) => sum + item.maturityAmount, 0),
    };

    const totalMonthlyEMI = loansSummary.totalEMI;
    const monthlyIncome = cashFlow.income || 1;
    const debtToIncomeRatio = (totalMonthlyEMI / monthlyIncome) * 100;
    const emergencyFundMonths = cashFlow.expenses > 0 ? totalBalance / cashFlow.expenses : 0;

    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
    const totalBudgetSpent = budgets.reduce(
      (sum, b) => sum + (spentMap.get(b.category) ?? 0),
      0,
    );
    const budgetAdherence =
      totalBudgetLimit > 0
        ? Math.max(0, 100 - ((totalBudgetSpent - totalBudgetLimit) / totalBudgetLimit) * 100)
        : 100;

    const healthScore = calculateFinancialHealthScore({
      savingsRate,
      debtToIncomeRatio,
      emergencyFundMonths,
      budgetAdherence: Math.min(budgetAdherence, 100),
    });

    const allTxData: TransactionData[] = allTransactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
      description: t.description ?? undefined,
    }));
    const monthlyTrends = calculateMonthlyTrends(allTxData, 6);

    return {
      totalBalance,
      cashFlow,
      savingsRate,
      expenseBreakdown,
      budgetStatus,
      loansSummary,
      goalsSummary,
      goalsWithProgress,
      investmentsSummary,
      depositsSummary,
      healthScore,
      monthlyTrends,
      recentTransactions,
    };
  },
  ["dashboard-insights"],
  { revalidate: 60, tags: [CACHE_TAGS.FINANCE_DASHBOARD] },
);

/**
 * Fetch the cached dashboard insights bundle (totals, cash flow, budgets, loans, goals, investments, deposits, health, trends).
 *
 * @returns Result with the dashboard data on success; an error result on failure.
 * @remarks Auth: requires session. Backed by `unstable_cache` (60s revalidate, tag `CACHE_TAGS.FINANCE_DASHBOARD`).
 */
export async function getDashboardInsights() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const data = await fetchDashboardData(coupleUserIds);

    return { success: true as const, data };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to get dashboard insights",
    };
  }
}
