"use server";

import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { MessageType } from "@prisma/client";

/**
 * Get the coupleId for a given user via the CoupleMember table.
 *
 * @param userId - The authenticated user's id.
 * @returns The coupleId string, or null if the user is not in a couple.
 */
async function getMemberCoupleId(userId: string): Promise<string | null> {
  const member = await prisma.coupleMember.findFirst({ where: { userId } });
  return member?.coupleId ?? null;
}

/**
 * Fetch recent messages for the current user's couple, ordered newest first.
 *
 * @param limit - Maximum number of messages to return (default 50).
 * @returns Result with message array (newest first), or an error.
 * @remarks Auth: requires session.
 */
export async function getMessages(limit = 50) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleId = await getMemberCoupleId(user.id);
    if (!coupleId) return { success: false as const, error: "No couple found" };

    const messages = await prisma.coupleMessage.findMany({
      where: { coupleId },
      orderBy: { createdAt: "desc" },
      take: limit,
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
 * @param content - The message text content.
 * @param type - The message type enum value (default "TEXT").
 * @returns Result with the created CoupleMessage record, or an error.
 * @remarks Auth: requires session.
 * @example
 * const result = await sendMessage("Hello!", "TEXT");
 */
export async function sendMessage(content: string, type = "TEXT") {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleId = await getMemberCoupleId(user.id);
    if (!coupleId) return { success: false as const, error: "No couple found" };

    const message = await prisma.coupleMessage.create({
      data: {
        coupleId,
        senderId: user.id,
        type: type as MessageType,
        content: content.trim(),
        readBy: [user.id],
      },
    });

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
 * @returns Result with the count of updated records, or an error.
 * @remarks Auth: requires session.
 */
export async function markAllRead(coupleId: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const result = await prisma.coupleMessage.updateMany({
      where: {
        coupleId,
        NOT: { readBy: { has: user.id } },
      },
      data: {
        readBy: { push: user.id },
      },
    });

    return { success: true as const, data: result };
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

    const count = await prisma.coupleMessage.count({
      where: {
        coupleId,
        NOT: { readBy: { has: user.id } },
      },
    });

    return { success: true as const, data: count };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to get unread count",
    };
  }
}
