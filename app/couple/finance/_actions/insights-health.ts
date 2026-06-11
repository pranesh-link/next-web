"use server";

import { db } from "@db";
import {
  financialAccounts,
  transactions as transactionsTable,
  budgets as budgetsTable,
  loans,
} from "@db/schema";
import { and, inArray, eq, gte, lt, sql } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import {
  calculateSavingsRate,
  calculateFinancialHealthScore,
} from "@/_services/finance";
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

    const monthStart = new Date(year, m - 1, 1);
    const monthEnd = new Date(year, m, 1);

    const [accounts, txList, budgetRows, budgetSpent, loanRows] = await Promise.all([
      db.select().from(financialAccounts).where(inArray(financialAccounts.userId, coupleUserIds)),
      db
        .select()
        .from(transactionsTable)
        .where(
          and(
            inArray(transactionsTable.userId, coupleUserIds),
            gte(transactionsTable.date, monthStart),
            lt(transactionsTable.date, monthEnd),
          ),
        ),
      db
        .select()
        .from(budgetsTable)
        .where(and(inArray(budgetsTable.userId, coupleUserIds), eq(budgetsTable.month, month))),
      db
        .select({
          category: transactionsTable.category,
          total: sql<number>`sum(${transactionsTable.amount})`,
        })
        .from(transactionsTable)
        .where(
          and(
            inArray(transactionsTable.userId, coupleUserIds),
            eq(transactionsTable.type, "EXPENSE"),
            gte(transactionsTable.date, monthStart),
            lt(transactionsTable.date, monthEnd),
          ),
        )
        .groupBy(transactionsTable.category),
      db.select().from(loans).where(inArray(loans.userId, coupleUserIds)),
    ]);

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    let income = 0;
    let expenses = 0;
    for (const t of txList) {
      if (t.type === "INCOME") income += t.amount;
      else expenses += t.amount;
    }

    const savingsRate = calculateSavingsRate(income, expenses);

    const totalMonthlyEMI = loanRows.reduce((sum, l) => {
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
      budgetSpent.map((s) => [s.category, s.total ?? 0]),
    );
    const totalBudgetLimit = budgetRows.reduce((sum, b) => sum + b.limit, 0);
    const totalBudgetSpent = budgetRows.reduce(
      (sum, b) => sum + (spentMap.get(b.category) ?? 0),
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
