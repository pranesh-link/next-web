"use server";

import { db } from "@db";
import {
  financialAccounts, transactions, budgets, loans,
  savingsGoals, investmentHoldings, depositInstruments,
} from "@db/schema";
import { eq, inArray, gte, lt, desc, sql } from "drizzle-orm";
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
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { unstable_cache } from "next/cache";
import { CACHE_TAGS } from "@/_lib/cache";
import { currentMonth } from "./insights-helpers";
import {
  computeAccountBreakdown,
  computeLoanDetails,
  computeBudgetRollup,
  computeGoalsTimeline,
  computeAlerts,
  hasEmiDueSoon,
  getNextEmiAmount,
} from "./dashboard-helpers";

const fetchDashboardData = unstable_cache(
  async (coupleUserIds: string[]) => {
    const month = currentMonth();
    const [year, m] = month.split("-").map(Number);
    const monthStart = new Date(year, m - 1, 1);
    const monthEnd = new Date(year, m, 1);

    const accountsP = db.query.financialAccounts.findMany({
      where: inArray(financialAccounts.userId, coupleUserIds),
    });
    const allTransactionsP = db.query.transactions.findMany({
      where: inArray(transactions.userId, coupleUserIds),
      orderBy: [desc(transactions.date)],
    });
    const currentMonthTxP = db.query.transactions.findMany({
      where: (t, { and }) => and(
        inArray(t.userId, coupleUserIds),
        gte(t.date, monthStart.toISOString()),
        lt(t.date, monthEnd.toISOString()),
      ),
    });
    const budgetsP = db.query.budgets.findMany({
      where: (b, { and }) => and(inArray(b.userId, coupleUserIds), eq(b.month, month)),
    });
    const budgetSpentP = db
      .select({
        category: transactions.category,
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(
        sql`${inArray(transactions.userId, coupleUserIds)} AND ${eq(transactions.type, "EXPENSE")} AND ${transactions.date} >= ${monthStart.toISOString()} AND ${transactions.date} < ${monthEnd.toISOString()}`
      )
      .groupBy(transactions.category);
    const loansP = db.query.loans.findMany({
      where: inArray(loans.userId, coupleUserIds),
    });
    const goalsP = db.query.savingsGoals.findMany({
      where: inArray(savingsGoals.userId, coupleUserIds),
    });
    const investmentsP = db
      .select({ id: investmentHoldings.id, investedAmount: investmentHoldings.investedAmount, currentValue: investmentHoldings.currentValue })
      .from(investmentHoldings)
      .where(inArray(investmentHoldings.userId, coupleUserIds));
    const depositsP = db
      .select({ id: depositInstruments.id, status: depositInstruments.status, principalAmount: depositInstruments.principalAmount, maturityAmount: depositInstruments.maturityAmount })
      .from(depositInstruments)
      .where(inArray(depositInstruments.userId, coupleUserIds));
    const recentTxP = db.query.transactions.findMany({
      where: inArray(transactions.userId, coupleUserIds),
      orderBy: [desc(transactions.date)],
      limit: 5,
      with: { account: { columns: { name: true } } },
    });

    const accounts = await accountsP;
    const allTransactions = await allTransactionsP;
    const currentMonthTransactions = await currentMonthTxP;
    const budgets_ = await budgetsP;
    const budgetSpent = await budgetSpentP;
    const loans_ = await loansP;
    const goals = await goalsP;
    const investments = await investmentsP;
    const deposits = await depositsP;
    const recentTransactions = await recentTxP;

    const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

    const txData: TransactionData[] = currentMonthTransactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      category: t.category,
      date: new Date(t.date),
      description: t.description ?? undefined,
    }));
    const cashFlow = calculateMonthlyCashFlow(txData, month);
    const savingsRate = calculateSavingsRate(cashFlow.income, cashFlow.expenses);
    const expenseBreakdown = calculateExpenseBreakdown(txData);

    const spentMap = new Map<string, number>(
      budgetSpent.map((s) => [s.category, Number(s.total ?? 0)]),
    );
    const budgetStatus = budgets_.map((budget) => {
      const spent = spentMap.get(budget.category) ?? 0;
      const limit = Number(budget.limit);
      return { budget, spent, remaining: limit - spent, exceeded: spent > limit };
    });

    const loansSummary = {
      count: loans_.length,
      totalRemaining: loans_.reduce((sum, l) => sum + Number(l.remainingBalance), 0),
      totalEMI: loans_.reduce((sum, l) => sum + getNextEmiAmount(l), 0),
    };
    const loanDetails = computeLoanDetails(loans_);

    const goalsWithProgress = goals.map((g) => ({
      ...g,
      progress: calculateGoalProgress({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.targetAmount),
        currentAmount: Number(g.currentAmount),
        deadline: g.deadline ? new Date(g.deadline) : undefined,
      }),
    }));
    const goalsSummary = {
      count: goals.length,
      totalTarget: goals.reduce((sum, g) => sum + Number(g.targetAmount), 0),
      totalSaved: goals.reduce((sum, g) => sum + Number(g.currentAmount), 0),
    };

    const investmentsSummary = {
      count: investments.length,
      totalInvested: investments.reduce((sum, item) => sum + Number(item.investedAmount), 0),
      currentValue: investments.reduce(
        (sum, item) => sum + Number(item.currentValue ?? item.investedAmount),
        0,
      ),
    };

    const activeDeposits = deposits.filter((item) => item.status === "ACTIVE");
    const depositsSummary = {
      count: deposits.length,
      activeCount: activeDeposits.length,
      totalPrincipal: activeDeposits.reduce((sum, item) => sum + Number(item.principalAmount), 0),
      totalMaturity: activeDeposits.reduce((sum, item) => sum + Number(item.maturityAmount), 0),
    };

    const totalMonthlyEMI = loansSummary.totalEMI;
    const monthlyIncome = cashFlow.income || 1;
    const debtToIncomeRatio = (totalMonthlyEMI / monthlyIncome) * 100;
    const emergencyFundMonths = cashFlow.expenses > 0 ? totalBalance / cashFlow.expenses : 0;

    const totalBudgetLimit = budgets_.reduce((sum, b) => sum + Number(b.limit), 0);
    const totalBudgetSpent = budgets_.reduce(
      (sum, b) => sum + (spentMap.get(b.category) ?? 0),
      0,
    );
    const budgetAdherence =
      totalBudgetLimit > 0
        ? Math.max(0, 100 - ((totalBudgetSpent - totalBudgetLimit) / totalBudgetLimit) * 100)
        : 100;

    const accountBreakdown = computeAccountBreakdown(accounts);
    const netWorth =
      totalBalance + investmentsSummary.currentValue - loansSummary.totalRemaining;
    const goalsWithTimeline = computeGoalsTimeline(
      goalsWithProgress,
      cashFlow.income,
    );
    const budgetRollup = computeBudgetRollup(
      totalBudgetLimit,
      totalBudgetSpent,
      budgetStatus.filter((b) => b.exceeded).length,
    );
    const alerts = computeAlerts({
      totalBudgetLimit,
      totalBudgetSpent,
      emergencyFundMonths,
      hasExpenses: cashFlow.expenses > 0,
      debtToIncomeRatio,
      atRiskGoalCount: goalsWithTimeline.filter((g) => g.isAtRisk).length,
      emiDueSoon: hasEmiDueSoon(loans_),
    });

    const healthScore = calculateFinancialHealthScore({
      savingsRate,
      debtToIncomeRatio,
      emergencyFundMonths,
      budgetAdherence: Math.min(budgetAdherence, 100),
    });

    const allTxData: TransactionData[] = allTransactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      category: t.category,
      date: new Date(t.date),
      description: t.description ?? undefined,
    }));
    const monthlyTrends = calculateMonthlyTrends(allTxData, 6);

    return {
      totalBalance,
      netWorth,
      cashFlow,
      savingsRate,
      expenseBreakdown,
      budgetStatus,
      budgetRollup,
      loansSummary,
      loanDetails,
      goalsSummary,
      goalsWithProgress,
      goalsWithTimeline,
      accountBreakdown,
      alerts,
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
