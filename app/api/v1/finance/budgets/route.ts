import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { budgetSchema } from "@/_lib/validations/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    console.log('[budgets/GET] userId:', userId);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const { searchParams } = request.nextUrl;
    const month =
      searchParams.get("month") ?? currentMonth();
    const [year, m] = month.split("-").map(Number);

    const [budgets, spentByCategory] = await Promise.all([
      prisma.budget.findMany({
        where: { userId: userId, month },
        orderBy: { category: "asc" },
      }),
      prisma.transaction.groupBy({
        by: ["category"] as const,
        where: {
          userId: userId,
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
      { headers: corsHeaders() },
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

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

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
        category: validated.category,
        limit: validated.limit,
        month: validated.month,
      },
    });

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

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
