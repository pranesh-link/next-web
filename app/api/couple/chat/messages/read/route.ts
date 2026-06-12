import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { coupleMembers, coupleMessages } from "@db/schema";
import { eq, and, ne, sql } from "drizzle-orm";

/**
 * POST — Mark all unread messages from the partner as read by the current user.
 *
 * @returns JSON `{ success, updated }` with count of messages marked read.
 * @remarks POST · auth: NextAuth session or Bearer JWT.
 */
export async function POST() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) {
      return NextResponse.json({ success: false, error: "No couple found" }, { status: 404 });
    }

    // Find messages sent by partner that the current user hasn't read
    const unreadMessages = await db.select({ id: coupleMessages.id, readBy: coupleMessages.readBy })
      .from(coupleMessages)
      .where(and(
        eq(coupleMessages.coupleId, member.coupleId),
        ne(coupleMessages.senderId, userId),
        sql`NOT (${userId} = ANY(${coupleMessages.readBy}))`,
      ));

    if (unreadMessages.length === 0) {
      return NextResponse.json({ success: true, updated: 0 });
    }

    // Update each message to add current user to readBy array
    await Promise.all(
      unreadMessages.map((msg) =>
        db.update(coupleMessages)
          .set({ readBy: [...msg.readBy, userId] })
          .where(eq(coupleMessages.id, msg.id))
      )
    );

    return NextResponse.json({ success: true, updated: unreadMessages.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to mark as read" },
      { status: 500 },
    );
  }
}
