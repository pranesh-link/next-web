import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { transactionSchema } from "@/_lib/validations/finance";
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

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: { in: coupleUserIds } },
      include: { account: { select: { name: true } } },
    });

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    return NextResponse.json(
      { success: true, data: transaction },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch transaction",
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

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();
    const merged = {
      accountId: body.accountId ?? existing.accountId,
      amount: body.amount ?? existing.amount,
      type: body.type ?? existing.type,
      category: body.category ?? existing.category,
      description: body.description ?? existing.description,
      date: body.date ?? existing.date,
    };

    const validated = transactionSchema.parse(merged);

    if (validated.accountId !== existing.accountId) {
      const newAccount = await prisma.financialAccount.findFirst({
        where: { id: validated.accountId, userId: { in: coupleUserIds } },
      });
      if (!newAccount) {
        return NextResponse.json(
          { success: false, error: "Account not found" },
          { status: 404, headers: corsHeaders() },
        );
      }
    }

    const oldReversal =
      existing.type === "INCOME" ? -existing.amount : existing.amount;
    const newAdjustment =
      validated.type === "INCOME" ? validated.amount : -validated.amount;

    const transaction = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          accountId: validated.accountId,
          amount: validated.amount,
          type: validated.type,
          category: validated.category,
          description: validated.description,
          date: validated.date,
        },
      });

      if (validated.accountId === existing.accountId) {
        await tx.financialAccount.update({
          where: { id: existing.accountId },
          data: { balance: { increment: oldReversal + newAdjustment } },
        });
      } else {
        await tx.financialAccount.update({
          where: { id: existing.accountId },
          data: { balance: { increment: oldReversal } },
        });
        await tx.financialAccount.update({
          where: { id: validated.accountId },
          data: { balance: { increment: newAdjustment } },
        });
      }

      return updated;
    });

    return NextResponse.json(
      { success: true, data: transaction },
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
          error instanceof Error
            ? error.message
            : "Failed to update transaction",
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

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const reversal =
      existing.type === "INCOME" ? -existing.amount : existing.amount;

    await prisma.$transaction([
      prisma.transaction.delete({ where: { id } }),
      prisma.financialAccount.update({
        where: { id: existing.accountId },
        data: { balance: { increment: reversal } },
      }),
    ]);

    return NextResponse.json(
      { success: true, data: { id } },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete transaction",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
