import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/finance/goals/:id/contribute — add contribution to a goal.
 */
export async function POST(request: NextRequest, context: RouteContext) {
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

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!goal) {
      return NextResponse.json(
        { success: false, error: "Goal not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();
    const amount = Number(body.amount);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be positive" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: goal.currentAmount + amount },
    });

    return NextResponse.json(
      { success: true, data: updated },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to contribute to goal",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
