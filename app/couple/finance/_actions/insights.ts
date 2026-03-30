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

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getDashboardInsights() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    console.log("[dashboard] session user:", { id: user.id, email: user.email });

    const month = currentMonth();
    const [year, m] = month.split("-").map(Number);
    const monthStart = new Date(year, m - 1, 1);
    const monthEnd = new Date(year, m, 1);

    // Resolve couple scope
    const coupleUserIds = await getUserIdsForCouple(user.id);

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
    const investmentsP = prisma.investmentHolding.findMany({
      where: { userId: { in: coupleUserIds } },
      select: { id: true, investedAmount: true, currentValue: true },
    });
    const depositsP = prisma.depositInstrument.findMany({
      where: { userId: { in: coupleUserIds } },
      select: {
        id: true,
        status: true,
        principalAmount: true,
        maturityAmount: true,
      },
    });
    const recentTxP = prisma.transaction.findMany({
      where: { userId: { in: coupleUserIds } },
      orderBy: { date: "desc" as const },
      take: 5,
      include: { account: { select: { name: true } } },
    });

    // Await individually to preserve types
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
      budgetSpent.map((s: { category: string; _sum: { amount: number | null } }) => [s.category, s._sum.amount ?? 0]),
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
      totalEMI: loans.reduce((sum, l) => {
        const schedule = Array.isArray(l.schedule) ? l.schedule as { date: string; emi: number }[] : null;
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

    // 8. Investments summary
    const investmentsSummary = {
      count: investments.length,
      totalInvested: investments.reduce((sum, item) => sum + item.investedAmount, 0),
      currentValue: investments.reduce(
        (sum, item) => sum + (item.currentValue ?? item.investedAmount),
        0,
      ),
    };

    // 9. Deposits summary
    const activeDeposits = deposits.filter((item) => item.status === "ACTIVE");
    const depositsSummary = {
      count: deposits.length,
      activeCount: activeDeposits.length,
      totalPrincipal: activeDeposits.reduce((sum, item) => sum + item.principalAmount, 0),
      totalMaturity: activeDeposits.reduce((sum, item) => sum + item.maturityAmount, 0),
    };

    // 10. Financial health score
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
        ? Math.max(0, 100 - ((totalBudgetSpent - totalBudgetLimit) / totalBudgetLimit) * 100)
        : 100;

    const healthScore = calculateFinancialHealthScore({
      savingsRate,
      debtToIncomeRatio,
      emergencyFundMonths,
      budgetAdherence: Math.min(budgetAdherence, 100),
    });

    // 11. Monthly trends (last 6 months)
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
      success: true as const,
      data: {
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
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to get dashboard insights",
    };
  }
}

export async function getFinancialHealthScore() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const month = currentMonth();
    const [year, m] = month.split("-").map(Number);

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const accountsP = prisma.financialAccount.findMany({
      where: { userId: { in: coupleUserIds } },
    });
    const transactionsP = prisma.transaction.findMany({
      where: {
        userId: { in: coupleUserIds },
        date: { gte: new Date(year, m - 1, 1), lt: new Date(year, m, 1) },
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
        date: { gte: new Date(year, m - 1, 1), lt: new Date(year, m, 1) },
      },
      _sum: { amount: true },
    });
    const loansP = prisma.loan.findMany({
      where: { userId: { in: coupleUserIds } },
    });

    const accounts: FinancialAccount[] = await accountsP;
    const transactions: Transaction[] = await transactionsP;
    const budgets: Budget[] = await budgetsP;
    const budgetSpent = await budgetSpentP;
    const loans: Loan[] = await loansP;

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    let income = 0;
    let expenses = 0;
    for (const t of transactions) {
      if (t.type === "INCOME") income += t.amount;
      else expenses += t.amount;
    }

    const savingsRate = calculateSavingsRate(income, expenses);

    const totalMonthlyEMI = loans.reduce((sum, l) => {
      const schedule = Array.isArray(l.schedule) ? l.schedule as { date: string; emi: number }[] : null;
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
    }, 0);
    const debtToIncomeRatio = income > 0 ? (totalMonthlyEMI / income) * 100 : 0;

    const emergencyFundMonths = expenses > 0 ? totalBalance / expenses : 0;

    const spentMap = new Map<string, number>(
      budgetSpent.map((s: { category: string; _sum: { amount: number | null } }) => [s.category, s._sum.amount ?? 0]),
    );
    const totalBudgetLimit = budgets.reduce((sum: number, b) => sum + b.limit, 0);
    const totalBudgetSpent = budgets.reduce(
      (sum: number, b) => sum + (spentMap.get(b.category) ?? 0),
      0,
    );
    const budgetAdherence =
      totalBudgetLimit > 0
        ? Math.min(
            100,
            Math.max(0, 100 - ((totalBudgetSpent - totalBudgetLimit) / totalBudgetLimit) * 100),
          )
        : 100;

    const healthScore = calculateFinancialHealthScore({
      savingsRate,
      debtToIncomeRatio,
      emergencyFundMonths,
      budgetAdherence,
    });

    return { success: true as const, data: healthScore };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to calculate health score",
    };
  }
}
