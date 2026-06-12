import { deleteStorageFiles } from "@/_lib/supabase-storage";
import { db } from "@db";
import { coupleMessages } from "@db/schema";
import { and, isNull, isNotNull, lt, inArray } from "drizzle-orm";

/**
 * Purges undelivered messages older than 30 days.
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
 * Backup cleanup for IMAGE messages that were delivered but never had
 * file-downloaded ACKs from both parties (e.g. app uninstalled, DB reset).
 * Runs after a 24-hour grace window.
 * Also deletes the Supabase Storage file if still present.
 *
 * @returns Number of messages cleaned up.
 */
export async function cleanupDeliveredMessages(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Find IMAGE/VOICE messages delivered but not yet fully downloaded
  const stale = await db
    .select({ id: coupleMessages.id, fileStoragePath: coupleMessages.fileStoragePath })
    .from(coupleMessages)
    .where(
      and(
        isNotNull(coupleMessages.deliveredAt),
        lt(coupleMessages.deliveredAt, oneDayAgo),
        inArray(coupleMessages.type, ["IMAGE", "VOICE"]),
      )
    );

  if (stale.length === 0) return 0;

  // Delete storage files via REST helper
  const paths = stale.map((m) => m.fileStoragePath).filter(Boolean) as string[];
  if (paths.length > 0) {
    await deleteStorageFiles(paths);
  }

  // Delete message rows
  const deleted = await db
    .delete(coupleMessages)
    .where(
      and(
        isNotNull(coupleMessages.deliveredAt),
        lt(coupleMessages.deliveredAt, oneDayAgo),
        inArray(coupleMessages.type, ["IMAGE", "VOICE"]),
      )
    )
    .returning({ id: coupleMessages.id });

  if (deleted.length > 0) {
    console.log(`[message-purge] Cleaned up ${deleted.length} stale image/voice messages`);
  }

  return deleted.length;
}

