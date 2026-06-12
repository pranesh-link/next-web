import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { coupleMembers, users } from "@db/schema";
import { eq, inArray } from "drizzle-orm";
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

  const membership = await db.query.coupleMembers.findFirst({
    where: eq(coupleMembers.userId, userId),
  });

  if (!membership) {
    return NextResponse.json([], { headers: corsHeaders() });
  }

  const members = await db.query.coupleMembers.findMany({
    where: eq(coupleMembers.coupleId, membership.coupleId),
  });

  const memberUserIds = members.map((m) => m.userId);
  const memberUsers =
    memberUserIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, memberUserIds))
      : [];

  const result = memberUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
  }));

  return NextResponse.json(result, { headers: corsHeaders() });
}
