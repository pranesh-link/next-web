import prisma from '@/_lib/prisma';

export async function recordBalanceChange(
  accountId: string,
  oldBalance: number,
  newBalance: number,
  userId: string,
  coupleId?: string | null,
  note?: string,
) {
  const change = newBalance - oldBalance;
  return prisma.balanceHistory.create({
    data: {
      accountId,
      balance: newBalance,
      change,
      note: note || null,
      userId,
      coupleId: coupleId || null,
    },
  });
}

export async function getHistoryForAccount(
  accountId: string,
  coupleUserIds: string[],
  limit = 20,
  cursor?: string,
) {
  const items = await prisma.balanceHistory.findMany({
    where: {
      accountId,
      userId: { in: coupleUserIds },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const hasMore = items.length > limit;
  if (hasMore) items.pop();

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
