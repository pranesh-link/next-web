import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { loanSchema } from "@/_lib/validations/finance";
import { calculateEMI } from "@/_services/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const loans = await prisma.loan.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      { success: true, data: loans },
      { headers: corsHeaders() },
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

export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

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

    const loan = await prisma.loan.create({
      data: {
        userId: userId,
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
