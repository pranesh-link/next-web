"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { transactions, budgetPlans, loans, users } from "@db/schema";
import { eq, and, inArray, gte, lt, gt, asc, desc, sum } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { budgetPlanSchema } from "@/_lib/validations/finance";
import {
  getUserIdsForCouple,
  getCoupleIdForUser,
} from "@/_services/finance/couple-service";

export async function getIncome(monthAndYear: string, mode: "monthly" | "yearly") {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    let dateFilter: { gte: Date; lt: Date };

    if (mode === "yearly") {
      const year = parseInt(monthAndYear.split("-")[0], 10);
      if (!year) {
        return { success: false as const, error: "Invalid year format" };
      }
      dateFilter = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      };
    } else {
      const [year, month] = monthAndYear.split("-").map(Number);
      if (!year || !month || month < 1 || month > 12) {
        return { success: false as const, error: "Invalid monthAndYear format" };
      }
      dateFilter = {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      };
    }

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const [{ total }] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          inArray(transactions.userId, coupleUserIds),
          eq(transactions.type, "INCOME"),
          gte(transactions.date, dateFilter.gte),
          lt(transactions.date, dateFilter.lt),
        ),
      );

    return { success: true as const, income: Number(total ?? 0) };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch income",
    };
  }
}

export async function getBudgetPlan(monthAndYear: string, mode: "monthly" | "yearly") {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleId = await getCoupleIdForUser(user.id);

    const planRow = await db.query.budgetPlans.findFirst({
      where: coupleId
        ? and(eq(budgetPlans.coupleId, coupleId), eq(budgetPlans.monthAndYear, monthAndYear), eq(budgetPlans.mode, mode))
        : and(eq(budgetPlans.userId, user.id), eq(budgetPlans.monthAndYear, monthAndYear), eq(budgetPlans.mode, mode)),
      orderBy: [desc(budgetPlans.updatedAt)],
    });

    let plan: typeof planRow & { lastUpdatedBy: { id: string; name: string | null; email: string } | null } | null = null;
    if (planRow) {
      const updater = planRow.lastUpdatedById
        ? await db.query.users.findFirst({
            where: eq(users.id, planRow.lastUpdatedById),
            columns: { id: true, name: true, email: true },
          })
        : null;
      plan = { ...planRow, lastUpdatedBy: updater ?? null };
    }

    return { success: true as const, data: plan };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch budget plan",
    };
  }
}

export async function saveBudgetPlan(input: {
  monthAndYear: string;
  income: number;
  mode: "monthly" | "yearly";
  lineItems: Array<{ category: string; amount: number; note?: string; paid?: boolean }>;
}) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = budgetPlanSchema.parse(input);
    const coupleId = await getCoupleIdForUser(user.id);

    // Find any existing couple-wide row first so either partner updates the
    // same record instead of creating a parallel one.
    const existing = await db.query.budgetPlans.findFirst({
      where: coupleId
        ? and(eq(budgetPlans.coupleId, coupleId), eq(budgetPlans.monthAndYear, validated.monthAndYear), eq(budgetPlans.mode, validated.mode))
        : and(eq(budgetPlans.userId, user.id), eq(budgetPlans.monthAndYear, validated.monthAndYear), eq(budgetPlans.mode, validated.mode)),
      orderBy: [desc(budgetPlans.updatedAt)],
      columns: { id: true },
    });

    let planRow: typeof budgetPlans.$inferSelect | undefined;
    if (existing) {
      const [updated] = await db
        .update(budgetPlans)
        .set({
          income: validated.income,
          lineItems: validated.lineItems,
          mode: validated.mode,
          lastUpdatedById: user.id,
          ...(coupleId ? { coupleId } : {}),
        })
        .where(eq(budgetPlans.id, existing.id))
        .returning();
      planRow = updated;
    } else {
      const [created] = await db
        .insert(budgetPlans)
        .values({
          userId: user.id,
          monthAndYear: validated.monthAndYear,
          income: validated.income,
          mode: validated.mode,
          lineItems: validated.lineItems,
          lastUpdatedById: user.id,
          ...(coupleId ? { coupleId } : {}),
        })
        .returning();
      planRow = created;
    }

    const updater = planRow?.lastUpdatedById
      ? await db.query.users.findFirst({
          where: eq(users.id, planRow.lastUpdatedById),
          columns: { id: true, name: true, email: true },
        })
      : null;
    const plan = { ...planRow!, lastUpdatedBy: updater ?? null };

    revalidatePath("/couple/finance/budget-planner");
    return { success: true as const, data: plan };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save budget plan",
    };
  }
}

export async function deleteBudgetPlan(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existingPlan = await db.query.budgetPlans.findFirst({
      where: and(eq(budgetPlans.id, id), inArray(budgetPlans.userId, coupleUserIds)),
    });

    if (!existingPlan) {
      return { success: false as const, error: "Budget plan not found" };
    }

    await db.delete(budgetPlans).where(eq(budgetPlans.id, id));

    revalidatePath("/couple/finance/budget-planner");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete budget plan",
    };
  }
}

export async function getActiveLoans() {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const loanRows = await db.query.loans.findMany({
      where: and(inArray(loans.userId, coupleUserIds), gt(loans.remainingBalance, 0)),
      columns: {
        name: true,
        emiAmount: true,
        principal: true,
        interestRate: true,
        tenureMonths: true,
        startDate: true,
        remainingBalance: true,
        schedule: true,
      },
      orderBy: [asc(loans.name)],
    });

    // Compute next EMI for each loan from schedule
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = loanRows.map((loan) => {
      let nextEmiAmount = loan.emiAmount;

      // Try to get next EMI from stored schedule
      const schedule = Array.isArray(loan.schedule) ? loan.schedule as { month: number; date: string; emi: number }[] : null;
      if (schedule && schedule.length > 0) {
        const nextEntry = schedule.find((e) => {
          const d = new Date(e.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() >= today.getTime();
        });
        if (nextEntry) {
          nextEmiAmount = nextEntry.emi;
        }
      }

      return { name: loan.name, emiAmount: loan.emiAmount, nextEmiAmount };
    });

    return { success: true as const, data };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch active loans",
    };
  }
}
