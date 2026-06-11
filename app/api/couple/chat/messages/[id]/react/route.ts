import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { coupleMembers, coupleMessages } from "@db/schema";
import { eq, and } from "drizzle-orm";

/**
 * POST — Toggle a reaction emoji on a message.
 * Adds the user's ID to the emoji's reactor list, or removes it if already present.
 *
 * @param request - Body: `{ emoji: string }`.
 * @returns JSON `{ success, data: { reactions } }`.
 * @remarks POST · auth: NextAuth session or Bearer JWT.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { id: messageId } = await params;

    const body = await request.json();
    const emoji = body?.emoji as string;
    if (!emoji || emoji.length > 10) {
      return NextResponse.json({ success: false, error: "Invalid emoji" }, { status: 400 });
    }

    // Verify user is in the couple that owns this message
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) {
      return NextResponse.json({ success: false, error: "No couple found" }, { status: 404 });
    }

    const message = await db.query.coupleMessages.findFirst({
      where: and(eq(coupleMessages.id, messageId), eq(coupleMessages.coupleId, member.coupleId)),
      columns: { id: true, payload: true },
    });
    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    // Get current reactions from payload
    const payload = (message.payload as Record<string, unknown>) ?? {};
    const reactions = (payload.reactions as Record<string, string[]>) ?? {};

    // Toggle: add if not present, remove if already reacted
    const currentReactors = reactions[emoji] ?? [];
    const alreadyReacted = currentReactors.includes(userId);
    const updatedReactors = alreadyReacted
      ? currentReactors.filter((id) => id !== userId)
      : [...currentReactors, userId];

    // Update reactions map (remove emoji key if no reactors left)
    const updatedReactions = { ...reactions };
    if (updatedReactors.length === 0) {
      delete updatedReactions[emoji];
    } else {
      updatedReactions[emoji] = updatedReactors;
    }

    // Save back to payload
    const updatedPayload = { ...payload, reactions: updatedReactions };
    // Remove reactions key entirely if empty
    if (Object.keys(updatedReactions).length === 0) {
      delete (updatedPayload as Record<string, unknown>).reactions;
    }

    await db.update(coupleMessages)
      .set({ payload: Object.keys(updatedPayload).length > 0 ? updatedPayload : undefined })
      .where(eq(coupleMessages.id, messageId));

    return NextResponse.json({ success: true, data: { reactions: updatedReactions } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to react" },
      { status: 500 },
    );
  }
}
