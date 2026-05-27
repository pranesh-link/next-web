/**
 * GET /api/v1/couple/partner-public-key
 *
 * Returns the ECDH public key of the caller's partner so the caller can derive
 * the shared AES-256-GCM encryption key on-device.
 */

import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getCoupleIdForUser } from "@/_services/finance/couple-service";
import prisma from "@/_lib/prisma";

export function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/couple/partner-public-key
 *
 * Looks up the caller's couple, finds the other member, and returns their
 * stored ECDH public key.
 *
 * @returns JSON `{ publicKey: string | null }`.
 *   `null` means the partner has not yet uploaded a key (encryption cannot
 *   proceed until both sides have keys).
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

    // Find the other member of the couple (not the caller).
    const partnerMember = await prisma.coupleMember.findFirst({
      where: { coupleId, userId: { not: userId } },
      select: { userId: true },
    });

    if (!partnerMember) {
      return NextResponse.json(
        { publicKey: null },
        { headers: corsHeaders() },
      );
    }

    const partner = await prisma.user.findUnique({
      where: { id: partnerMember.userId },
      select: { publicKey: true },
    });

    return NextResponse.json(
      { publicKey: partner?.publicKey ?? null },
      { headers: corsHeaders() },
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch partner public key" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
