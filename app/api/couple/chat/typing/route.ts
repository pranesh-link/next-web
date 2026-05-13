import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { cacheSet } from "@/_lib/redis";

/**
 * PATCH /api/couple/chat/typing
 *
 * Sets a short-lived Redis key indicating the current user is typing.
 * Key: `couple:{coupleId}:typing:{userId}` — TTL 4 seconds.
 * Called on every debounced keystroke from the chat input.
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

  await cacheSet(`couple:${member.coupleId}:typing:${userId}`, 1, 4);

  return new NextResponse(null, { status: 204 });
}
