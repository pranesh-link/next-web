"use server";

import { db } from "@db";
import { budgets, transactions } from "@db/schema";
import { eq, and, inArray, gte, lt, asc, sum } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { budgetSchema } from "@/_lib/validations/finance";
import { getUserIdsForCouple, getCoupleIdForUser } from "@/_services/finance/couple-service";
import { unstable_cache, revalidatePath, revalidateTag, unstable_noStore as noStore } from "next/cache";
import { CACHE_TAGS, invalidateAfterBudgetChange } from "@/_lib/cache";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const fetchBudgetsWithSpending = unstable_cache(
  async (coupleUserIds: string[], targetMonth: string) => {
    const [year, m] = targetMonth.split("-").map(Number);

    const budgetRowsPromise = db.query.budgets.findMany({
      where: and(inArray(budgets.userId, coupleUserIds), eq(budgets.month, targetMonth)),
      orderBy: [asc(budgets.category)],
    });
    const spentPromise = db
      .select({ category: transactions.category, total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          inArray(transactions.userId, coupleUserIds),
          eq(transactions.type, "EXPENSE"),
          gte(transactions.date, new Date(year, m - 1, 1)),
          lt(transactions.date, new Date(year, m, 1)),
        ),
      )
      .groupBy(transactions.category);

    const budgetRows = await budgetRowsPromise;
    const spentByCategory = await spentPromise;

    const spentMap = new Map<string, number>(
      spentByCategory.map((s) => [s.category, Number(s.total ?? 0)]),
    );

    return { budgets: budgetRows, spentMap: Object.fromEntries(spentMap) };
  },
  ["budgets-with-spending"],
  { revalidate: 30, tags: [CACHE_TAGS.FINANCE_BUDGETS] },
);

export async function getBudgets(month?: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };
    const targetMonth = month ?? currentMonth();

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const { budgets, spentMap } = await fetchBudgetsWithSpending(coupleUserIds, targetMonth);

    const data = budgets.map((budget) => ({
      ...budget,
      spent: spentMap[budget.category] ?? 0,
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
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = budgetSchema.parse(data);

    const coupleId = await getCoupleIdForUser(user.id);

    const [budget] = await db
      .insert(budgets)
      .values({
        userId: user.id,
        category: validated.category,
        limit: validated.limit,
        month: validated.month,
        ...(coupleId ? { coupleId } : {}),
      })
      .onConflictDoUpdate({
        target: [budgets.userId, budgets.category, budgets.month],
        set: { limit: validated.limit },
      })
      .returning();

    invalidateAfterBudgetChange();
    revalidateTag(CACHE_TAGS.FINANCE_BUDGETS);
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/budgets");

    return { success: true as const, data: budget };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create budget",
    };
  }
}

export async function updateBudget(id: string, data: { limit?: number }) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existingBudget = await db.query.budgets.findFirst({
      where: and(eq(budgets.id, id), inArray(budgets.userId, await getUserIdsForCouple(user.id))),
    });

    if (!existingBudget) {
      return { success: false as const, error: "Budget not found" };
    }

    if (data.limit !== undefined && data.limit <= 0) {
      return { success: false as const, error: "Limit must be positive" };
    }

    const [budget] = await db
      .update(budgets)
      .set({ limit: data.limit ?? existingBudget.limit })
      .where(eq(budgets.id, id))
      .returning();

    invalidateAfterBudgetChange();
    revalidateTag(CACHE_TAGS.FINANCE_BUDGETS);
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/budgets");

    return { success: true as const, data: budget };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update budget",
    };
  }
}

export async function deleteBudget(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existingToDelete = await db.query.budgets.findFirst({
      where: and(eq(budgets.id, id), inArray(budgets.userId, await getUserIdsForCouple(user.id))),
    });

    if (!existingToDelete) {
      return { success: false as const, error: "Budget not found" };
    }

    await db.delete(budgets).where(eq(budgets.id, id));

    invalidateAfterBudgetChange();
    revalidateTag(CACHE_TAGS.FINANCE_BUDGETS);
    revalidatePath("/couple/finance");
    revalidatePath("/couple/finance/budgets");

    return { success: true as const, data: { id } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete budget",
    };
  }
}

export async function getBudgetStatus(month?: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };
    const targetMonth = month ?? currentMonth();

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const { budgets, spentMap } = await fetchBudgetsWithSpending(coupleUserIds, targetMonth);

    const data = budgets.map((budget) => {
      const spent = spentMap[budget.category] ?? 0;
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
