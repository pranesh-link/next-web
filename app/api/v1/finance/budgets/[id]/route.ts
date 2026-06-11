import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { budgets } from "@db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function OPTIONS() {
  return handleOptions();
}

export async function PUT(request: NextRequest, context: RouteContext) {
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

    const existing = await db.query.budgets.findFirst({
      where: and(eq(budgets.id, id), inArray(budgets.userId, coupleUserIds)),
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Budget not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();

    if (body.limit !== undefined && body.limit <= 0) {
      return NextResponse.json(
        { success: false, error: "Limit must be positive" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const [budget] = await db.update(budgets).set({
      limit: body.limit ?? existing.limit,
    }).where(eq(budgets.id, id)).returning();

    return NextResponse.json(
      { success: true, data: budget },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update budget",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
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

    const existing2 = await db.query.budgets.findFirst({
      where: and(eq(budgets.id, id), inArray(budgets.userId, coupleUserIds)),
    });

    if (!existing2) {
      return NextResponse.json(
        { success: false, error: "Budget not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    await db.delete(budgets).where(eq(budgets.id, id));

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
            : "Failed to delete budget",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
