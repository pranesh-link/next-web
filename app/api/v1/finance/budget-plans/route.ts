import { NextResponse, NextRequest } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { budgetPlans, users } from "@db/schema";
import { and, eq, isNull, desc } from "drizzle-orm";
import { budgetPlanSchema } from "@/_lib/validations/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getCoupleIdForUser } from "@/_services/finance/couple-service";

export async function OPTIONS() {
  return handleOptions();
}

/** GET /api/v1/finance/budget-plans?monthAndYear=2026-05&mode=monthly */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const { searchParams } = request.nextUrl;
    const monthAndYear = searchParams.get("monthAndYear");
    const mode = searchParams.get("mode") || "monthly";

    if (!monthAndYear) {
      return NextResponse.json(
        { success: false, error: "monthAndYear query param is required" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const coupleId = await getCoupleIdForUser(userId);

    const planRows = await db
      .select({
        id: budgetPlans.id,
        userId: budgetPlans.userId,
        monthAndYear: budgetPlans.monthAndYear,
        mode: budgetPlans.mode,
        income: budgetPlans.income,
        lineItems: budgetPlans.lineItems,
        coupleId: budgetPlans.coupleId,
        lastUpdatedById: budgetPlans.lastUpdatedById,
        createdAt: budgetPlans.createdAt,
        updatedAt: budgetPlans.updatedAt,
        lastUpdatedBy: { id: users.id, name: users.name, email: users.email },
      })
      .from(budgetPlans)
      .leftJoin(users, eq(budgetPlans.lastUpdatedById, users.id))
      .where(
        coupleId
          ? and(
              eq(budgetPlans.coupleId, coupleId),
              eq(budgetPlans.monthAndYear, monthAndYear),
              eq(budgetPlans.mode, mode),
            )
          : and(
              eq(budgetPlans.userId, userId),
              isNull(budgetPlans.coupleId),
              eq(budgetPlans.monthAndYear, monthAndYear),
              eq(budgetPlans.mode, mode),
            ),
      )
      .orderBy(desc(budgetPlans.updatedAt))
      .limit(1);
    const plan = planRows[0] ?? null;

    return NextResponse.json(
      { success: true, data: plan },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch budget plan",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/** POST /api/v1/finance/budget-plans — create or update */
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
    const validated = budgetPlanSchema.parse(body);
    const coupleId = await getCoupleIdForUser(userId);

    const existingRows = await db
      .select({ id: budgetPlans.id })
      .from(budgetPlans)
      .where(
        coupleId
          ? and(
              eq(budgetPlans.coupleId, coupleId),
              eq(budgetPlans.monthAndYear, validated.monthAndYear),
              eq(budgetPlans.mode, validated.mode),
            )
          : and(
              eq(budgetPlans.userId, userId),
              isNull(budgetPlans.coupleId),
              eq(budgetPlans.monthAndYear, validated.monthAndYear),
              eq(budgetPlans.mode, validated.mode),
            ),
      )
      .orderBy(desc(budgetPlans.updatedAt))
      .limit(1);
    const existing = existingRows[0] ?? null;

    let planRow;
    if (existing) {
      const [updated] = await db
        .update(budgetPlans)
        .set({
          income: validated.income,
          lineItems: validated.lineItems,
          mode: validated.mode,
          lastUpdatedById: userId,
          ...(coupleId ? { coupleId } : {}),
        })
        .where(eq(budgetPlans.id, existing.id))
        .returning();
      planRow = updated;
    } else {
      const [created] = await db
        .insert(budgetPlans)
        .values({
          userId,
          monthAndYear: validated.monthAndYear,
          income: validated.income,
          mode: validated.mode,
          lineItems: validated.lineItems,
          lastUpdatedById: userId,
          ...(coupleId ? { coupleId } : {}),
        })
        .returning();
      planRow = created;
    }

    const lastUser = planRow.lastUpdatedById
      ? await db.query.users.findFirst({
          where: eq(users.id, planRow.lastUpdatedById),
          columns: { id: true, name: true, email: true },
        })
      : null;
    const plan = { ...planRow, lastUpdatedBy: lastUser ?? null };

    return NextResponse.json(
      { success: true, data: plan },
      { status: existing ? 200 : 201, headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save budget plan",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
