"use server";

import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { budgetPlanSchema } from "@/_lib/validations/finance";
import {
  getUserIdsForCouple,
  getCoupleIdForUser,
} from "@/_services/finance/couple-service";

export async function getIncome(monthAndYear: string, mode: "monthly" | "yearly") {
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

    const result = await prisma.transaction.aggregate({
      where: {
        userId: { in: coupleUserIds },
        type: "INCOME" as const,
        date: dateFilter,
      },
      _sum: { amount: true },
    });

    return { success: true as const, income: result._sum.amount ?? 0 };
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
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const plan = await prisma.budgetPlan.findFirst({
      where: { userId: { in: coupleUserIds }, monthAndYear, mode },
    });

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
  lineItems: Array<{ category: string; amount: number; note?: string }>;
  paidItems?: Array<{ category: string; amount: number; note?: string }>;
}) {
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const validated = budgetPlanSchema.parse(input);
    const coupleId = await getCoupleIdForUser(user.id);

    const plan = await prisma.budgetPlan.upsert({
      where: {
        userId_monthAndYear_mode: {
          userId: user.id,
          monthAndYear: validated.monthAndYear,
          mode: validated.mode,
        },
      },
      update: {
        income: validated.income,
        lineItems: validated.lineItems,
        paidItems: validated.paidItems ?? [],
        mode: validated.mode,
        ...(coupleId ? { coupleId } : {}),
      },
      create: {
        userId: user.id,
        monthAndYear: validated.monthAndYear,
        income: validated.income,
        mode: validated.mode,
        lineItems: validated.lineItems,
        paidItems: validated.paidItems ?? [],
        ...(coupleId ? { coupleId } : {}),
      },
    });

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
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);

    const existing = await prisma.budgetPlan.findFirst({
      where: { id, userId: { in: coupleUserIds } },
    });

    if (!existing) {
      return { success: false as const, error: "Budget plan not found" };
    }

    await prisma.budgetPlan.delete({ where: { id } });

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

    const loans = await prisma.loan.findMany({
      where: {
        userId: { in: coupleUserIds },
        remainingBalance: { gt: 0 },
      },
      select: {
        name: true,
        emiAmount: true,
        principal: true,
        interestRate: true,
        tenureMonths: true,
        startDate: true,
        remainingBalance: true,
        schedule: true,
      },
      orderBy: { name: "asc" },
    });

    // Compute next EMI for each loan from schedule
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = loans.map((loan) => {
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
