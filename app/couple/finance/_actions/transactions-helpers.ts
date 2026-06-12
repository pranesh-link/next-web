import { db } from "@db";
import { transactions, financialAccounts, users } from "@db/schema";
import { eq, and, inArray, gte, lt, desc, type SQL } from "drizzle-orm";

/**
 * Filter parameters accepted by the transaction reads.
 */
export type TransactionQueryParams = {
  /** Month filter formatted as `YYYY-MM`. */
  month?: string;
  /** Category to filter on. */
  category?: string;
  /** Account id to filter on. */
  accountId?: string;
  /** Maximum rows to return. */
  limit?: number;
};

/**
 * Build a Drizzle `where` condition from the supplied {@link TransactionQueryParams} and the couple's user ids.
 *
 * @param coupleUserIds - All user ids that belong to the couple.
 * @param params - Optional filters (month, category, account).
 * @returns A Drizzle SQL condition.
 */
export function buildTransactionsWhere(
  coupleUserIds: string[],
  params?: TransactionQueryParams,
): SQL | undefined {
  const conditions: SQL[] = [inArray(transactions.userId, coupleUserIds)];

  if (params?.month) {
    const [year, month] = params.month.split("-").map(Number);
    conditions.push(gte(transactions.date, new Date(year, month - 1, 1)));
    conditions.push(lt(transactions.date, new Date(year, month, 1)));
  }

  if (params?.category) {
    conditions.push(eq(transactions.category, params.category));
  }

  if (params?.accountId) {
    conditions.push(eq(transactions.accountId, params.accountId));
  }

  return and(...conditions);
}

/**
 * Fetch transactions for the supplied couple user ids using the given filter params.
 *
 * @param coupleUserIds - User ids the query should be scoped to.
 * @param params - Optional {@link TransactionQueryParams}.
 * @returns The matching transactions, ordered by date descending, including the parent account name.
 */
export async function fetchTransactionsForUsers(
  coupleUserIds: string[],
  params?: TransactionQueryParams,
) {
  const txRows = await db.query.transactions.findMany({
    where: buildTransactionsWhere(coupleUserIds, params),
    orderBy: [desc(transactions.date)],
    limit: params?.limit,
  });

  const accountIds = [...new Set(txRows.map((t) => t.accountId))];
  const accts =
    accountIds.length > 0
      ? await db.query.financialAccounts.findMany({
          where: inArray(financialAccounts.id, accountIds),
          columns: { id: true, name: true },
        })
      : [];
  const accountMap = new Map(accts.map((a) => [a.id, a.name]));

  return txRows.map((t) => ({ ...t, account: { name: accountMap.get(t.accountId) ?? "" } }));
}

/**
 * Fetch all financial accounts for the supplied couple user ids.
 *
 * @param coupleUserIds - User ids the query should be scoped to.
 * @returns Accounts ordered by pinned-first then newest, including the owning user.
 */
export async function fetchAccountsForUsers(coupleUserIds: string[]) {
  const accountRows = await db.query.financialAccounts.findMany({
    where: inArray(financialAccounts.userId, coupleUserIds),
    orderBy: [desc(financialAccounts.isPinned), desc(financialAccounts.createdAt)],
  });

  const userIds = [...new Set(accountRows.map((a) => a.userId))];
  const userRows =
    userIds.length > 0
      ? await db.query.users.findMany({
          where: inArray(users.id, userIds),
          columns: { id: true, name: true },
        })
      : [];
  const userMap = new Map(userRows.map((u) => [u.id, { id: u.id, name: u.name }]));

  return accountRows.map((a) => ({ ...a, user: userMap.get(a.userId) ?? null }));
}
