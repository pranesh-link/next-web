import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { financialAccounts, balanceHistory, transactions } from "@db/schema";
import { and, eq, inArray, count } from "drizzle-orm";
import { accountSchema } from "@/_lib/validations/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { withCache } from "@/_lib/middleware/cache";
import { withRateLimit } from "@/_lib/middleware/rate-limit";
import { CacheInvalidation } from "@/_lib/cache-invalidation";

type RouteContext = { params: Promise<{ id: string }> };

export async function OPTIONS() {
  return handleOptions();
}

async function getHandler(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleUserIds = await getUserIdsForCouple(userId);
    const { id } = await context.params;

    const account = await db.query.financialAccounts.findFirst({
      where: and(
        eq(financialAccounts.id, id),
        inArray(financialAccounts.userId, coupleUserIds)
      ),
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    // Fetch balance history separately (Drizzle doesn't have include)
    const history = await db.query.balanceHistory.findMany({
      where: eq(balanceHistory.accountId, id),
      orderBy: (h, { desc: d }) => [d(h.createdAt)],
      limit: 20,
      columns: { id: true, balance: true, change: true, note: true, createdAt: true },
    });

    return NextResponse.json(
      { success: true, data: { ...account, balanceHistory: history } },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch account",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const GET = withRateLimit(
  withCache(getHandler, { ttl: 300, keyPrefix: 'finance:accounts' }),
  { max: 100, window: 60 }
);

async function putHandler(request: NextRequest, context: RouteContext) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleUserIds = await getUserIdsForCouple(userId);
    const { id } = await context.params;

    const existing = await db.query.financialAccounts.findFirst({
      where: and(
        eq(financialAccounts.id, id),
        inArray(financialAccounts.userId, coupleUserIds)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();
    const merged = {
      name: body.name ?? existing.name,
      type: body.type ?? existing.type,
      balance: body.balance ?? existing.balance,
    };

    const validated = accountSchema.parse(merged);

    const [account] = await db
      .update(financialAccounts)
      .set({
        name: validated.name,
        type: validated.type as typeof financialAccounts.$inferInsert['type'],
        balance: validated.balance,
      })
      .where(eq(financialAccounts.id, id))
      .returning();

    await CacheInvalidation.onAccountChange(userId);

    return NextResponse.json(
      { success: true, data: account },
      { headers: corsHeaders() },
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
        error: error instanceof Error ? error.message : "Failed to update account",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const PUT = withRateLimit(putHandler, { max: 30, window: 60 });

async function deleteHandler(_request: NextRequest, context: RouteContext) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleUserIds = await getUserIdsForCouple(userId);
    const { id } = await context.params;

    const existing = await db.query.financialAccounts.findFirst({
      where: and(
        eq(financialAccounts.id, id),
        inArray(financialAccounts.userId, coupleUserIds)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const [linkedCount] = await db
      .select({ value: count() })
      .from(transactions)
      .where(eq(transactions.accountId, id));
    const linkedTransactions = linkedCount.value;

    if (linkedTransactions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete account with ${linkedTransactions} linked transaction(s). Delete transactions first.`,
        },
        { status: 400, headers: corsHeaders() },
      );
    }

    await db.delete(financialAccounts).where(eq(financialAccounts.id, id));

    await CacheInvalidation.onAccountChange(userId);

    return NextResponse.json(
      { success: true, data: { id } },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete account",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const DELETE = withRateLimit(deleteHandler, { max: 30, window: 60 });
