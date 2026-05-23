import { NextResponse, NextRequest } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { budgetPlanSchema } from "@/_lib/validations/finance";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { getCoupleIdForUser } from "@/_services/finance/couple-service";

export async function OPTIONS() {
  return handleOptions();
}

/** GET /api/v1/finance/budget-plans?monthAndYear=2026-05&mode=monthly */
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const { searchParams } = request.nextUrl;
    const monthAndYear = searchParams.get("monthAndYear");
    const mode = searchParams.get("mode") || "monthly";

    if (!monthAndYear) {
      return NextResponse.json(
        { success: false, error: "monthAndYear query param is required" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const coupleId = await getCoupleIdForUser(userId);

    const plan = await prisma.budgetPlan.findFirst({
      where: coupleId
        ? { coupleId, monthAndYear, mode }
        : { userId, coupleId: null, monthAndYear, mode },
      include: {
        lastUpdatedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(
      { success: true, data: plan },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch budget plan",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/** POST /api/v1/finance/budget-plans — create or update */
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
    const validated = budgetPlanSchema.parse(body);
    const coupleId = await getCoupleIdForUser(userId);

    const existing = await prisma.budgetPlan.findFirst({
      where: coupleId
        ? { coupleId, monthAndYear: validated.monthAndYear, mode: validated.mode }
        : { userId, coupleId: null, monthAndYear: validated.monthAndYear, mode: validated.mode },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    const plan = existing
      ? await prisma.budgetPlan.update({
          where: { id: existing.id },
          data: {
            income: validated.income,
            lineItems: validated.lineItems,
            mode: validated.mode,
            lastUpdatedById: userId,
            ...(coupleId ? { coupleId } : {}),
          },
          include: {
            lastUpdatedBy: { select: { id: true, name: true, email: true } },
          },
        })
      : await prisma.budgetPlan.create({
          data: {
            userId,
            monthAndYear: validated.monthAndYear,
            income: validated.income,
            mode: validated.mode,
            lineItems: validated.lineItems,
            lastUpdatedById: userId,
            ...(coupleId ? { coupleId } : {}),
          },
          include: {
            lastUpdatedBy: { select: { id: true, name: true, email: true } },
          },
        });

    return NextResponse.json(
      { success: true, data: plan },
      { status: existing ? 200 : 201, headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save budget plan",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
