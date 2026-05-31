import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";

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

    const member = await prisma.coupleMember.findFirst({
      where: { userId },
      select: { coupleId: true },
    });
    if (!member) {
      return NextResponse.json({ success: true, code: null });
    }

    // Get both members' public keys
    const members = await prisma.coupleMember.findMany({
      where: { coupleId: member.coupleId },
      select: { user: { select: { publicKey: true } } },
    });

    const keys = members
      .map((m) => m.user.publicKey)
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
