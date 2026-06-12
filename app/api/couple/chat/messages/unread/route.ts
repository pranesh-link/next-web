import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { coupleMembers, coupleMessages } from "@db/schema";
import { eq, and, ne, sql, count } from "drizzle-orm";

/**
 * GET — Return the count of unread messages (partner's messages not in current user's readBy).
 *
 * @returns JSON `{ success, data: number }`.
 * @remarks GET · auth: NextAuth session or Bearer JWT.
 */
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) {
      return NextResponse.json({ success: true, data: 0 });
    }

    const result = await db.select({ value: count() })
      .from(coupleMessages)
      .where(and(
        eq(coupleMessages.coupleId, member.coupleId),
        ne(coupleMessages.senderId, userId),
        sql`NOT (${userId} = ANY(${coupleMessages.readBy}))`,
      ));
    const unreadCount = result[0]?.value ?? 0;

    return NextResponse.json({ success: true, data: unreadCount });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get unread count" },
      { status: 500 },
    );
  }
}
