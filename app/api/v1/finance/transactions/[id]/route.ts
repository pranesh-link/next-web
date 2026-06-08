import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { transactions, financialAccounts } from "@db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { transactionSchema } from "@/_lib/validations/finance";
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

    const transaction = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, id),
        inArray(transactions.userId, coupleUserIds)
      ),
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    // Fetch account name separately
    const acct = await db.query.financialAccounts.findFirst({
      where: eq(financialAccounts.id, transaction.accountId),
      columns: { name: true },
    });

    return NextResponse.json(
      { success: true, data: { ...transaction, account: { name: acct?.name ?? null } } },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch transaction",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const GET = withRateLimit(
  withCache(getHandler, { ttl: 30, keyPrefix: 'finance:transactions' }),
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

    const existing = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, id),
        inArray(transactions.userId, coupleUserIds)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();
    const merged = {
      accountId: body.accountId ?? existing.accountId,
      amount: body.amount ?? existing.amount,
      type: body.type ?? existing.type,
      category: body.category ?? existing.category,
      description: body.description ?? existing.description,
      date: body.date ?? existing.date,
    };

    const validated = transactionSchema.parse(merged);

    if (validated.accountId !== existing.accountId) {
      const newAccount = await db.query.financialAccounts.findFirst({
        where: and(
          eq(financialAccounts.id, validated.accountId),
          inArray(financialAccounts.userId, coupleUserIds)
        ),
      });
      if (!newAccount) {
        return NextResponse.json(
          { success: false, error: "Account not found" },
          { status: 404, headers: corsHeaders() },
        );
      }
    }

    const oldReversal =
      existing.type === "INCOME" ? -existing.amount : existing.amount;
    const newAdjustment =
      validated.type === "INCOME" ? validated.amount : -validated.amount;

    const transaction = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(transactions)
        .set({
          accountId: validated.accountId,
          amount: validated.amount,
          type: validated.type,
          category: validated.category,
          description: validated.description ?? null,
          date: validated.date,
        })
        .where(eq(transactions.id, id))
        .returning();

      if (validated.accountId === existing.accountId) {
        await tx
          .update(financialAccounts)
          .set({ balance: sql`${financialAccounts.balance} + ${oldReversal + newAdjustment}` })
          .where(eq(financialAccounts.id, existing.accountId));
      } else {
        await tx
          .update(financialAccounts)
          .set({ balance: sql`${financialAccounts.balance} + ${oldReversal}` })
          .where(eq(financialAccounts.id, existing.accountId));
        await tx
          .update(financialAccounts)
          .set({ balance: sql`${financialAccounts.balance} + ${newAdjustment}` })
          .where(eq(financialAccounts.id, validated.accountId));
      }

      return updated;
    });

    await CacheInvalidation.onTransactionChange(userId, validated.accountId);

    return NextResponse.json(
      { success: true, data: transaction },
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
        error:
          error instanceof Error
            ? error.message
            : "Failed to update transaction",
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

    const existing2 = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, id),
        inArray(transactions.userId, coupleUserIds)
      ),
    });

    if (!existing2) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const reversal =
      existing2.type === "INCOME" ? -existing2.amount : existing2.amount;

    await db.transaction(async (tx) => {
      await tx.delete(transactions).where(eq(transactions.id, id));
      await tx
        .update(financialAccounts)
        .set({ balance: sql`${financialAccounts.balance} + ${reversal}` })
        .where(eq(financialAccounts.id, existing2.accountId));
    });

    await CacheInvalidation.onTransactionChange(userId, existing2.accountId);

    return NextResponse.json(
      { success: true, data: { id } },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete transaction",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const DELETE = withRateLimit(deleteHandler, { max: 30, window: 60 });
