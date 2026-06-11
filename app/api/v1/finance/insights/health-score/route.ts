import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { financialAccounts, transactions, budgets, loans } from "@db/schema";
import { and, inArray, eq, gte, lt, sql } from "drizzle-orm";
import {
  calculateMonthlyCashFlow,
  calculateSavingsRate,
  calculateFinancialHealthScore,
} from "@/_services/finance";
import type { TransactionData } from "@/_services/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { withRateLimit } from "@/_lib/middleware/rate-limit";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getRating(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
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

    const [accounts, currentMonthTx, budgetRows, budgetSpent, loanRows] =
      await Promise.all([
        db
          .select({ balance: financialAccounts.balance })
          .from(financialAccounts)
          .where(inArray(financialAccounts.userId, coupleUserIds)),
        db.query.transactions.findMany({
          where: and(
            inArray(transactions.userId, coupleUserIds),
            gte(transactions.date, monthStart),
            lt(transactions.date, monthEnd),
          ),
        }),
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
              gte(transactions.date, monthStart),
              lt(transactions.date, monthEnd),
            ),
          )
          .groupBy(transactions.category),
        db
          .select({ emiAmount: loans.emiAmount })
          .from(loans)
          .where(inArray(loans.userId, coupleUserIds)),
      ]);

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    const txData: TransactionData[] = currentMonthTx.map((t) => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
      description: t.description ?? undefined,
    }));

    const cashFlow = calculateMonthlyCashFlow(txData, month);
    const savingsRate = calculateSavingsRate(cashFlow.income, cashFlow.expenses);

    const totalMonthlyEMI = loanRows.reduce((sum, l) => sum + l.emiAmount, 0);
    const monthlyIncome = cashFlow.income || 1;
    const debtToIncomeRatio = (totalMonthlyEMI / monthlyIncome) * 100;
    const emergencyFundMonths =
      cashFlow.expenses > 0 ? totalBalance / cashFlow.expenses : 0;

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
            Math.max(
              0,
              100 -
                ((totalBudgetSpent - totalBudgetLimit) / totalBudgetLimit) * 100,
            ),
          )
        : 100;

    const healthResult = calculateFinancialHealthScore({
      savingsRate,
      debtToIncomeRatio,
      emergencyFundMonths,
      budgetAdherence,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          score: healthResult.score,
          rating: getRating(healthResult.score),
          breakdown: {
            savingsRate,
            debtToIncomeRatio,
            emergencyFundMonths,
            budgetAdherence,
          },
        },
      },
      { headers: corsHeaders("private, max-age=60") },
    );
  } catch (error) {
    console.error("[health-score] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to calculate health score",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const GET = withRateLimit(getHandler, { max: 60, window: 60 });
