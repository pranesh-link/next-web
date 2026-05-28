import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
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

    const [budgets, spentByCategory] = await Promise.all([
      prisma.budget.findMany({
        where: { userId: { in: coupleUserIds }, month },
        orderBy: { category: "asc" },
      }),
      prisma.transaction.groupBy({
        by: ["category"] as const,
        where: {
          userId: { in: coupleUserIds },
          type: "EXPENSE" as const,
          date: {
            gte: new Date(year, m - 1, 1),
            lt: new Date(year, m, 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

    const spentMap = new Map<string, number>(
      spentByCategory.map(
        (s: { category: string; _sum: { amount: number | null } }) => [
          s.category,
          s._sum.amount ?? 0,
        ],
      ),
    );

    const data = budgets.map((budget) => ({
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

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month: {
          userId: userId,
          category: validated.category,
          month: validated.month,
        },
      },
      update: { limit: validated.limit },
      create: {
        userId: userId,
        ...(coupleId ? { coupleId } : {}),
        category: validated.category,
        limit: validated.limit,
        month: validated.month,
      },
    });

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
