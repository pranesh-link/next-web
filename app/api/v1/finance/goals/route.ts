import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { savingsGoals } from "@db/schema";
import { inArray } from "drizzle-orm";
import { goalSchema } from "@/_lib/validations/finance";
import { calculateGoalProgress } from "@/_services/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { withCache } from "@/_lib/middleware/cache";
import { withRateLimit } from "@/_lib/middleware/rate-limit";
import { CacheInvalidation } from "@/_lib/cache-invalidation";

export async function OPTIONS() {
  return handleOptions();
}

async function getHandler() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleUserIds = await getUserIdsForCouple(userId);

    const goals = await db.query.savingsGoals.findMany({
      where: inArray(savingsGoals.userId, coupleUserIds),
      orderBy: (t, { desc: d }) => [d(t.createdAt)],
    });

    const data = goals.map((g) => ({
      ...g,
      progress: calculateGoalProgress({
        id: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        deadline: g.deadline ?? undefined,
      }),
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
          error instanceof Error ? error.message : "Failed to fetch goals",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const GET = withRateLimit(
  withCache(getHandler, { ttl: 600, keyPrefix: 'finance:goals' }),
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
    const validated = goalSchema.parse(body);

    const [goal] = await db.insert(savingsGoals).values({
      userId,
      ...(coupleId ? { coupleId } : {}),
      name: validated.name,
      targetAmount: validated.targetAmount,
      currentAmount: validated.currentAmount,
      deadline: validated.deadline,
    }).returning();

    await CacheInvalidation.onGoalChange(userId);

    return NextResponse.json(
      { success: true, data: goal },
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
          error instanceof Error ? error.message : "Failed to create goal",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const POST = withRateLimit(postHandler, { max: 30, window: 60 });
