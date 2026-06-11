import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { couples, coupleMembers, users } from "@db/schema";
import { eq, inArray } from "drizzle-orm";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/couple
 *
 * Returns the caller's couple with members and user details.
 *
 * @returns JSON `{ data: Couple | null }`.
 * @remarks GET · auth: Bearer JWT.
 */
export async function GET() {
  const userId = await getAuthUserId();
  console.log("[GET /api/v1/couple] userId from auth:", userId);
  
  if (!userId) {
    console.log("[GET /api/v1/couple] Unauthorized - no userId");
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders() },
    );
  }

  const membership = await db.query.coupleMembers.findFirst({
    where: eq(coupleMembers.userId, userId),
  });

  console.log("[GET /api/v1/couple] membership found:", !!membership);

  if (!membership) {
    // Debug: check if user exists and if they have any couple memberships
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { email: true },
    });
    const allMemberships = user?.email
      ? await db
          .select({ userId: coupleMembers.userId, email: users.email })
          .from(coupleMembers)
          .innerJoin(users, eq(coupleMembers.userId, users.id))
          .where(eq(users.email, user.email))
      : [];
    console.log("[GET /api/v1/couple] user email:", user?.email, "memberships by email:", allMemberships);
    return NextResponse.json({ data: null }, { headers: corsHeaders() });
  }

  const couple = await db.query.couples.findFirst({
    where: eq(couples.id, membership.coupleId),
  });

  if (!couple) {
    return NextResponse.json({ data: null }, { headers: corsHeaders() });
  }

  const members = await db.query.coupleMembers.findMany({
    where: eq(coupleMembers.coupleId, membership.coupleId),
  });

  const memberUserIds = members.map((m) => m.userId);
  const memberUsers =
    memberUserIds.length > 0
      ? await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
          })
          .from(users)
          .where(inArray(users.id, memberUserIds))
      : [];

  const userMap = new Map(memberUsers.map((u) => [u.id, u]));

  return NextResponse.json(
    {
      data: {
        id: couple.id,
        name: couple.name,
        createdAt: couple.createdAt.toISOString(),
        members: members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          user: userMap.get(m.userId) ?? null,
        })),
      },
    },
    { headers: corsHeaders() },
  );
}

/**
 * POST /api/v1/couple
 *
 * Create a new couple with the caller as OWNER.
 *
 * @remarks POST · auth: Bearer JWT.
 */
export async function POST(req: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders() },
    );
  }

  const body = await req.json();
  const name = body?.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400, headers: corsHeaders() },
    );
  }

  // Check if already in a couple
  const existing = await db.query.coupleMembers.findFirst({
    where: eq(coupleMembers.userId, userId),
  });
  if (existing) {
    return NextResponse.json(
      { error: "Already in a couple" },
      { status: 409, headers: corsHeaders() },
    );
  }

  const { coupleRow, memberRow } = await db.transaction(async (tx) => {
    const [newCouple] = await tx.insert(couples).values({ name }).returning();
    const [newMember] = await tx
      .insert(coupleMembers)
      .values({ coupleId: newCouple.id, userId, role: "OWNER" })
      .returning();
    return { coupleRow: newCouple, memberRow: newMember };
  });

  const memberUserRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId));
  const memberUser = memberUserRows[0] ?? null;

  return NextResponse.json(
    {
      data: {
        id: coupleRow.id,
        name: coupleRow.name,
        createdAt: coupleRow.createdAt.toISOString(),
        members: [
          {
            id: memberRow.id,
            userId: memberRow.userId,
            role: memberRow.role,
            user: memberUser,
          },
        ],
      },
    },
    { status: 201, headers: corsHeaders() },
  );
}
