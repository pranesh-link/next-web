import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
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

  const membership = await prisma.coupleMember.findFirst({
    where: { userId },
    include: {
      couple: {
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
  });

  console.log("[GET /api/v1/couple] membership found:", !!membership, membership?.couple?.members?.length, "members");

  if (!membership) {
    // Debug: check if user exists and if they have any couple memberships
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const allMemberships = await prisma.coupleMember.findMany({
      where: { user: { email: user?.email } },
      select: { userId: true, user: { select: { email: true } } },
    });
    console.log("[GET /api/v1/couple] user email:", user?.email, "memberships by email:", allMemberships);
    return NextResponse.json({ data: null }, { headers: corsHeaders() });
  }

  const couple = membership.couple;
  return NextResponse.json(
    {
      data: {
        id: couple.id,
        name: couple.name,
        createdAt: couple.createdAt.toISOString(),
        members: couple.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          user: m.user,
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
  const existing = await prisma.coupleMember.findFirst({ where: { userId } });
  if (existing) {
    return NextResponse.json(
      { error: "Already in a couple" },
      { status: 409, headers: corsHeaders() },
    );
  }

  const couple = await prisma.couple.create({
    data: {
      name,
      members: {
        create: { userId, role: "OWNER" },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
    },
  });

  return NextResponse.json(
    {
      data: {
        id: couple.id,
        name: couple.name,
        createdAt: couple.createdAt.toISOString(),
        members: couple.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          user: m.user,
        })),
      },
    },
    { status: 201, headers: corsHeaders() },
  );
}
