import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { transactionSchema } from "@/_lib/validations/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const coupleUserIds = await getUserIdsForCouple(userId);

    const { searchParams } = request.nextUrl;
    const month = searchParams.get("month");
    const category = searchParams.get("category");
    const accountId = searchParams.get("accountId");
    const limitParam = searchParams.get("limit");

    const where: {
      userId: { in: string[] };
      date?: { gte: Date; lt: Date };
      category?: string;
      accountId?: string;
    } = { userId: { in: coupleUserIds } };

    if (month) {
      const [year, m] = month.split("-").map(Number);
      where.date = {
        gte: new Date(year, m - 1, 1),
        lt: new Date(year, m, 1),
      };
    }

    if (category) {
      where.category = category;
    }

    if (accountId) {
      where.accountId = accountId;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: limitParam ? parseInt(limitParam, 10) : undefined,
      include: { account: { select: { name: true } } },
    });

    return NextResponse.json(
      { success: true, data: transactions },
      { headers: corsHeaders("private, max-age=30") },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch transactions",
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

    const coupleUserIds = await getUserIdsForCouple(userId);
    const coupleId = await getCoupleIdForUser(userId);

    const body = await request.json();
    const validated = transactionSchema.parse(body);

    const account = await prisma.financialAccount.findFirst({
      where: { id: validated.accountId, userId: { in: coupleUserIds } },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const balanceAdjustment =
      validated.type === "INCOME" ? validated.amount : -validated.amount;

    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: userId,
          ...(coupleId ? { coupleId } : {}),
          accountId: validated.accountId,
          amount: validated.amount,
          type: validated.type,
          category: validated.category,
          description: validated.description,
          date: validated.date,
        },
      }),
      prisma.financialAccount.update({
        where: { id: validated.accountId },
        data: { balance: { increment: balanceAdjustment } },
      }),
    ]);

    return NextResponse.json(
      { success: true, data: transaction },
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
          error instanceof Error
            ? error.message
            : "Failed to create transaction",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
