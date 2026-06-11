/**
 * GET  /api/v1/couple/chats  — list all chat threads for the authenticated user's couple.
 * POST /api/v1/couple/chats  — create a new chat thread.
 */

import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getCoupleIdForUser } from "@/_services/finance/couple-service";
import { db } from "@db";
import { coupleChats, coupleChatMessages } from "@db/schema";
import { eq, inArray, desc } from "drizzle-orm";

export function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/couple/chats
 *
 * Returns all chat threads belonging to the caller's couple, ordered by most
 * recently updated first. Each entry includes the first 80 characters of the
 * latest message as `lastMessage`.
 *
 * @returns JSON array of `{ id, title, updatedAt, lastMessage }`.
 * @remarks Auth: requires session or Bearer JWT.
 */
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleId = await getCoupleIdForUser(userId);
    if (!coupleId) {
      return NextResponse.json(
        { error: "No couple found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const chats = await db.query.coupleChats.findMany({
      where: eq(coupleChats.coupleId, coupleId),
      orderBy: (t, { desc: d }) => [d(t.updatedAt)],
    });

    const chatIds = chats.map((c) => c.id);
    const lastMessages =
      chatIds.length > 0
        ? await db
            .select({
              chatId: coupleChatMessages.chatId,
              content: coupleChatMessages.content,
              createdAt: coupleChatMessages.createdAt,
            })
            .from(coupleChatMessages)
            .where(inArray(coupleChatMessages.chatId, chatIds))
            .orderBy(desc(coupleChatMessages.createdAt))
        : [];

    // Build a map of chatId → last message content (first entry per chatId is newest)
    const lastMessageMap = new Map<string, string | null>();
    for (const msg of lastMessages) {
      if (!lastMessageMap.has(msg.chatId)) {
        lastMessageMap.set(msg.chatId, msg.content?.slice(0, 80) ?? null);
      }
    }

    const data = chats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      updatedAt: chat.updatedAt,
      lastMessage: lastMessageMap.get(chat.id) ?? null,
    }));

    return NextResponse.json(data, { headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch chats" },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/**
 * POST /api/v1/couple/chats
 *
 * Creates a new chat thread for the caller's couple.
 *
 * @param request - Request body: `{ title?: string }`. Defaults to `"New chat"`.
 * @returns JSON `{ id, title, createdAt }`.
 * @remarks Auth: requires session or Bearer JWT.
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleId = await getCoupleIdForUser(userId);
    if (!coupleId) {
      return NextResponse.json(
        { error: "No couple found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = (await request.json()) as { title?: string };

    const [chat] = await db
      .insert(coupleChats)
      .values({
        coupleId,
        title: body.title ?? "New chat",
      })
      .returning();

    return NextResponse.json(
      { id: chat.id, title: chat.title, createdAt: chat.createdAt },
      { status: 201, headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create chat" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
