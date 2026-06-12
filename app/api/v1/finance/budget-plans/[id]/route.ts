import { NextResponse, NextRequest } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { budgetPlans, users } from "@db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getCoupleIdForUser } from "@/_services/finance/couple-service";

export async function OPTIONS() {
  return handleOptions();
}

/** PUT /api/v1/finance/budget-plans/:id */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const { id } = await params;
    const coupleId = await getCoupleIdForUser(userId);

    const existing = await db.query.budgetPlans.findFirst({
      where: coupleId
        ? and(eq(budgetPlans.id, id), eq(budgetPlans.coupleId, coupleId))
        : and(eq(budgetPlans.id, id), eq(budgetPlans.userId, userId), isNull(budgetPlans.coupleId)),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Budget plan not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();
    const [planRow] = await db
      .update(budgetPlans)
      .set({
        ...(body.income !== undefined && { income: body.income }),
        ...(body.lineItems !== undefined && { lineItems: body.lineItems }),
        ...(body.mode !== undefined && { mode: body.mode }),
        lastUpdatedById: userId,
      })
      .where(eq(budgetPlans.id, id))
      .returning();

    const lastUser = planRow.lastUpdatedById
      ? await db.query.users.findFirst({
          where: eq(users.id, planRow.lastUpdatedById),
          columns: { id: true, name: true, email: true },
        })
      : null;
    const plan = { ...planRow, lastUpdatedBy: lastUser ?? null };

    return NextResponse.json(
      { success: true, data: plan },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update budget plan",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/** DELETE /api/v1/finance/budget-plans/:id */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const { id } = await params;
    const coupleId = await getCoupleIdForUser(userId);

    const existing = await db.query.budgetPlans.findFirst({
      where: coupleId
        ? and(eq(budgetPlans.id, id), eq(budgetPlans.coupleId, coupleId))
        : and(eq(budgetPlans.id, id), eq(budgetPlans.userId, userId), isNull(budgetPlans.coupleId)),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Budget plan not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    await db.delete(budgetPlans).where(eq(budgetPlans.id, id));

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete budget plan",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
