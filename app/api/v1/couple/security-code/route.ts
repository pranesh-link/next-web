import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { coupleMembers, users } from "@db/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * GET — Retrieve the security code (safety number) for the current couple.
 * Derived from SHA-256 of both partners' sorted public keys.
 *
 * @returns JSON `{ code: "123-456-789-012" | null }`.
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

    const member = await db.query.coupleMembers.findFirst({
      where: eq(coupleMembers.userId, userId),
      columns: { coupleId: true },
    });
    if (!member) {
      return NextResponse.json({ success: true, code: null });
    }

    // Get both members' public keys
    const memberRows = await db
      .select({ userId: coupleMembers.userId })
      .from(coupleMembers)
      .where(eq(coupleMembers.coupleId, member.coupleId));

    const memberUserIds = memberRows.map((m) => m.userId);
    const memberUsers =
      memberUserIds.length > 0
        ? await db
            .select({ publicKey: users.publicKey })
            .from(users)
            .where(inArray(users.id, memberUserIds))
        : [];

    const keys = memberUsers
      .map((m) => m.publicKey)
      .filter((k): k is string => !!k)
      .sort();

    if (keys.length < 2) {
      return NextResponse.json({ success: true, code: null });
    }

    // SHA-256 of sorted concatenated keys → 12-digit code
    const encoder = new TextEncoder();
    const data = encoder.encode(keys.join(""));
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = new Uint8Array(hashBuffer);

    // Take first 6 bytes → convert to 12-digit decimal code
    let numericCode = "";
    for (let i = 0; i < 6; i++) {
      const twoDigit = (hashArray[i] % 100).toString().padStart(2, "0");
      numericCode += twoDigit;
    }
    const code = `${numericCode.slice(0, 3)}-${numericCode.slice(3, 6)}-${numericCode.slice(6, 9)}-${numericCode.slice(9, 12)}`;

    return NextResponse.json({ success: true, code });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to compute security code" },
      { status: 500 },
    );
  }
}
