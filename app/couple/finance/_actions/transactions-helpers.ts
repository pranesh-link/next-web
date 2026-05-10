import prisma from "@/_lib/prisma";

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
 * Prisma `where` clause shape used by the transaction queries.
 */
export type TransactionWhere = {
  userId: { in: string[] };
  date?: { gte: Date; lt: Date };
  category?: string;
  accountId?: string;
};

/**
 * Build a Prisma `where` clause from the supplied {@link TransactionQueryParams} and the couple's user ids.
 *
 * @param coupleUserIds - All user ids that belong to the couple.
 * @param params - Optional filters (month, category, account).
 * @returns A Prisma-ready `where` object.
 */
export function buildTransactionsWhere(
  coupleUserIds: string[],
  params?: TransactionQueryParams,
): TransactionWhere {
  const where: TransactionWhere = { userId: { in: coupleUserIds } };

  if (params?.month) {
    const [year, month] = params.month.split("-").map(Number);
    where.date = {
      gte: new Date(year, month - 1, 1),
      lt: new Date(year, month, 1),
    };
  }

  if (params?.category) {
    where.category = params.category;
  }

  if (params?.accountId) {
    where.accountId = params.accountId;
  }

  return where;
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
  return prisma.transaction.findMany({
    where: buildTransactionsWhere(coupleUserIds, params),
    orderBy: { date: "desc" },
    take: params?.limit,
    include: { account: { select: { name: true } } },
  });
}

/**
 * Fetch all financial accounts for the supplied couple user ids.
 *
 * @param coupleUserIds - User ids the query should be scoped to.
 * @returns Accounts ordered by pinned-first then newest, including the owning user.
 */
export async function fetchAccountsForUsers(coupleUserIds: string[]) {
  return prisma.financialAccount.findMany({
    where: { userId: { in: coupleUserIds } },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: { user: { select: { id: true, name: true } } },
  });
}
