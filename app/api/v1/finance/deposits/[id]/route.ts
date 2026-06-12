import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { depositInstruments, depositInstallments } from "@db/schema";
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

    const depositRow = await db.query.depositInstruments.findFirst({
      where: and(eq(depositInstruments.id, id), inArray(depositInstruments.userId, coupleUserIds)),
    });

    if (!depositRow) {
      return NextResponse.json(
        { success: false, error: "Deposit not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const installmentRows = await db.query.depositInstallments.findMany({
      where: eq(depositInstallments.depositId, id),
      orderBy: (t, { asc: a }) => [a(t.dueDate)],
    });

    const deposit = { ...depositRow, installments: installmentRows };

    return NextResponse.json(
      { success: true, data: deposit },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch deposit",
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

    const existingDeposit = await db.query.depositInstruments.findFirst({
      where: and(eq(depositInstruments.id, id), inArray(depositInstruments.userId, coupleUserIds)),
    });

    if (!existingDeposit) {
      return NextResponse.json(
        { success: false, error: "Deposit not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();

    const [deposit] = await db.update(depositInstruments).set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.provider !== undefined && { provider: body.provider }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.principalAmount !== undefined && {
          principalAmount: body.principalAmount,
        }),
        ...(body.interestRate !== undefined && {
          interestRate: body.interestRate,
        }),
        ...(body.tenureMonths !== undefined && {
          tenureMonths: body.tenureMonths,
        }),
        ...(body.installmentAmount !== undefined && {
          installmentAmount: body.installmentAmount,
        }),
        ...(body.maturityAmount !== undefined && {
          maturityAmount: body.maturityAmount,
        }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.startDate !== undefined && {
          startDate: new Date(body.startDate),
        }),
        ...(body.maturityDate !== undefined && {
          maturityDate: new Date(body.maturityDate),
        }),
      }).where(eq(depositInstruments.id, id)).returning();

    return NextResponse.json(
      { success: true, data: deposit },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update deposit",
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

    const existing2 = await db.query.depositInstruments.findFirst({
      where: and(eq(depositInstruments.id, id), inArray(depositInstruments.userId, coupleUserIds)),
    });

    if (!existing2) {
      return NextResponse.json(
        { success: false, error: "Deposit not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    await db.delete(depositInstruments).where(eq(depositInstruments.id, id));

    return NextResponse.json(
      { success: true, data: { deleted: true } },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete deposit",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
