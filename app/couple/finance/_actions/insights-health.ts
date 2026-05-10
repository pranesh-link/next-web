"use server";

import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import {
  calculateSavingsRate,
  calculateFinancialHealthScore,
} from "@/_services/finance";
import type {
  FinancialAccount,
  Transaction,
  Budget,
  Loan,
} from "@prisma/client";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { currentMonth } from "./insights-helpers";

/**
 * Compute the financial health score for the current month from accounts, transactions, budgets, and loans.
 *
 * Inputs to the score: savings rate, debt-to-income ratio, emergency-fund months,
 * and budget adherence (clamped to [0, 100]).
 *
 * @returns Result with the score breakdown, or an error.
 * @remarks Auth: requires session.
 */
export async function getFinancialHealthScore() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const month = currentMonth();
    const [year, m] = month.split("-").map(Number);

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const accountsP = prisma.financialAccount.findMany({ where: { userId: { in: coupleUserIds } } });
    const transactionsP = prisma.transaction.findMany({
      where: {
        userId: { in: coupleUserIds },
        date: { gte: new Date(year, m - 1, 1), lt: new Date(year, m, 1) },
      },
    });
    const budgetsP = prisma.budget.findMany({ where: { userId: { in: coupleUserIds }, month } });
    const budgetSpentP = prisma.transaction.groupBy({
      by: ["category"] as const,
      where: {
        userId: { in: coupleUserIds },
        type: "EXPENSE" as const,
        date: { gte: new Date(year, m - 1, 1), lt: new Date(year, m, 1) },
      },
      _sum: { amount: true },
    });
    const loansP = prisma.loan.findMany({ where: { userId: { in: coupleUserIds } } });

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
