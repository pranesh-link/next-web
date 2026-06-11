import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { coupleMembers, coupleMessages } from "@db/schema";
import { eq, and, ne, inArray, isNull } from "drizzle-orm";
import { sendPushToUser } from "@/_services/finance/push-service";

const ackSchema = z.object({
  messageIds: z.array(z.string().uuid()).min(1).max(100),
});

/**
 * POST — Acknowledge delivery of messages. Marks them as delivered and
 * schedules deletion from the server (ephemeral relay model).
 *
 * @returns JSON with count of messages acknowledged.
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { messageIds } = ackSchema.parse(body);

    // Verify user is in a couple and only ACKs messages from their couple
    const member = await db.query.coupleMembers.findFirst({
      where: eq(coupleMembers.userId, userId),
      columns: { coupleId: true },
    });
    if (!member) {
      return NextResponse.json(
        { success: false, error: "No couple found" },
        { status: 404 },
      );
    }

    // Mark as delivered (only messages in this couple, not already delivered)
    const updated = await db.update(coupleMessages)
      .set({ deliveredAt: new Date() })
      .where(and(
        inArray(coupleMessages.id, messageIds),
        eq(coupleMessages.coupleId, member.coupleId),
        ne(coupleMessages.senderId, userId),
        isNull(coupleMessages.deliveredAt),
      ))
      .returning({ id: coupleMessages.id });

    // Silent push to sender: notify their device to show double-tick
    if (updated.length > 0) {
      const senderIds = await db.selectDistinct({ senderId: coupleMessages.senderId })
        .from(coupleMessages)
        .where(and(inArray(coupleMessages.id, messageIds), eq(coupleMessages.coupleId, member.coupleId)));
      for (const { senderId } of senderIds) {
        sendPushToUser(senderId, '', '', {
          type: 'MESSAGE_DELIVERED',
          messageIds: messageIds.join(','),
          silent: 'true',
        }).catch(() => {});
      }
    }

    // Ephemeral relay model — deliveredAt is now stamped. The cron job at
    // /api/v1/couple/chat/purge handles deletion of delivered messages after
    // a 1-hour grace window, giving any device time to re-fetch history
    // if its local DB was reset. Do NOT delete immediately here.
    // (Previous behaviour: deleteMany immediately after ACK — this caused
    // permanent history loss on reinstall / local DB reset.)

    return NextResponse.json({ success: true, acknowledged: updated.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to acknowledge messages" },
      { status: 500 },
    );
  }
}
