import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { MessageType } from "@prisma/client";

const sendMessageSchema = z.object({
  content: z.string().min(1).max(20_000),
  type: z.nativeEnum(MessageType).optional().default(MessageType.TEXT),
  iv: z.string().optional(),
  encrypted: z.boolean().optional().default(false),
});

/**
 * GET — Return the last 50 messages for the current user's couple.
 *
 * @returns JSON `{ success, data: CoupleMessage[] }`.
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
      return NextResponse.json({ success: true, data: [] });
    }

    const messages = await prisma.coupleMessage.findMany({
      where: { coupleId: member.coupleId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

/**
 * POST — Create a new message for the current user's couple.
 *
 * @param request - Body: `{ content: string; type?: MessageType }`.
 * @returns JSON `{ success, data: CoupleMessage }` with HTTP 201.
 * @remarks POST · auth: NextAuth session or Bearer JWT.
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const member = await prisma.coupleMember.findFirst({ where: { userId } });
    if (!member) {
      return NextResponse.json({ success: false, error: "No couple found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = sendMessageSchema.parse(body);

    const message = await prisma.coupleMessage.create({
      data: {
        coupleId: member.coupleId,
        senderId: userId,
        type: validated.type,
        content: validated.encrypted ? validated.content : validated.content.trim(),
        iv: validated.encrypted ? validated.iv : undefined,
        encrypted: validated.encrypted,
        readBy: [userId],
      },
    });

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 500 },
    );
  }
}
