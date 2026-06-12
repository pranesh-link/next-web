/**
 * GET    /api/v1/couple/chats/[chatId]  — load full thread with messages.
 * DELETE /api/v1/couple/chats/[chatId]  — delete thread (cascades to messages).
 * PATCH  /api/v1/couple/chats/[chatId]  — rename thread title.
 */

import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getCoupleIdForUser } from "@/_services/finance/couple-service";
import { db } from "@db";
import { coupleChats, coupleChatMessages } from "@db/schema";
import { eq, and } from "drizzle-orm";

export function OPTIONS() {
  return handleOptions();
}

/**
 * Verifies that the caller owns (via their couple) the given chat thread.
 *
 * @param chatId - The chat thread ID to look up.
 * @returns An object with the resolved `chat` and `coupleId`, or an `error`
 *   + `status` pair when the request should be rejected.
 */
async function getAuthorizedChat(chatId: string) {
  const userId = await getAuthUserId();
  if (!userId) return { error: "Unauthorized" as const, status: 401 };

  const coupleId = await getCoupleIdForUser(userId);
  if (!coupleId) return { error: "No couple found" as const, status: 404 };

  const chat = await db.query.coupleChats.findFirst({
    where: and(eq(coupleChats.id, chatId), eq(coupleChats.coupleId, coupleId)),
  });
  if (!chat) return { error: "Not found" as const, status: 404 };

  return { chat, coupleId };
}

/**
 * GET /api/v1/couple/chats/[chatId]
 *
 * Returns the full chat thread including all messages ordered oldest-first.
 *
 * @param _request - Incoming request (unused; params carry the chatId).
 * @param context - Route context containing `params.chatId`.
 * @returns JSON `{ id, title, createdAt, updatedAt, messages }`.
 * @remarks Auth: requires session or Bearer JWT.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ chatId: string }> },
) {
  try {
    const { chatId } = await context.params;
    const result = await getAuthorizedChat(chatId);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: corsHeaders() },
      );
    }

    const messages = await db.query.coupleChatMessages.findMany({
      where: eq(coupleChatMessages.chatId, chatId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });

    return NextResponse.json(
      { ...result.chat, messages },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch chat" },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/**
 * DELETE /api/v1/couple/chats/[chatId]
 *
 * Deletes the chat thread and all its messages (cascade).
 *
 * @param _request - Incoming request (unused).
 * @param context - Route context containing `params.chatId`.
 * @returns JSON `{ success: true }`.
 * @remarks Auth: requires session or Bearer JWT.
 */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ chatId: string }> },
) {
  try {
    const { chatId } = await context.params;
    const result = await getAuthorizedChat(chatId);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: corsHeaders() },
      );
    }

    await db.delete(coupleChats).where(eq(coupleChats.id, chatId));

    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete chat" },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/**
 * PATCH /api/v1/couple/chats/[chatId]
 *
 * Renames the chat thread title.
 *
 * @param request - Request body: `{ title: string }` (1–100 chars).
 * @param context - Route context containing `params.chatId`.
 * @returns JSON `{ id, title }`.
 * @remarks Auth: requires session or Bearer JWT.
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ chatId: string }> },
) {
  try {
    const { chatId } = await context.params;
    const result = await getAuthorizedChat(chatId);

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: corsHeaders() },
      );
    }

    const body = (await request.json()) as { title?: unknown };

    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return NextResponse.json(
        { error: "title must be a non-empty string" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const [updated] = await db
      .update(coupleChats)
      .set({ title: body.title.trim().slice(0, 100), updatedAt: new Date() })
      .where(eq(coupleChats.id, chatId))
      .returning();

    return NextResponse.json(
      { id: updated.id, title: updated.title },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to rename chat" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
