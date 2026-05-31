import prisma from "@/_lib/prisma";

/**
 * Purges undelivered messages older than 30 days. Called by a cron job
 * or triggered manually via admin workflow.
 *
 * @returns Number of messages purged.
 */
export async function purgeExpiredMessages(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.coupleMessage.deleteMany({
    where: {
      deliveredAt: null,
      createdAt: { lt: thirtyDaysAgo },
    },
  });

  if (result.count > 0) {
    console.log(`[message-purge] Purged ${result.count} undelivered messages older than 30 days`);
  }

  return result.count;
}

/**
 * Deletes delivered messages that have been ACKed and are older than
 * the retention window (1 hour after delivery).
 *
 * @returns Number of messages cleaned up.
 */
export async function cleanupDeliveredMessages(): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const result = await prisma.coupleMessage.deleteMany({
    where: {
      deliveredAt: { not: null, lt: oneHourAgo },
    },
  });

  return result.count;
}
