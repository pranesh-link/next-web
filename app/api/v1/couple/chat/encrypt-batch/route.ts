/**
 * GET   /api/v1/couple/chat/encrypt-batch — fetch unencrypted messages sent by caller.
 * PATCH /api/v1/couple/chat/encrypt-batch — batch-update messages with encrypted content.
 * DELETE /api/v1/couple/chat/encrypt-batch — remove undecryptable messages by IDs.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getCoupleIdForUser } from "@/_services/finance/couple-service";
import prisma from "@/_lib/prisma";

export function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/couple/chat/encrypt-batch
 *
 * Returns unencrypted messages sent by the authenticated user within their couple.
 *
 * @returns JSON `{ data: { id, content }[] }`.
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

    const messages = await prisma.coupleMessage.findMany({
      where: { coupleId, senderId: userId, encrypted: false },
      select: { id: true, content: true },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ data: messages }, { headers: corsHeaders() });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/**
 * PATCH /api/v1/couple/chat/encrypt-batch
 *
 * Batch-update messages with their E2E-encrypted content.
 * Body: `{ batch: { id: string, content: string, iv: string }[] }` (max 100).
 *
 * @returns JSON `{ data: { updated: number } }`.
 */
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const batch = body?.batch as { id: string; content: string; iv: string }[] | undefined;

    if (!batch || !Array.isArray(batch) || batch.length === 0) {
      return NextResponse.json(
        { error: "Empty batch" },
        { status: 400, headers: corsHeaders() },
      );
    }
    if (batch.length > 100) {
      return NextResponse.json(
        { error: "Batch too large (max 100)" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const ids = batch.map((m) => m.id);

    // Verify ownership: all must belong to this user in this couple and be unencrypted
    const owned = await prisma.coupleMessage.findMany({
      where: { id: { in: ids }, coupleId, senderId: userId, encrypted: false },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((m) => m.id));

    let updated = 0;
    for (const item of batch) {
      if (!ownedIds.has(item.id)) continue;
      await prisma.coupleMessage.update({
        where: { id: item.id },
        data: { content: item.content, iv: item.iv, encrypted: true },
      });
      updated++;
    }

    return NextResponse.json({ data: { updated } }, { headers: corsHeaders() });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/**
 * DELETE /api/v1/couple/chat/encrypt-batch
 *
 * Removes encrypted messages that can't be decrypted (key mismatch).
 * Body: `{ ids: string[] }` — message IDs to delete. Must belong to the caller's couple.
 * Max 200 per call.
 *
 * @returns JSON `{ data: { deleted: number } }`.
 */
export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const ids = body?.ids as string[] | undefined;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No IDs provided" },
        { status: 400, headers: corsHeaders() },
      );
    }
    if (ids.length > 200) {
      return NextResponse.json(
        { error: "Too many IDs (max 200)" },
        { status: 400, headers: corsHeaders() },
      );
    }

    // Only delete encrypted messages within the caller's couple
    const result = await prisma.coupleMessage.deleteMany({
      where: { id: { in: ids }, coupleId, encrypted: true },
    });

    return NextResponse.json(
      { data: { deleted: result.count } },
      { headers: corsHeaders() },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
