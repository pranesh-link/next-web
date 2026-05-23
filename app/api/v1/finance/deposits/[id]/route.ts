import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
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

    const deposit = await prisma.depositInstrument.findFirst({
      where: { id, userId: { in: coupleUserIds } },
      include: { installments: { orderBy: { dueDate: "asc" } } },
    });

    if (!deposit) {
      return NextResponse.json(
        { success: false, error: "Deposit not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

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

    const existing = await prisma.depositInstrument.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Deposit not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();

    const deposit = await prisma.depositInstrument.update({
      where: { id },
      data: {
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
      },
    });

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

    const existing = await prisma.depositInstrument.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Deposit not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    await prisma.depositInstrument.delete({ where: { id } });

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
