import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { budgets, transactions } from "@db/schema";
import { and, eq, inArray, gte, lt, sql } from "drizzle-orm";
import { budgetSchema } from "@/_lib/validations/finance";
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
    console.log('[budgets/GET] userId:', userId);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleUserIds = await getUserIdsForCouple(userId);

    const { searchParams } = request.nextUrl;
    const month =
      searchParams.get("month") ?? currentMonth();
    const [year, m] = month.split("-").map(Number);

    const [budgetRows, budgetSpentData] = await Promise.all([
      db.query.budgets.findMany({
        where: and(inArray(budgets.userId, coupleUserIds), eq(budgets.month, month)),
        orderBy: (t, { asc: a }) => [a(t.category)],
      }),
      db
        .select({
          category: transactions.category,
          total: sql<number>`sum(${transactions.amount})`,
        })
        .from(transactions)
        .where(
          and(
            inArray(transactions.userId, coupleUserIds),
            eq(transactions.type, "EXPENSE"),
            gte(transactions.date, new Date(year, m - 1, 1)),
            lt(transactions.date, new Date(year, m, 1)),
          ),
        )
        .groupBy(transactions.category),
    ]);

    const spentMap = new Map<string, number>(
      budgetSpentData.map((s) => [s.category, s.total ?? 0]),
    );

    const data = budgetRows.map((budget) => ({
      ...budget,
      spent: spentMap.get(budget.category) ?? 0,
    }));

    return NextResponse.json(
      { success: true, data },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch budgets",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const GET = withRateLimit(
  withCache(getHandler, { ttl: 600, keyPrefix: 'finance:budgets' }),
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
    const validated = budgetSchema.parse(body);

    const [budget] = await db
      .insert(budgets)
      .values({
        userId,
        ...(coupleId ? { coupleId } : {}),
        category: validated.category,
        limit: validated.limit,
        month: validated.month,
      })
      .onConflictDoUpdate({
        target: [budgets.userId, budgets.category, budgets.month],
        set: { limit: validated.limit },
      })
      .returning();

    await CacheInvalidation.onBudgetChange(userId);

    return NextResponse.json(
      { success: true, data: budget },
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
            : "Failed to create budget",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const POST = withRateLimit(postHandler, { max: 30, window: 60 });

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
