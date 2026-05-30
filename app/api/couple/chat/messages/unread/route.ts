import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";

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

    const member = await prisma.coupleMember.findFirst({ where: { userId } });
    if (!member) {
      return NextResponse.json({ success: true, data: 0 });
    }

    const count = await prisma.coupleMessage.count({
      where: {
        coupleId: member.coupleId,
        senderId: { not: userId },
        NOT: { readBy: { has: userId } },
      },
    });

    return NextResponse.json({ success: true, data: count });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get unread count" },
      { status: 500 },
    );
  }
}
