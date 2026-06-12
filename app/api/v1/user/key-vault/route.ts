import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

const vaultSchema = z.object({
  vault: z.string().min(1).max(10_000),
});

/**
 * GET — Retrieve the encrypted key vault blob for the authenticated user.
 *
 * @returns JSON `{ vault: base64 | null }`.
 */
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { encryptedKeyVault: true },
    });

    const vault = user?.encryptedKeyVault
      ? Buffer.from(user.encryptedKeyVault).toString("base64")
      : null;

    return NextResponse.json({ success: true, vault });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch vault" },
      { status: 500 },
    );
  }
}

/**
 * POST — Store or update the encrypted key vault blob.
 * The vault is a base64-encoded AES-256-GCM ciphertext of the user's
 * private key, encrypted with a PIN-derived key the server never sees.
 *
 * @param request - Body: `{ vault: string (base64) }`.
 * @returns JSON `{ success: true }`.
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { vault } = vaultSchema.parse(body);

    const vaultBuffer = Buffer.from(vault, "base64");

    await db.update(users).set({ encryptedKeyVault: vaultBuffer }).where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid vault data" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to store vault" },
      { status: 500 },
    );
  }
}
