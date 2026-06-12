import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { coupleMembers, coupleMessages } from "@db/schema";
import { eq, and, ne, inArray } from "drizzle-orm";
import { sendPushToUser } from "@/_services/finance/push-service";

const ackSchema = z.object({
  messageIds: z.array(z.string().uuid()).min(1).max(100),
});

/**
 * POST — Acknowledge delivery of messages.
 *
 * - Sets deliveredAt on the messages.
 * - For TEXT/VOICE/REMINDER/MILESTONE messages: deletes them from the server
 *   immediately (both sender stored on send, receiver stores on ACK).
 * - For IMAGE messages: marks deliveredAt but does NOT delete yet — deletion
 *   happens after both parties have downloaded the image
 *   (POST /api/v1/couple/chat/[id]/file-downloaded).
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

    // Fetch messages to know their type and senderId
    const messages = await db.select({
      id: coupleMessages.id,
      senderId: coupleMessages.senderId,
      type: coupleMessages.type,
      deliveredAt: coupleMessages.deliveredAt,
    })
      .from(coupleMessages)
      .where(and(
        inArray(coupleMessages.id, messageIds),
        eq(coupleMessages.coupleId, member.coupleId),
        ne(coupleMessages.senderId, userId),
      ));

    const toUpdate = messages.filter((m) => m.deliveredAt === null);

    if (toUpdate.length > 0) {
      await db.update(coupleMessages)
        .set({ deliveredAt: new Date() })
        .where(inArray(coupleMessages.id, toUpdate.map((m) => m.id)));

      // Silent push to sender: show double-tick
      const senderIds = [...new Set(toUpdate.map((m) => m.senderId))];
      for (const senderId of senderIds) {
        sendPushToUser(senderId, "", "", {
          type: "MESSAGE_DELIVERED",
          messageIds: toUpdate.map((m) => m.id).join(","),
          silent: "true",
        }).catch(() => {});
      }
    }

    // Ephemeral relay: delete non-image messages immediately.
    // Both parties have a local copy — sender stored on send, receiver just ACKed.
    const deletableTypes = new Set(["TEXT", "VOICE", "REMINDER", "MILESTONE", "LIST"]);
    const toDelete = messages.filter((m) => deletableTypes.has(m.type));

    if (toDelete.length > 0) {
      await db.delete(coupleMessages)
        .where(inArray(coupleMessages.id, toDelete.map((m) => m.id)));
    }

    // IMAGE messages: mark delivered but keep until both download the file.
    // (Handled by POST /api/v1/couple/chat/[id]/file-downloaded)

    return NextResponse.json({
      success: true,
      acknowledged: toUpdate.length,
      deleted: toDelete.length,
    });
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

