import { db } from "@db";
import { coupleMessages } from "@db/schema";
import { and, isNull, isNotNull, lt } from "drizzle-orm";

/**
 * Purges undelivered messages older than 30 days. Called by a cron job
 * or triggered manually via admin workflow.
 *
 * @returns Number of messages purged.
 */
export async function purgeExpiredMessages(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const deleted = await db
    .delete(coupleMessages)
    .where(
      and(isNull(coupleMessages.deliveredAt), lt(coupleMessages.createdAt, thirtyDaysAgo))
    )
    .returning({ id: coupleMessages.id });

  if (deleted.length > 0) {
    console.log(`[message-purge] Purged ${deleted.length} undelivered messages older than 30 days`);
  }

  return deleted.length;
}

/**
 * Deletes delivered messages that have been ACKed and are older than
 * the retention window (1 hour after delivery).
 *
 * @returns Number of messages cleaned up.
 */
export async function cleanupDeliveredMessages(): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const deleted = await db
    .delete(coupleMessages)
    .where(
      and(isNotNull(coupleMessages.deliveredAt), lt(coupleMessages.deliveredAt, oneHourAgo))
    )
    .returning({ id: coupleMessages.id });

  if (deleted.length > 0) {
    console.log(`[message-purge] Cleaned up ${deleted.length} delivered messages older than 1 hour`);
  }

  return deleted.length;
}
