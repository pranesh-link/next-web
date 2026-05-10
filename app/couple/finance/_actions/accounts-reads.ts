"use server";

import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import {
  getUserIdsForCouple,
  getCoupleIdForUser,
  getCoupleMembers,
} from "@/_services/finance/couple-service";
import { getHistoryForAccount } from "@/_services/finance/balance-history-service";

/**
 * Fetch every financial account visible to the signed-in user (couple-wide).
 *
 * @returns A discriminated result containing all accounts ordered by pinned-first then newest, or an error.
 * @remarks Auth: requires session.
 */
export async function getAccounts() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const accounts = await prisma.financialAccount.findMany({
      where: { userId: { in: coupleUserIds } },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: { user: { select: { id: true, name: true } } },
    });

    return { success: true as const, data: accounts };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch accounts",
    };
  }
}

/**
 * Fetch a single account by id, scoped to the couple's accounts.
 *
 * @param id - Account id.
 * @returns The account when found, otherwise an error result.
 * @remarks Auth: requires session.
 */
export async function getAccount(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const account = await prisma.financialAccount.findFirst({
      where: { id, userId: { in: coupleUserIds } },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!account) {
      return { success: false as const, error: "Account not found" };
    }

    return { success: true as const, data: account };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch account",
    };
  }
}

/**
 * Compute the sum of all account balances for the couple.
 *
 * @returns Result containing the total balance, or an error.
 * @remarks Auth: requires session.
 */
export async function getTotalBalance() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const result = await prisma.financialAccount.aggregate({
      where: { userId: { in: coupleUserIds } },
      _sum: { balance: true },
    });

    return { success: true as const, data: result._sum.balance ?? 0 };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to calculate total balance",
    };
  }
}

/**
 * Fetch the bundle of data required by the accounts page in a single round trip.
 *
 * @returns Result containing the account list, the total balance, the couple's users, and the current user id.
 * @remarks Auth: requires session.
 */
export async function getAccountsPageData() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const [accounts, totalBalanceResult, coupleUsers] = await Promise.all([
      prisma.financialAccount.findMany({
        where: { userId: { in: coupleUserIds } },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.financialAccount.aggregate({
        where: { userId: { in: coupleUserIds } },
        _sum: { balance: true },
      }),
      prisma.user.findMany({
        where: { id: { in: coupleUserIds } },
        select: { id: true, name: true, email: true },
      }),
    ]);

    return {
      success: true as const,
      data: {
        accounts,
        totalBalance: totalBalanceResult._sum.balance ?? 0,
        coupleUsers,
        currentUserId: user.id,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch accounts page data",
    };
  }
}

/**
 * Fetch a paginated balance-history feed for a specific account.
 *
 * @param accountId - The account whose history is being requested.
 * @param cursor - Opaque cursor returned by the previous page (omit for the first page).
 * @returns Result with `items` and `nextCursor` (page size 20), or an error.
 * @remarks Auth: requires session.
 */
export async function getAccountBalanceHistory(accountId: string, cursor?: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const account = await prisma.financialAccount.findFirst({
      where: { id: accountId, userId: { in: coupleUserIds } },
    });

    if (!account) {
      return { success: false as const, error: "Account not found" };
    }

    const { items, nextCursor } = await getHistoryForAccount(accountId, coupleUserIds, 20, cursor);
    return { success: true as const, data: { items, nextCursor } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch balance history",
    };
  }
}

/**
 * Fetch the users that belong to the signed-in user's couple (or just the user when solo).
 *
 * @returns Result with the user list and the current user id, or an error.
 * @remarks Auth: requires session.
 */
export async function getCoupleUsers() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleId = await getCoupleIdForUser(user.id);

    if (!coupleId) {
      const self = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, email: true },
      });
      return { success: true as const, data: self ? [self] : [], currentUserId: user.id };
    }

    const members = await getCoupleMembers(coupleId);
    const users = members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    }));

    return { success: true as const, data: users, currentUserId: user.id };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch couple users",
    };
  }
}

/**
 * Fetch a paginated audit feed of overall (couple-wide) balance changes.
 *
 * @param cursor - Opaque cursor returned by the previous page (omit for the first page).
 * @returns Result with the log entries (page size 20) and the `nextCursor`, or an error.
 * @remarks Auth: requires session.
 */
export async function getOverallBalanceHistory(cursor?: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const coupleId = await getCoupleIdForUser(user.id);

    const pageSize = 20;
    const logs = await prisma.overallBalanceLog.findMany({
      where: coupleId ? { coupleId } : { userId: { in: coupleUserIds } },
      orderBy: { createdAt: "desc" },
      take: pageSize + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = logs.length > pageSize;
    const items = hasMore ? logs.slice(0, pageSize) : logs;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { success: true as const, data: { items, nextCursor } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch balance history",
    };
  }
}
