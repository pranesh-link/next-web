import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { financialAccounts, users } from "@db/schema";
import { inArray, desc, eq } from "drizzle-orm";
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

    const accountRows = await db
      .select({
        id: financialAccounts.id,
        userId: financialAccounts.userId,
        name: financialAccounts.name,
        nickname: financialAccounts.nickname,
        type: financialAccounts.type,
        balance: financialAccounts.balance,
        isSalaryAccount: financialAccounts.isSalaryAccount,
        isEmergencyFund: financialAccounts.isEmergencyFund,
        isPinned: financialAccounts.isPinned,
        coupleId: financialAccounts.coupleId,
        createdAt: financialAccounts.createdAt,
        updatedAt: financialAccounts.updatedAt,
        user: { id: users.id, name: users.name },
      })
      .from(financialAccounts)
      .leftJoin(users, eq(financialAccounts.userId, users.id))
      .where(inArray(financialAccounts.userId, coupleUserIds))
      .orderBy(desc(financialAccounts.createdAt));

    return NextResponse.json(
      { success: true, data: accountRows, currentUserId: userId },
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

    const [account] = await db
      .insert(financialAccounts)
      .values({
        userId,
        ...(coupleId ? { coupleId } : {}),
        name: validated.name,
        type: validated.type as typeof financialAccounts.$inferInsert['type'],
        balance: validated.balance,
      })
      .returning();

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
