import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";

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
    const member = await prisma.coupleMember.findFirst({
      where: { userId },
      select: { coupleId: true },
    });
    if (!member) {
      return NextResponse.json(
        { success: false, error: "No couple found" },
        { status: 404 },
      );
    }

    // Mark as delivered (only messages in this couple, not already delivered)
    const result = await prisma.coupleMessage.updateMany({
      where: {
        id: { in: messageIds },
        coupleId: member.coupleId,
        senderId: { not: userId },
        deliveredAt: null,
      },
      data: { deliveredAt: new Date() },
    });

    return NextResponse.json({ success: true, acknowledged: result.count });
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
