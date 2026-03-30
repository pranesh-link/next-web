import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { AccountType } from "@prisma/client";
import { accountSchema } from "@/_lib/validations/finance";
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

    const account = await prisma.financialAccount.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    return NextResponse.json(
      { success: true, data: account },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch account",
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

    const existing = await prisma.financialAccount.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();
    const merged = {
      name: body.name ?? existing.name,
      type: body.type ?? existing.type,
      balance: body.balance ?? existing.balance,
    };

    const validated = accountSchema.parse(merged);

    const account = await prisma.financialAccount.update({
      where: { id },
      data: {
        name: validated.name,
        type: validated.type as AccountType,
        balance: validated.balance,
      },
    });

    return NextResponse.json(
      { success: true, data: account },
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
        error: error instanceof Error ? error.message : "Failed to update account",
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

    const existing = await prisma.financialAccount.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const linkedTransactions = await prisma.transaction.count({
      where: { accountId: id },
    });

    if (linkedTransactions > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete account with ${linkedTransactions} linked transaction(s). Delete transactions first.`,
        },
        { status: 400, headers: corsHeaders() },
      );
    }

    await prisma.financialAccount.delete({ where: { id } });

    return NextResponse.json(
      { success: true, data: { id } },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete account",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
