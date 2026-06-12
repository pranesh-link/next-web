import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { coupleMembers } from "@db/schema";
import { eq, and } from "drizzle-orm";

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

  const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
  if (!member) {
    return NextResponse.json({ error: "No couple found" }, { status: 404 });
  }

  await db.update(coupleMembers)
    .set({ typingAt: new Date() })
    .where(and(eq(coupleMembers.coupleId, member.coupleId), eq(coupleMembers.userId, userId)));

  return new NextResponse(null, { status: 204 });
}

// Mobile sends POST; keep PATCH for backward compatibility.
export { PATCH as POST };
