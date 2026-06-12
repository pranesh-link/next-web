import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { loans } from "@db/schema";
import { inArray } from "drizzle-orm";
import { loanSchema } from "@/_lib/validations/finance";
import { calculateEMI } from "@/_services/finance";
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

    const loanRows = await db.query.loans.findMany({
      where: inArray(loans.userId, coupleUserIds),
      orderBy: (t, { desc: d }) => [d(t.createdAt)],
    });

    return NextResponse.json(
      { success: true, data: loanRows },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch loans",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const GET = withRateLimit(
  withCache(getHandler, { ttl: 900, keyPrefix: 'finance:loans' }),
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

    let emiAmount = body.emiAmount;
    if (!emiAmount || emiAmount === 0) {
      emiAmount = calculateEMI(
        body.principal,
        body.interestRate,
        body.tenureMonths,
      );
    }

    const validated = loanSchema.parse({ ...body, emiAmount });

    const [loan] = await db.insert(loans).values({
      userId,
      ...(coupleId ? { coupleId } : {}),
      name: validated.name,
      principal: validated.principal,
      interestRate: validated.interestRate,
      tenureMonths: validated.tenureMonths,
      emiAmount: validated.emiAmount,
      startDate: validated.startDate,
      remainingBalance: validated.remainingBalance,
    }).returning();

    await CacheInvalidation.onLoanChange(userId);

    return NextResponse.json(
      { success: true, data: loan },
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
          error instanceof Error ? error.message : "Failed to create loan",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

export const POST = withRateLimit(postHandler, { max: 30, window: 60 });
