/**
 * GET  /api/v1/user/public-key  — retrieve the caller's stored ECDH public key.
 * POST /api/v1/user/public-key  — store (or replace) the caller's ECDH public key.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export function OPTIONS() {
  return handleOptions();
}

const publicKeySchema = z.object({
  publicKey: z.string().min(10).max(2048),
  force: z.boolean().optional(),
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

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { publicKey: true },
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
 * Stores the caller's ECDH public key. If a key already exists and differs,
 * returns `{ ok: true, existing: true }` unless `force: true` is passed, in
 * which case the key is overwritten and `keyVersion` is incremented (rotation).
 *
 * @param request - Body: `{ publicKey: string, force?: boolean }` — base64-encoded JWK.
 * @returns JSON `{ ok: true, keyVersion, rotated?, existing?, publicKey? }`.
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
    const { publicKey, force } = publicKeySchema.parse(body);

    // Check if user already has a public key
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { publicKey: true, keyVersion: true },
    });

    if (user?.publicKey && user.publicKey !== publicKey) {
      if (force) {
        // Force rotation — overwrite key and bump version
        const newVersion = (user.keyVersion ?? 1) + 1;
        await db.update(users).set({
          publicKey,
          keyVersion: newVersion,
          keyRotatedAt: new Date(),
        }).where(eq(users.id, userId));
        return NextResponse.json(
          { ok: true, rotated: true, keyVersion: newVersion },
          { headers: corsHeaders() },
        );
      }

      // Key already exists and differs — return existing to client
      return NextResponse.json(
        {
          ok: true,
          existing: true,
          publicKey: user.publicKey,
          keyVersion: user.keyVersion ?? 1,
        },
        { headers: corsHeaders() },
      );
    }

    // Key matches or no key exists — save normally
    const [updated] = await db
      .update(users)
      .set({ publicKey })
      .where(eq(users.id, userId))
      .returning({ keyVersion: users.keyVersion });

    return NextResponse.json(
      { ok: true, keyVersion: updated.keyVersion ?? 1 },
      { headers: corsHeaders() },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to store public key" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
