"use server";

import { unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { coupleMembers, coupleMessages, messageTypeEnum } from "@db/schema";
import { eq, and, ne, lt, inArray, sql, count } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { sendChatPushNotification } from "@/_services/chat/push-service";

/**
 * Get the coupleId for a given user via the CoupleMember table.
 *
 * @param userId - The authenticated user's id.
 * @returns The coupleId string, or null if the user is not in a couple.
 */
async function getMemberCoupleId(userId: string): Promise<string | null> {
  const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
  return member?.coupleId ?? null;
}

/**
 * Fetch recent messages for the current user's couple, ordered newest first.
 * Supports cursor-based pagination.
 *
 * @param limit - Maximum number of messages to return (default 50, max 100).
 * @param cursor - Message ID to paginate from (returns messages older than this).
 * @returns Result with message array (newest first), or an error.
 * @remarks Auth: requires session.
 */
export async function getMessages(limit = 50, cursor?: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleId = await getMemberCoupleId(user.id);
    if (!coupleId) return { success: false as const, error: "No couple found" };

    const take = Math.min(limit, 100);

    let cursorCreatedAt: Date | undefined;
    if (cursor) {
      const cursorMsg = await db.query.coupleMessages.findFirst({
        where: eq(coupleMessages.id, cursor),
        columns: { createdAt: true },
      });
      cursorCreatedAt = cursorMsg?.createdAt;
    }

    const messages = await db.query.coupleMessages.findMany({
      where: and(
        eq(coupleMessages.coupleId, coupleId),
        cursorCreatedAt ? lt(coupleMessages.createdAt, cursorCreatedAt) : undefined,
      ),
      orderBy: (t, { desc: d }) => [d(t.createdAt)],
      limit: take,
    });

    return { success: true as const, data: messages };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch messages",
    };
  }
}

/**
 * Send a new message to the current user's couple.
 *
 * @param content - The message text content (plaintext or AES-GCM ciphertext).
 * @param type - The message type enum value (default "TEXT").
 * @param iv - Base64-encoded AES-GCM IV; must be provided when content is encrypted.
 * @param encrypted - Whether `content` is E2E-encrypted ciphertext.
 * @returns Result with the created CoupleMessage record, or an error.
 * @remarks Auth: requires session.
 */
export async function sendMessage(
  content: string,
  type = "TEXT",
  iv?: string,
  encrypted = false,
) {
  if (!content || content.trim().length === 0) {
    return { success: false as const, error: "Message cannot be empty" };
  }
  if (content.length > 20_000) {
    return { success: false as const, error: "Message too long" };
  }
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleId = await getMemberCoupleId(user.id);
    if (!coupleId) return { success: false as const, error: "No couple found" };

    const [message] = await db.insert(coupleMessages).values({
      coupleId,
      senderId: user.id,
      type: type as typeof messageTypeEnum.enumValues[number],
      content: encrypted ? content : content.trim(),
      iv: encrypted ? iv : undefined,
      encrypted,
      readBy: [user.id],
    }).returning();

    // Fire-and-forget push notification to partner
    sendChatPushNotification(user.id, coupleId).catch(() => {});

    return { success: true as const, data: message };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to send message",
    };
  }
}

/**
 * Mark all unread messages in a couple as read by the current user.
 *
 * @param coupleId - The couple's id to mark messages read within.
 *   The caller must be a member of this couple; otherwise the request is rejected.
 * @returns Result with the count of updated records, or an error.
 * @remarks Auth: requires session.
 */
export async function markAllRead(coupleId: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    // Security: verify the authenticated user is actually a member of this couple.
    const ownCoupleId = await getMemberCoupleId(user.id);
    if (!ownCoupleId || ownCoupleId !== coupleId) {
      return { success: false as const, error: "Forbidden" };
    }

    const updated = await db.update(coupleMessages)
      .set({ readBy: sql`array_append(${coupleMessages.readBy}, ${user.id})` })
      .where(and(
        eq(coupleMessages.coupleId, coupleId),
        sql`NOT (${user.id} = ANY(${coupleMessages.readBy}))`,
      ))
      .returning({ id: coupleMessages.id });

    return { success: true as const, data: { count: updated.length } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to mark messages as read",
    };
  }
}

/**
 * Count unread messages for the current user in their couple.
 *
 * @returns Result with the integer unread count, or an error.
 * @remarks Auth: requires session.
 */
export async function getUnreadCount() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleId = await getMemberCoupleId(user.id);
    if (!coupleId) return { success: true as const, data: 0 };

    const result = await db.select({ value: count() })
      .from(coupleMessages)
      .where(and(
        eq(coupleMessages.coupleId, coupleId),
        sql`NOT (${user.id} = ANY(${coupleMessages.readBy}))`,
      ));
    const unreadCount = result[0]?.value ?? 0;

    return { success: true as const, data: unreadCount };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to get unread count",
    };
  }
}

/**
 * Fetch unencrypted messages sent by the current user (for client-side encryption migration).
 *
 * @returns Result with array of { id, content } for messages where encrypted=false and senderId=currentUser.
 * @remarks Auth: requires session. Only returns user's own messages.
 */
export async function getUnencryptedMessages() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleId = await getMemberCoupleId(user.id);
    if (!coupleId) return { success: false as const, error: "No couple found" };

    const messages = await db.query.coupleMessages.findMany({
      where: and(
        eq(coupleMessages.coupleId, coupleId),
        eq(coupleMessages.senderId, user.id),
        eq(coupleMessages.encrypted, false),
      ),
      columns: { id: true, content: true },
      orderBy: (t, { asc: a }) => [a(t.createdAt)],
    });

    return { success: true as const, data: messages };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch unencrypted messages",
    };
  }
}

/**
 * Batch-update messages with their encrypted content (client-side migration).
 *
 * @param batch - Array of { id, content (ciphertext), iv } objects. Max 100 per call.
 * @returns Result with the count of updated messages, or an error.
 * @remarks Auth: requires session. Only updates messages owned by the caller within their couple.
 */
export async function encryptExistingMessages(
  batch: { id: string; content: string; iv: string }[],
) {
  if (!batch || batch.length === 0) {
    return { success: false as const, error: "Empty batch" };
  }
  if (batch.length > 100) {
    return { success: false as const, error: "Batch too large (max 100)" };
  }

  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleId = await getMemberCoupleId(user.id);
    if (!coupleId) return { success: false as const, error: "No couple found" };

    const ids = batch.map((m) => m.id);

    // Verify ownership: all messages must belong to this user in this couple
    const owned = await db.query.coupleMessages.findMany({
      where: and(
        inArray(coupleMessages.id, ids),
        eq(coupleMessages.coupleId, coupleId),
        eq(coupleMessages.senderId, user.id),
        eq(coupleMessages.encrypted, false),
      ),
      columns: { id: true },
    });
    const ownedIds = new Set(owned.map((m) => m.id));

    let updated = 0;
    for (const item of batch) {
      if (!ownedIds.has(item.id)) continue;
      await db.update(coupleMessages)
        .set({ content: item.content, iv: item.iv, encrypted: true })
        .where(eq(coupleMessages.id, item.id));
      updated++;
    }

    return { success: true as const, data: { updated } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to encrypt messages",
    };
  }
}
