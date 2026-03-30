import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { loanSchema } from "@/_lib/validations/finance";
import { getLoanInsights } from "@/_services/finance";
import type { LoanData } from "@/_services/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

type RouteContext = { params: Promise<{ id: string }> };

function toLoanData(loan: {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: Date;
  remainingBalance: number;
}): LoanData {
  return {
    id: loan.id,
    name: loan.name,
    principal: loan.principal,
    interestRate: loan.interestRate,
    tenureMonths: loan.tenureMonths,
    emiAmount: loan.emiAmount,
    startDate: loan.startDate,
    remainingBalance: loan.remainingBalance,
  };
}

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

    const loan = await prisma.loan.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!loan) {
      return NextResponse.json(
        { success: false, error: "Loan not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const insights = getLoanInsights(toLoanData(loan));

    return NextResponse.json(
      { success: true, data: { ...loan, insights } },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch loan",
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

    const existing = await prisma.loan.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Loan not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();
    const merged = {
      name: body.name ?? existing.name,
      principal: body.principal ?? existing.principal,
      interestRate: body.interestRate ?? existing.interestRate,
      tenureMonths: body.tenureMonths ?? existing.tenureMonths,
      emiAmount: body.emiAmount ?? existing.emiAmount,
      startDate: body.startDate ?? existing.startDate,
      remainingBalance: body.remainingBalance ?? existing.remainingBalance,
    };

    const validated = loanSchema.parse(merged);

    const loan = await prisma.loan.update({
      where: { id },
      data: {
        name: validated.name,
        principal: validated.principal,
        interestRate: validated.interestRate,
        tenureMonths: validated.tenureMonths,
        emiAmount: validated.emiAmount,
        startDate: validated.startDate,
        remainingBalance: validated.remainingBalance,
      },
    });

    return NextResponse.json(
      { success: true, data: loan },
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
          error instanceof Error ? error.message : "Failed to update loan",
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

    const existing = await prisma.loan.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Loan not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    await prisma.loan.delete({ where: { id } });

    return NextResponse.json(
      { success: true, data: { id } },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete loan",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
