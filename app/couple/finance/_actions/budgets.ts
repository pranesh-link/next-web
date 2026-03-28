"use server";

import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { budgetSchema } from "@/_lib/validations/finance";
import type { Budget } from "@prisma/client";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function getBudgets(month?: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };
    const targetMonth = month ?? currentMonth();
    const [year, m] = targetMonth.split("-").map(Number);

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const budgetsPromise = prisma.budget.findMany({
      where: { userId: { in: coupleUserIds }, month: targetMonth },
      orderBy: { category: "asc" },
    });
    const spentPromise = prisma.transaction.groupBy({
      by: ["category"] as const,
      where: {
        userId: { in: coupleUserIds },
        type: "EXPENSE" as const,
        date: {
          gte: new Date(year, m - 1, 1),
          lt: new Date(year, m, 1),
        },
      },
      _sum: { amount: true },
    });

    const budgets: Budget[] = await budgetsPromise;
    const spentByCategory = await spentPromise;

    const spentMap = new Map<string, number>(
      spentByCategory.map((s: { category: string; _sum: { amount: number | null } }) => [s.category, s._sum.amount ?? 0]),
    );

    const data = budgets.map((budget) => ({
      ...budget,
      spent: spentMap.get(budget.category) ?? 0,
    }));

    return { success: true as const, data };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch budgets",
    };
  }
}

export async function createBudget(data: {
  category: string;
  limit: number;
  month: string;
}) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = budgetSchema.parse(data);

    const coupleId = await getCoupleIdForUser(user.id);

    const budget = await prisma.budget.upsert({
      where: {
        userId_category_month: {
          userId: user.id,
          category: validated.category,
          month: validated.month,
        },
      },
      update: { limit: validated.limit },
      create: {
        userId: user.id,
        category: validated.category,
        limit: validated.limit,
        month: validated.month,
        ...(coupleId ? { coupleId } : {}),
      },
    });

    return { success: true as const, data: budget };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create budget",
    };
  }
}

export async function updateBudget(id: string, data: { limit?: number }) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.budget.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Budget not found" };
    }

    if (data.limit !== undefined && data.limit <= 0) {
      return { success: false as const, error: "Limit must be positive" };
    }

    const budget = await prisma.budget.update({
      where: { id },
      data: { limit: data.limit ?? existing.limit },
    });

    return { success: true as const, data: budget };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update budget",
    };
  }
}

export async function deleteBudget(id: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.budget.findFirst({
      where: { id, userId: { in: await getUserIdsForCouple(user.id) } },
    });

    if (!existing) {
      return { success: false as const, error: "Budget not found" };
    }

    await prisma.budget.delete({ where: { id } });

    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete budget",
    };
  }
}

export async function getBudgetStatus(month?: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };
    const targetMonth = month ?? currentMonth();
    const [year, m] = targetMonth.split("-").map(Number);

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const budgetsPromise = prisma.budget.findMany({
      where: { userId: { in: coupleUserIds }, month: targetMonth },
    });
    const spentPromise = prisma.transaction.groupBy({
      by: ["category"] as const,
      where: {
        userId: { in: coupleUserIds },
        type: "EXPENSE" as const,
        date: {
          gte: new Date(year, m - 1, 1),
          lt: new Date(year, m, 1),
        },
      },
      _sum: { amount: true },
    });

    const budgets: Budget[] = await budgetsPromise;
    const spentByCategory = await spentPromise;

    const spentMap = new Map<string, number>(
      spentByCategory.map((s: { category: string; _sum: { amount: number | null } }) => [s.category, s._sum.amount ?? 0]),
    );

    const data = budgets.map((budget) => {
      const spent = spentMap.get(budget.category) ?? 0;
      const remaining = budget.limit - spent;
      return {
        budget,
        spent,
        remaining,
        exceeded: spent > budget.limit,
      };
    });

    return { success: true as const, data };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to get budget status",
    };
  }
}
