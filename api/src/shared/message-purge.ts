/**
 * Chat message purge — no Next.js dependencies.
 */
import { deleteStorageFiles } from "./supabase-storage.js";
import { db } from "./db.js";
import { coupleMessages } from "./schema.js";
import { and, isNull, isNotNull, lt, inArray } from "drizzle-orm";

export async function purgeExpiredMessages(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const deleted = await db
    .delete(coupleMessages)
    .where(and(isNull(coupleMessages.deliveredAt), lt(coupleMessages.createdAt, thirtyDaysAgo)))
    .returning({ id: coupleMessages.id });
  if (deleted.length > 0) console.log(`[purge] Expired: ${deleted.length}`);
  return deleted.length;
}

export async function cleanupDeliveredMessages(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const stale = await db
    .select({ id: coupleMessages.id, fileStoragePath: coupleMessages.fileStoragePath })
    .from(coupleMessages)
    .where(and(isNotNull(coupleMessages.deliveredAt), lt(coupleMessages.deliveredAt, oneDayAgo), inArray(coupleMessages.type, ["IMAGE", "VOICE"])));
  if (stale.length === 0) return 0;
  const paths = stale.map((m) => m.fileStoragePath).filter(Boolean) as string[];
  if (paths.length > 0) await deleteStorageFiles(paths);
  const deleted = await db
    .delete(coupleMessages)
    .where(and(isNotNull(coupleMessages.deliveredAt), lt(coupleMessages.deliveredAt, oneDayAgo), inArray(coupleMessages.type, ["IMAGE", "VOICE"])))
    .returning({ id: coupleMessages.id });
  if (deleted.length > 0) console.log(`[purge] Stale media: ${deleted.length}`);
  return deleted.length;
}
