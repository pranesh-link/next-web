import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { AccountType } from "@prisma/client";
import { accountSchema } from "@/_lib/validations/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { withCache } from "@/_lib/middleware/cache";
import { withRateLimit } from "@/_lib/middleware/rate-limit";
import { CacheInvalidation } from "@/_lib/cache-invalidation";

export async function OPTIONS() {
  return handleOptions();
}

async function getHandler() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleUserIds = await getUserIdsForCouple(userId);

    const accounts = await prisma.financialAccount.findMany({
      where: { userId: { in: coupleUserIds } },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { success: true, data: accounts, currentUserId: userId },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch accounts",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const GET = withRateLimit(
  withCache(getHandler, { ttl: 300, keyPrefix: 'finance:accounts' }),
  { max: 100, window: 60 }
);

async function postHandler(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleId = await getCoupleIdForUser(userId);

    const body = await request.json();
    const validated = accountSchema.parse(body);

    const account = await prisma.financialAccount.create({
      data: {
        userId: userId,
        ...(coupleId ? { coupleId } : {}),
        name: validated.name,
        type: validated.type as AccountType,
        balance: validated.balance,
      },
    });

    await CacheInvalidation.onAccountChange(userId);

    return NextResponse.json(
      { success: true, data: account },
      { status: 201, headers: corsHeaders() },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400, headers: corsHeaders() },
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create account",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const POST = withRateLimit(postHandler, { max: 30, window: 60 });
