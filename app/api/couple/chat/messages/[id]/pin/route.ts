import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { coupleMembers, coupleMessages } from "@db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/couple/chat/messages/:id/pin
 *
 * Toggles pin status on a message owned by the caller's couple.
 * If already pinned, unpins; otherwise pins with current timestamp.
 *
 * @returns JSON `{ success, pinnedAt }` with HTTP 200.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
  if (!member) {
    return NextResponse.json({ error: "No couple found" }, { status: 404 });
  }

  const message = await db.query.coupleMessages.findFirst({
    where: and(eq(coupleMessages.id, id), eq(coupleMessages.coupleId, member.coupleId)),
  });
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const pinnedAt = message.pinnedAt ? null : new Date();

  await db.update(coupleMessages).set({ pinnedAt }).where(eq(coupleMessages.id, id));

  return NextResponse.json({ success: true, pinnedAt });
}
