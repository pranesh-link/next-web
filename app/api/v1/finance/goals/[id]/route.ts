import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { goalSchema } from "@/_lib/validations/finance";
import { calculateGoalProgress } from "@/_services/finance";
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

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!goal) {
      return NextResponse.json(
        { success: false, error: "Goal not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const progress = calculateGoalProgress({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline ?? undefined,
    });

    return NextResponse.json(
      { success: true, data: { ...goal, progress } },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch goal",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const GET = withRateLimit(
  withCache(getHandler, { ttl: 600, keyPrefix: 'finance:goals' }),
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

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Goal not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();
    const merged = {
      name: body.name ?? existing.name,
      targetAmount: body.targetAmount ?? existing.targetAmount,
      currentAmount: body.currentAmount ?? existing.currentAmount,
      deadline: body.deadline ?? existing.deadline ?? undefined,
    };

    const validated = goalSchema.parse(merged);

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        name: validated.name,
        targetAmount: validated.targetAmount,
        currentAmount: validated.currentAmount,
        deadline: validated.deadline,
      },
    });

    await CacheInvalidation.onGoalChange(userId);

    return NextResponse.json(
      { success: true, data: goal },
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
          error instanceof Error ? error.message : "Failed to update goal",
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

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Goal not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    await prisma.savingsGoal.delete({ where: { id } });

    await CacheInvalidation.onGoalChange(userId);

    return NextResponse.json(
      { success: true, data: { id } },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete goal",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const DELETE = withRateLimit(deleteHandler, { max: 30, window: 60 });
