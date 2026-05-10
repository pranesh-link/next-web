"use server";

import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import {
  type TransactionQueryParams,
  fetchTransactionsForUsers,
  fetchAccountsForUsers,
} from "./transactions-helpers";

/**
 * Fetch transactions for the couple, optionally filtered by month / category / account.
 *
 * @param params - Optional filters (`month`, `category`, `accountId`, `limit`).
 * @returns Result with the transaction list, or an error.
 * @remarks Auth: requires session.
 */
export async function getTransactions(params?: {
  month?: string;
  category?: string;
  accountId?: string;
  limit?: number;
}) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const transactions = await fetchTransactionsForUsers(coupleUserIds, params);

    return { success: true as const, data: transactions };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch transactions",
    };
  }
}

/**
 * Fetch the bundle of data required by the transactions page (transactions + accounts) in one call.
 *
 * @param params - Optional {@link TransactionQueryParams} filters applied to the transactions query.
 * @returns Result with `{ transactions, accounts }`, or an error.
 * @remarks Auth: requires session.
 */
export async function getTransactionsPageData(params?: TransactionQueryParams) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const [transactions, accounts] = await Promise.all([
      fetchTransactionsForUsers(coupleUserIds, params),
      fetchAccountsForUsers(coupleUserIds),
    ]);

    return {
      success: true as const,
      data: { transactions, accounts },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch transactions page data",
    };
  }
}

/**
 * Fetch a single transaction by id, scoped to the couple's transactions.
 *
 * @param id - Transaction id.
 * @returns The transaction when found, otherwise an error result.
 * @remarks Auth: requires session.
 */
export async function getTransaction(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: { in: coupleUserIds } },
      include: { account: { select: { name: true } } },
    });

    if (!transaction) {
      return { success: false as const, error: "Transaction not found" };
    }

    return { success: true as const, data: transaction };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch transaction",
    };
  }
}

/**
 * Fetch all transactions for a given month.
 *
 * @param month - Month formatted as `YYYY-MM`.
 * @returns Result with the transaction list, or an error.
 * @remarks Auth: requires session.
 */
export async function getTransactionsByMonth(month: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const [year, m] = month.split("-").map(Number);
    const coupleUserIds = await getUserIdsForCouple(user.id);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId: { in: coupleUserIds },
        date: { gte: new Date(year, m - 1, 1), lt: new Date(year, m, 1) },
      },
      orderBy: { date: "desc" },
      include: { account: { select: { name: true } } },
    });

    return { success: true as const, data: transactions };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch transactions",
    };
  }
}

/**
 * Aggregate expense totals by category for the supplied month (defaults to the current month).
 *
 * @param month - Optional month formatted as `YYYY-MM`. Defaults to the current month.
 * @returns Result with `[{ category, total }]` ordered by descending total, or an error.
 * @remarks Auth: requires session.
 */
export async function getCategoryAggregation(month?: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const now = new Date();
    const targetMonth =
      month ??
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const [year, m] = targetMonth.split("-").map(Number);
    const coupleUserIds = await getUserIdsForCouple(user.id);

    const aggregation = await prisma.transaction.groupBy({
      by: ["category"],
      where: {
        userId: { in: coupleUserIds },
        type: "EXPENSE",
        date: { gte: new Date(year, m - 1, 1), lt: new Date(year, m, 1) },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    const data = aggregation.map(
      (item: { category: string; _sum: { amount: number | null } }) => ({
        category: item.category,
        total: item._sum.amount ?? 0,
      }),
    );

    return { success: true as const, data };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to aggregate categories",
    };
  }
}
