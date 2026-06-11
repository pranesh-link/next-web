import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { depositInstruments, depositInstallments } from "@db/schema";
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

    const depositRows = await db.query.depositInstruments.findMany({
      where: inArray(depositInstruments.userId, coupleUserIds),
      orderBy: (t, { desc: d }) => [d(t.createdAt)],
    });

    const depositIds = depositRows.map((d) => d.id);
    const installmentRows = depositIds.length > 0
      ? await db.query.depositInstallments.findMany({
          where: inArray(depositInstallments.depositId, depositIds),
          orderBy: (t, { asc: a }) => [a(t.dueDate)],
        })
      : [];

    const installmentsByDeposit = new Map<string, typeof installmentRows>();
    for (const inst of installmentRows) {
      const arr = installmentsByDeposit.get(inst.depositId) ?? [];
      arr.push(inst);
      installmentsByDeposit.set(inst.depositId, arr);
    }

    const deposits = depositRows.map((d) => ({
      ...d,
      installments: installmentsByDeposit.get(d.id) ?? [],
    }));

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

    const [deposit] = await db.insert(depositInstruments).values({
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
    }).returning();

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
