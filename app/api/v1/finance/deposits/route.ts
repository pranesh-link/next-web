import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import {
  getUserIdsForCouple,
  getCoupleIdForUser,
} from "@/_services/finance/couple-service";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/finance/deposits — list all deposit instruments for the user/couple.
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

    const deposits = await prisma.depositInstrument.findMany({
      where: { userId: { in: coupleUserIds } },
      include: { installments: { orderBy: { dueDate: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { success: true, data: deposits },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch deposits",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/**
 * POST /api/v1/finance/deposits — create a new deposit instrument.
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

    const deposit = await prisma.depositInstrument.create({
      data: {
        userId,
        ...(coupleId ? { coupleId } : {}),
        name: body.name,
        provider: body.provider || null,
        type: body.type,
        principalAmount: body.principalAmount,
        interestRate: body.interestRate,
        tenureMonths: body.tenureMonths,
        installmentAmount: body.installmentAmount || null,
        installmentFrequency: body.installmentFrequency || "MONTHLY",
        totalInstallments: body.totalInstallments || null,
        startDate: new Date(body.startDate),
        maturityDate: new Date(body.maturityDate),
        maturityAmount: body.maturityAmount,
        nextInstallmentDate: body.nextInstallmentDate
          ? new Date(body.nextInstallmentDate)
          : null,
        sourceAccountId: body.sourceAccountId || null,
      },
    });

    return NextResponse.json(
      { success: true, data: deposit },
      { status: 201, headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create deposit",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
