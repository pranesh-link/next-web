import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";

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

  const member = await prisma.coupleMember.findFirst({ where: { userId } });
  if (!member) {
    return NextResponse.json({ error: "No couple found" }, { status: 404 });
  }

  const message = await prisma.coupleMessage.findFirst({
    where: { id, coupleId: member.coupleId },
  });
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const pinnedAt = message.pinnedAt ? null : new Date();

  await prisma.coupleMessage.update({
    where: { id },
    data: { pinnedAt },
  });

  return NextResponse.json({ success: true, pinnedAt });
}
