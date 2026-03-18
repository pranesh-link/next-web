"use server";

import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { goalSchema } from "@/_lib/validations/finance";

export async function getGoals() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const goals = await prisma.savingsGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return { success: true as const, data: goals };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch goals",
    };
  }
}

export async function getGoal(id: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId: user.id },
    });

    if (!goal) {
      return { success: false as const, error: "Goal not found" };
    }

    return { success: true as const, data: goal };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch goal",
    };
  }
}

export async function createGoal(data: {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  deadline?: string | Date;
}) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = goalSchema.parse(data);

    const goal = await prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name: validated.name,
        targetAmount: validated.targetAmount,
        currentAmount: validated.currentAmount,
        deadline: validated.deadline,
      },
    });

    return { success: true as const, data: goal };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create goal",
    };
  }
}

export async function updateGoal(
  id: string,
  data: {
    name?: string;
    targetAmount?: number;
    currentAmount?: number;
    deadline?: string | Date;
  },
) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false as const, error: "Goal not found" };
    }

    const merged = {
      name: data.name ?? existing.name,
      targetAmount: data.targetAmount ?? existing.targetAmount,
      currentAmount: data.currentAmount ?? existing.currentAmount,
      deadline: data.deadline ?? existing.deadline ?? undefined,
    };

    const validated = goalSchema.parse(merged);

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        name: validated.name,
        targetAmount: validated.targetAmount,
        currentAmount: validated.currentAmount,
        deadline: validated.deadline,
      },
    });

    return { success: true as const, data: goal };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update goal",
    };
  }
}

export async function deleteGoal(id: string) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false as const, error: "Goal not found" };
    }

    await prisma.savingsGoal.delete({ where: { id } });

    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete goal",
    };
  }
}

export async function contributeToGoal(id: string, amount: number) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    if (amount <= 0) {
      return { success: false as const, error: "Contribution amount must be positive" };
    }

    const existing = await prisma.savingsGoal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return { success: false as const, error: "Goal not found" };
    }

    const newAmount = existing.currentAmount + amount;

    if (newAmount > existing.targetAmount) {
      return {
        success: false as const,
        error: `Contribution would exceed target. Maximum additional contribution: ${(existing.targetAmount - existing.currentAmount).toFixed(2)}`,
      };
    }

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: { currentAmount: newAmount },
    });

    return { success: true as const, data: goal };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to contribute to goal",
    };
  }
}
