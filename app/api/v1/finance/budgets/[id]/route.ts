import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";

type RouteContext = { params: Promise<{ id: string }> };

export async function OPTIONS() {
  return handleOptions();
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

    const { id } = await context.params;

    const existing = await prisma.budget.findFirst({
      where: { id, userId: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Budget not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    const body = await request.json();

    if (body.limit !== undefined && body.limit <= 0) {
      return NextResponse.json(
        { success: false, error: "Limit must be positive" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: { limit: body.limit ?? existing.limit },
    });

    return NextResponse.json(
      { success: true, data: budget },
      { headers: corsHeaders() },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update budget",
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

    const { id } = await context.params;

    const existing = await prisma.budget.findFirst({
      where: { id, userId: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Budget not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    await prisma.budget.delete({ where: { id } });

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
            : "Failed to delete budget",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
