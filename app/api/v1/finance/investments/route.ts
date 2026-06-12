import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { investmentHoldings } from "@db/schema";
import { inArray } from "drizzle-orm";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import {
  getUserIdsForCouple,
  getCoupleIdForUser,
} from "@/_services/finance/couple-service";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/finance/investments — list all investment holdings for the user/couple.
 */
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleUserIds = await getUserIdsForCouple(userId);

    const investments = await db.query.investmentHoldings.findMany({
      where: inArray(investmentHoldings.userId, coupleUserIds),
      orderBy: (t, { desc: d }) => [d(t.createdAt)],
    });

    return NextResponse.json(
      { success: true, data: investments },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch investments",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/**
 * POST /api/v1/finance/investments — create a new investment holding.
 */
export async function POST(request: Request) {
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

    const [investment] = await db.insert(investmentHoldings).values({
      userId,
      ...(coupleId ? { coupleId } : {}),
      name: body.name,
      assetType: body.assetType,
      mode: body.mode || "LUMPSUM",
      ticker: body.ticker || null,
      exchange: body.exchange || null,
      quantity: body.quantity || null,
      quantityGrams: body.quantityGrams || null,
      investedAmount: body.investedAmount,
      currentPrice: body.currentPrice || null,
      currentValue: body.currentValue || null,
      sipAmount: body.sipAmount || null,
      sipDayOfMonth: body.sipDayOfMonth || null,
      startDate: new Date(body.startDate),
      nextSipDate: body.nextSipDate ? new Date(body.nextSipDate) : null,
    }).returning();

    return NextResponse.json(
      { success: true, data: investment },
      { status: 201, headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create investment",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
