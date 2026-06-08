import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { transactions, financialAccounts } from "@db/schema";
import { inArray, desc, eq, and, gte, lt, sql } from "drizzle-orm";
import { transactionSchema } from "@/_lib/validations/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { withCache } from "@/_lib/middleware/cache";
import { withRateLimit } from "@/_lib/middleware/rate-limit";
import { CacheInvalidation } from "@/_lib/cache-invalidation";

export async function OPTIONS() {
  return handleOptions();
}

async function getHandler(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleUserIds = await getUserIdsForCouple(userId);

    const { searchParams } = request.nextUrl;
    const month = searchParams.get("month");
    const category = searchParams.get("category");
    const accountId = searchParams.get("accountId");
    const limitParam = searchParams.get("limit");

    // Build where conditions
    const conditions = [inArray(transactions.userId, coupleUserIds)];

    if (month) {
      const [year, m] = month.split("-").map(Number);
      conditions.push(gte(transactions.date, new Date(year, m - 1, 1)));
      conditions.push(lt(transactions.date, new Date(year, m, 1)));
    }
    if (category) conditions.push(eq(transactions.category, category));
    if (accountId) conditions.push(eq(transactions.accountId, accountId));

    const txRows = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        accountId: transactions.accountId,
        amount: transactions.amount,
        type: transactions.type,
        category: transactions.category,
        description: transactions.description,
        receiptSource: transactions.receiptSource,
        date: transactions.date,
        coupleId: transactions.coupleId,
        createdAt: transactions.createdAt,
        updatedAt: transactions.updatedAt,
        account: { name: financialAccounts.name },
      })
      .from(transactions)
      .leftJoin(financialAccounts, eq(transactions.accountId, financialAccounts.id))
      .where(and(...conditions))
      .orderBy(desc(transactions.date))
      .limit(limitParam ? parseInt(limitParam, 10) : 1000);

    return NextResponse.json(
      { success: true, data: txRows },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch transactions",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const GET = withRateLimit(
  withCache(getHandler, { ttl: 30, keyPrefix: 'finance:transactions' }),
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

    const coupleUserIds = await getUserIdsForCouple(userId);
    const coupleId = await getCoupleIdForUser(userId);

    const body = await request.json();
    const validated = transactionSchema.parse(body);

    const account = await db.query.financialAccounts.findFirst({
      where: and(
        eq(financialAccounts.id, validated.accountId),
        inArray(financialAccounts.userId, coupleUserIds)
      ),
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const balanceAdjustment =
      validated.type === "INCOME" ? validated.amount : -validated.amount;

    const [transaction] = await db.transaction(async (tx) => {
      const created = await tx
        .insert(transactions)
        .values({
          userId,
          ...(coupleId ? { coupleId } : {}),
          accountId: validated.accountId,
          amount: validated.amount,
          type: validated.type,
          category: validated.category,
          description: validated.description ?? null,
          date: validated.date,
        })
        .returning();
      await tx
        .update(financialAccounts)
        .set({ balance: sql`${financialAccounts.balance} + ${balanceAdjustment}` })
        .where(eq(financialAccounts.id, validated.accountId));
      return created;
    });

    await CacheInvalidation.onTransactionChange(userId, validated.accountId);

    return NextResponse.json(
      { success: true, data: transaction },
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
        error:
          error instanceof Error
            ? error.message
            : "Failed to create transaction",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const POST = withRateLimit(postHandler, { max: 30, window: 60 });
