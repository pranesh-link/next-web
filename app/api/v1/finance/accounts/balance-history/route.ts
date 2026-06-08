import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { db } from "@db";
import { overallBalanceLog } from "@db/schema";
import { eq, inArray, and, lt } from "drizzle-orm";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { withRateLimit } from "@/_lib/middleware/rate-limit";

export function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/finance/accounts/balance-history
 *
 * Returns paginated overall balance change history for the couple.
 * Each entry represents a balance mutation (account add/update/remove)
 * with the resulting total balance across all accounts.
 *
 * @remarks GET · auth: JWT Bearer token
 * Query params: `?cursor=<id>&limit=20`
 */
async function getHandler(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleUserIds = await getUserIdsForCouple(userId);
    const coupleId = await getCoupleIdForUser(userId);

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

    const whereClause = coupleId
      ? and(eq(overallBalanceLog.coupleId, coupleId), cursor ? lt(overallBalanceLog.id, cursor) : undefined)
      : and(inArray(overallBalanceLog.userId, coupleUserIds), cursor ? lt(overallBalanceLog.id, cursor) : undefined);

    const logs = await db.query.overallBalanceLog.findMany({
      where: whereClause,
      orderBy: (l, { desc: d }) => [d(l.createdAt)],
      limit: limit + 1,
    });

    const hasMore = logs.length > limit;
    const items = hasMore ? logs.slice(0, limit) : logs;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json(
      {
        success: true,
        data: {
          items: items.map((l) => ({
            id: l.id,
            accountId: l.accountId,
            accountName: l.accountName,
            reason: l.reason,
            change: l.change,
            totalBalance: l.totalBalance,
            createdAt: l.createdAt.toISOString(),
          })),
          nextCursor,
        },
      },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch balance history",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const GET = withRateLimit(getHandler, { max: 60, window: 60 });
