import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/couple/members
 *
 * Returns id, name, and email for all members of the caller's couple.
 * Used by client components to resolve userId → display name.
 *
 * @returns JSON array of `{ id, name, email }`.
 * @remarks GET · auth: NextAuth session or Bearer JWT.
 */
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
  }

  const membership = await prisma.coupleMember.findFirst({
    where: { userId },
    include: { couple: { include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } } } },
  });

  if (!membership) {
    return NextResponse.json([], { headers: corsHeaders() });
  }

  const members = membership.couple.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
  }));

  return NextResponse.json(members, { headers: corsHeaders() });
}
