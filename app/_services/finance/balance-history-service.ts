import { db } from '@db';
import { balanceHistory } from '@db/schema';
import { eq, inArray, and, desc, lt } from 'drizzle-orm';

export async function recordBalanceChange(
  accountId: string,
  oldBalance: number,
  newBalance: number,
  userId: string,
  coupleId?: string | null,
  note?: string,
) {
  const change = newBalance - oldBalance;
  const [record] = await db.insert(balanceHistory).values({
    accountId,
    balance: newBalance,
    change,
    note: note || null,
    userId,
    coupleId: coupleId || null,
  }).returning();
  return record;
}

export async function getHistoryForAccount(
  accountId: string,
  coupleUserIds: string[],
  limit = 20,
  cursor?: string,
) {
  let cursorCreatedAt: Date | undefined;
  if (cursor) {
    const cursorRecord = await db.query.balanceHistory.findFirst({
      where: eq(balanceHistory.id, cursor),
      columns: { createdAt: true },
    });
    cursorCreatedAt = cursorRecord?.createdAt;
  }

  const items = await db.query.balanceHistory.findMany({
    where: and(
      eq(balanceHistory.accountId, accountId),
      inArray(balanceHistory.userId, coupleUserIds),
      cursorCreatedAt ? lt(balanceHistory.createdAt, cursorCreatedAt) : undefined,
    ),
    orderBy: desc(balanceHistory.createdAt),
    limit: limit + 1,
  });

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
