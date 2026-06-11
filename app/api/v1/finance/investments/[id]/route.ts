import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { investmentHoldings } from "@db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(_request: NextRequest, context: RouteContext) {
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

    const investment = await db.query.investmentHoldings.findFirst({
      where: and(eq(investmentHoldings.id, id), inArray(investmentHoldings.userId, coupleUserIds)),
    });

    if (!investment) {
      return NextResponse.json(
        { success: false, error: "Investment not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    return NextResponse.json(
      { success: true, data: investment },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch investment",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
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

    const existingInv = await db.query.investmentHoldings.findFirst({
      where: and(eq(investmentHoldings.id, id), inArray(investmentHoldings.userId, coupleUserIds)),
    });

    if (!existingInv) {
      return NextResponse.json(
        { success: false, error: "Investment not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();

    const [investment] = await db.update(investmentHoldings).set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.assetType !== undefined && { assetType: body.assetType }),
        ...(body.mode !== undefined && { mode: body.mode }),
        ...(body.ticker !== undefined && { ticker: body.ticker }),
        ...(body.exchange !== undefined && { exchange: body.exchange }),
        ...(body.quantity !== undefined && { quantity: body.quantity }),
        ...(body.quantityGrams !== undefined && {
          quantityGrams: body.quantityGrams,
        }),
        ...(body.investedAmount !== undefined && {
          investedAmount: body.investedAmount,
        }),
        ...(body.currentPrice !== undefined && {
          currentPrice: body.currentPrice,
        }),
        ...(body.currentValue !== undefined && {
          currentValue: body.currentValue,
        }),
        ...(body.sipAmount !== undefined && { sipAmount: body.sipAmount }),
        ...(body.sipDayOfMonth !== undefined && {
          sipDayOfMonth: body.sipDayOfMonth,
        }),
        ...(body.startDate !== undefined && {
          startDate: new Date(body.startDate),
        }),
        ...(body.nextSipDate !== undefined && {
          nextSipDate: body.nextSipDate ? new Date(body.nextSipDate) : null,
        }),
      }).where(eq(investmentHoldings.id, id)).returning();

    return NextResponse.json(
      { success: true, data: investment },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update investment",
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

    const existing2 = await db.query.investmentHoldings.findFirst({
      where: and(eq(investmentHoldings.id, id), inArray(investmentHoldings.userId, coupleUserIds)),
    });

    if (!existing2) {
      return NextResponse.json(
        { success: false, error: "Investment not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    await db.delete(investmentHoldings).where(eq(investmentHoldings.id, id));

    return NextResponse.json(
      { success: true, data: { deleted: true } },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete investment",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
