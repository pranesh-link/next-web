"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { savingsGoals } from "@db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { goalSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { invalidateAfterGoalChange } from "@/_lib/cache";

export async function getGoals() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const goals = await db.query.savingsGoals.findMany({
      where: inArray(savingsGoals.userId, coupleUserIds),
      orderBy: [desc(savingsGoals.createdAt)],
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
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const goal = await db.query.savingsGoals.findFirst({
      where: and(eq(savingsGoals.id, id), inArray(savingsGoals.userId, await getUserIdsForCouple(user.id))),
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
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = goalSchema.parse(data);
    const coupleId = await getCoupleIdForUser(user.id);

    const [goal] = await db
      .insert(savingsGoals)
      .values({
        userId: user.id,
        name: validated.name,
        targetAmount: validated.targetAmount,
        currentAmount: validated.currentAmount,
        deadline: validated.deadline,
        ...(coupleId ? { coupleId } : {}),
      })
      .returning();

    invalidateAfterGoalChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/goals");
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
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await db.query.savingsGoals.findFirst({
      where: and(eq(savingsGoals.id, id), inArray(savingsGoals.userId, await getUserIdsForCouple(user.id))),
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

    const [goal] = await db
      .update(savingsGoals)
      .set({
        name: validated.name,
        targetAmount: validated.targetAmount,
        currentAmount: validated.currentAmount,
        deadline: validated.deadline,
      })
      .where(eq(savingsGoals.id, id))
      .returning();

    invalidateAfterGoalChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/goals");
    return { success: true as const, data: goal };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update goal",
    };
  }
}

export async function deleteGoal(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await db.query.savingsGoals.findFirst({
      where: and(eq(savingsGoals.id, id), inArray(savingsGoals.userId, await getUserIdsForCouple(user.id))),
    });

    if (!existing) {
      return { success: false as const, error: "Goal not found" };
    }

    await db.delete(savingsGoals).where(eq(savingsGoals.id, id));

    invalidateAfterGoalChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/goals");
    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete goal",
    };
  }
}

export async function contributeToGoal(id: string, amount: number) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    if (amount <= 0) {
      return { success: false as const, error: "Contribution amount must be positive" };
    }

    const existing = await db.query.savingsGoals.findFirst({
      where: and(eq(savingsGoals.id, id), inArray(savingsGoals.userId, await getUserIdsForCouple(user.id))),
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

    const [goal] = await db
      .update(savingsGoals)
      .set({ currentAmount: newAmount })
      .where(eq(savingsGoals.id, id))
      .returning();

    invalidateAfterGoalChange();
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/goals");
    return { success: true as const, data: goal };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to contribute to goal",
    };
  }
}
