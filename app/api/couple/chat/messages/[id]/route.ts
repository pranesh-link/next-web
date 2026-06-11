import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { coupleMembers, coupleMessages } from "@db/schema";
import { eq, and } from "drizzle-orm";

/**
 * PATCH — Update a message's payload (e.g., toggling list items).
 *
 * @param request - Body: `{ payload: object }`.
 * @returns JSON `{ success, data: CoupleMessage }`.
 * @remarks PATCH · auth: NextAuth session or Bearer JWT.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { id: messageId } = await params;

    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) {
      return NextResponse.json({ success: false, error: "No couple found" }, { status: 404 });
    }

    const message = await db.query.coupleMessages.findFirst({
      where: and(eq(coupleMessages.id, messageId), eq(coupleMessages.coupleId, member.coupleId)),
    });
    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found" }, { status: 404 });
    }

    const body = await request.json();
    const patchPayload = body?.payload as Record<string, unknown> | undefined;
    if (!patchPayload) {
      return NextResponse.json({ success: false, error: "No payload provided" }, { status: 400 });
    }

    // Merge patch into existing payload
    const existingPayload = (message.payload as Record<string, unknown>) ?? {};

    // Handle list item toggle specifically
    if (patchPayload.itemIndex !== undefined && patchPayload.checked !== undefined) {
      const items = [...((existingPayload.items as Array<Record<string, unknown>>) ?? [])];
      const idx = patchPayload.itemIndex as number;
      if (idx >= 0 && idx < items.length) {
        items[idx] = { ...items[idx], checked: patchPayload.checked };
      }
      existingPayload.items = items;
    } else {
      // Generic merge
      Object.assign(existingPayload, patchPayload);
    }

    const [updated] = await db.update(coupleMessages)
      .set({ payload: existingPayload })
      .where(eq(coupleMessages.id, messageId))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update message" },
      { status: 500 },
    );
  }
}

/**
 * DELETE — Delete a message (only sender can delete).
 *
 * @returns JSON `{ success: true }`.
 * @remarks DELETE · auth: NextAuth session or Bearer JWT.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const { id: messageId } = await params;

    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) {
      return NextResponse.json({ success: false, error: "No couple found" }, { status: 404 });
    }

    const message = await db.query.coupleMessages.findFirst({
      where: and(
        eq(coupleMessages.id, messageId),
        eq(coupleMessages.coupleId, member.coupleId),
        eq(coupleMessages.senderId, userId),
      ),
    });
    if (!message) {
      return NextResponse.json({ success: false, error: "Message not found or not yours" }, { status: 404 });
    }

    await db.delete(coupleMessages).where(eq(coupleMessages.id, messageId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to delete message" },
      { status: 500 },
    );
  }
}
