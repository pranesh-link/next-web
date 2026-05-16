import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";

/**
 * PATCH /api/couple/chat/typing
 *
 * Stamps `typingAt = now()` on the caller's CoupleMember row.
 * The SSE stream checks this timestamp to emit `partnerTyping: true`
 * when the stamp is within the last 6 seconds.
 *
 * @returns 204 on success, 401/404 on auth/couple failure.
 * @remarks PATCH · auth: NextAuth session or Bearer JWT.
 */
export async function PATCH() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.coupleMember.findFirst({ where: { userId } });
  if (!member) {
    return NextResponse.json({ error: "No couple found" }, { status: 404 });
  }

  await prisma.coupleMember.update({
    where: { coupleId_userId: { coupleId: member.coupleId, userId } },
    data: { typingAt: new Date() },
  });

  return new NextResponse(null, { status: 204 });
}
