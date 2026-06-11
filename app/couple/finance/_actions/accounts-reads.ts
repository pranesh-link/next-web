"use server";

import { unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { financialAccounts, users, overallBalanceLog } from "@db/schema";
import { eq, and, inArray, desc, sum, lt } from "drizzle-orm";
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

    const accountRows = await db.query.financialAccounts.findMany({
      where: inArray(financialAccounts.userId, coupleUserIds),
      orderBy: [desc(financialAccounts.isPinned), desc(financialAccounts.createdAt)],
    });
    const userIds = [...new Set(accountRows.map((a) => a.userId))];
    const userRows = userIds.length > 0
      ? await db.query.users.findMany({ where: inArray(users.id, userIds), columns: { id: true, name: true } })
      : [];
    const userMap = new Map(userRows.map((u) => [u.id, { id: u.id, name: u.name }]));
    const accounts = accountRows.map((a) => ({ ...a, user: userMap.get(a.userId) ?? null }));

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

    const acctRow = await db.query.financialAccounts.findFirst({
      where: and(eq(financialAccounts.id, id), inArray(financialAccounts.userId, coupleUserIds)),
    });

    if (!acctRow) {
      return { success: false as const, error: "Account not found" };
    }

    const userRow = await db.query.users.findFirst({
      where: eq(users.id, acctRow.userId),
      columns: { id: true, name: true },
    });
    const account = { ...acctRow, user: userRow ?? null };

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

    const [{ total }] = await db
      .select({ total: sum(financialAccounts.balance) })
      .from(financialAccounts)
      .where(inArray(financialAccounts.userId, coupleUserIds));

    return { success: true as const, data: Number(total ?? 0) };
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

    const [pageAccountRows, totalBalResult, coupleUsersResult] = await Promise.all([
      db.query.financialAccounts.findMany({
        where: inArray(financialAccounts.userId, coupleUserIds),
        orderBy: [desc(financialAccounts.isPinned), desc(financialAccounts.createdAt)],
      }),
      db.select({ total: sum(financialAccounts.balance) })
        .from(financialAccounts)
        .where(inArray(financialAccounts.userId, coupleUserIds)),
      db.query.users.findMany({
        where: inArray(users.id, coupleUserIds),
        columns: { id: true, name: true, email: true },
      }),
    ]);

    const pageUserIds = [...new Set(pageAccountRows.map((a) => a.userId))];
    const pageUserRows = pageUserIds.length > 0
      ? await db.query.users.findMany({ where: inArray(users.id, pageUserIds), columns: { id: true, name: true } })
      : [];
    const pageUserMap = new Map(pageUserRows.map((u) => [u.id, { id: u.id, name: u.name }]));
    const accounts = pageAccountRows.map((a) => ({ ...a, user: pageUserMap.get(a.userId) ?? null }));

    return {
      success: true as const,
      data: {
        accounts,
        totalBalance: Number(totalBalResult[0]?.total ?? 0),
        coupleUsers: coupleUsersResult,
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

    const acctCheck = await db.query.financialAccounts.findFirst({
      where: and(eq(financialAccounts.id, accountId), inArray(financialAccounts.userId, coupleUserIds)),
    });

    if (!acctCheck) {
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
      const self = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { id: true, name: true, email: true },
      });
      return { success: true as const, data: self ? [self] : [], currentUserId: user.id };
    }

    const members = await getCoupleMembers(coupleId);
    const coupleUserList = members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    }));

    return { success: true as const, data: coupleUserList, currentUserId: user.id };
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
    const baseWhere = coupleId
      ? eq(overallBalanceLog.coupleId, coupleId)
      : inArray(overallBalanceLog.userId, coupleUserIds);

    let cursorDate: Date | undefined;
    if (cursor) {
      const cursorRow = await db.query.overallBalanceLog.findFirst({
        where: eq(overallBalanceLog.id, cursor),
        columns: { createdAt: true },
      });
      if (cursorRow) cursorDate = cursorRow.createdAt;
    }

    const logs = await db.query.overallBalanceLog.findMany({
      where: cursorDate ? and(baseWhere, lt(overallBalanceLog.createdAt, cursorDate)) : baseWhere,
      orderBy: [desc(overallBalanceLog.createdAt)],
      limit: pageSize + 1,
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
