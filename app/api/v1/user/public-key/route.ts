/**
 * GET  /api/v1/user/public-key  — retrieve the caller's stored ECDH public key.
 * POST /api/v1/user/public-key  — store (or replace) the caller's ECDH public key.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import prisma from "@/_lib/prisma";

export function OPTIONS() {
  return handleOptions();
}

const publicKeySchema = z.object({
  publicKey: z.string().min(10).max(2048),
});

/**
 * GET /api/v1/user/public-key
 *
 * Returns the caller's stored base64 JWK ECDH public key, or null if none has
 * been uploaded yet.
 *
 * @returns JSON `{ publicKey: string | null }`.
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { publicKey: true },
    });

    return NextResponse.json(
      { publicKey: user?.publicKey ?? null },
      { headers: corsHeaders() },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch public key" },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/**
 * POST /api/v1/user/public-key
 *
 * Stores the caller's ECDH public key. If a key already exists, it is NOT
 * overwritten (to prevent key-mismatch issues with previously encrypted
 * messages). Returns `{ ok: true, existing: true }` if the key was already set.
 *
 * @param request - Body: `{ publicKey: string }` — base64-encoded JWK.
 * @returns JSON `{ ok: true, existing?: true, publicKey?: string }`.
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

    const body = await request.json();
    const { publicKey } = publicKeySchema.parse(body);

    // Check if user already has a public key — don't overwrite
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { publicKey: true },
    });

    if (user?.publicKey && user.publicKey !== publicKey) {
      // Key already exists and differs — return existing to client
      return NextResponse.json(
        { ok: true, existing: true, publicKey: user.publicKey },
        { headers: corsHeaders() },
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { publicKey },
    });

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  } catch {
    return NextResponse.json(
      { error: "Failed to store public key" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
