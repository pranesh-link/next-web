"use server";

import { unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { financialAccounts, balanceHistory, transactions } from "@db/schema";
import { eq, and, inArray, lte, desc } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

type ActivityItem = {
  id: string;
  date: Date;
  source: "balance" | "transaction";
  amount: number;
  change: number;
  balance: number;
  note: string | null;
  description: string | null;
  category: string | null;
  type: string | null;
};

/**
 * Fetch a paginated, unified activity feed for an account combining balance-history entries and transactions.
 *
 * Items from both sources are merged, sorted by date (descending) with a stable
 * tiebreaker on id, and then paginated using a `<isoDate>|<id>` cursor.
 *
 * @param accountId - The account whose activity is being requested.
 * @param cursor - Opaque cursor returned by the previous page (omit for the first page).
 * @returns Result with `items` (page size 20) and the `nextCursor`, or an error.
 * @remarks Auth: requires session.
 */
export async function getAccountActivity(accountId: string, cursor?: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const account = await db.query.financialAccounts.findFirst({
      where: and(eq(financialAccounts.id, accountId), inArray(financialAccounts.userId, coupleUserIds)),
    });

    if (!account) {
      return { success: false as const, error: "Account not found" };
    }

    const pageSize = 20;
    let cursorDate: Date | undefined;
    let cursorId: string | undefined;
    if (cursor) {
      const [dateStr, id] = cursor.split("|");
      cursorDate = new Date(dateStr);
      cursorId = id;
    }

    const [balHistRows, txRows] = await Promise.all([
      db.query.balanceHistory.findMany({
        where: cursorDate
          ? and(
              eq(balanceHistory.accountId, accountId),
              inArray(balanceHistory.userId, coupleUserIds),
              lte(balanceHistory.createdAt, cursorDate),
            )
          : and(eq(balanceHistory.accountId, accountId), inArray(balanceHistory.userId, coupleUserIds)),
        orderBy: [desc(balanceHistory.createdAt)],
        limit: pageSize + 1,
      }),
      db.query.transactions.findMany({
        where: cursorDate
          ? and(
              eq(transactions.accountId, accountId),
              inArray(transactions.userId, coupleUserIds),
              lte(transactions.date, cursorDate),
            )
          : and(eq(transactions.accountId, accountId), inArray(transactions.userId, coupleUserIds)),
        orderBy: [desc(transactions.date)],
        limit: pageSize + 1,
      }),
    ]);

    const items: ActivityItem[] = [
      ...balHistRows.map((h) => ({
        id: h.id,
        date: h.createdAt,
        source: "balance" as const,
        amount: Math.abs(h.change),
        change: h.change,
        balance: h.balance,
        note: h.note,
        description: null,
        category: null,
        type: null,
      })),
      ...txRows.map((t) => ({
        id: t.id,
        date: t.date,
        source: "transaction" as const,
        amount: t.amount,
        change: t.type === "INCOME" ? t.amount : -t.amount,
        balance: 0,
        note: null,
        description: t.description,
        category: t.category,
        type: t.type,
      })),
    ];

    items.sort((a, b) => {
      const diff = b.date.getTime() - a.date.getTime();
      if (diff !== 0) return diff;
      return b.id.localeCompare(a.id);
    });

    let filtered = items;
    if (cursorDate && cursorId) {
      const cursorTime = cursorDate.getTime();
      const idx = filtered.findIndex(
        (item) => item.date.getTime() === cursorTime && item.id === cursorId,
      );
      if (idx !== -1) {
        filtered = filtered.slice(idx + 1);
      } else {
        filtered = filtered.filter((item) => item.date.getTime() < cursorTime);
      }
    }

    const page = filtered.slice(0, pageSize);
    const hasMore = filtered.length > pageSize;
    const lastItem = page[page.length - 1];
    const nextCursor =
      hasMore && lastItem ? `${lastItem.date.toISOString()}|${lastItem.id}` : null;

    return { success: true as const, data: { items: page, nextCursor } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch account activity",
    };
  }
}
