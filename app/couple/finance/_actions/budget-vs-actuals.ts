"use server";

import { unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { budgets, transactions } from "@db/schema";
import { and, inArray, eq, gte, lt, sql } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

/** A single row in the Budget vs Actuals report. */
export interface BudgetActualRow {
  /** Transaction category name. */
  category: string;
  /** Budget limit for the month, or null when no budget is set. */
  limit: number | null;
  /** Actual amount spent in the month. */
  spent: number;
  /** True when spent >= limit (only relevant when limit is set). */
  overBudget: boolean;
  /** Percentage of limit consumed (0–∞). 0 when limit is null. */
  pct: number;
}

/**
 * Returns budget limits vs actual spend for each category for a given month.
 * Includes categories that have spend but no budget set.
 * Sorted by spent descending.
 *
 * @param month - Month in "YYYY-MM" format (e.g. "2026-05").
 * @returns Array of {@link BudgetActualRow}, sorted by spent descending.
 * @throws {Error} When authentication fails.
 * @remarks Auth: requires session.
 */
export async function getBudgetVsActuals(month: string): Promise<BudgetActualRow[]> {
  noStore();
  const user = await requireAuthForAction();
  if (!user) throw new Error("Not authenticated");

  const [year, m] = month.split("-").map(Number);
  const monthStart = new Date(year, m - 1, 1);
  const monthEnd = new Date(year, m, 1);

  const coupleUserIds = await getUserIdsForCouple(user.id);

  const [budgetRows, spentGroups] = await Promise.all([
    db
      .select()
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
  ]);

  const limitMap = new Map<string, number>(
    budgetRows.map((b) => [b.category, b.limit])
  );

  const spentMap = new Map<string, number>(
    spentGroups.map((g) => [g.category, g.total ?? 0])
  );

  // Merge categories from both sources
  const allCategories = new Set([...limitMap.keys(), ...spentMap.keys()]);

  const rows: BudgetActualRow[] = Array.from(allCategories).map((category) => {
    const limit = limitMap.get(category) ?? null;
    const spent = spentMap.get(category) ?? 0;
    const overBudget = limit !== null && spent >= limit;
    const pct = limit !== null && limit > 0 ? (spent / limit) * 100 : 0;
    return { category, limit, spent, overBudget, pct };
  });

  rows.sort((a, b) => b.spent - a.spent);
  return rows;
}
