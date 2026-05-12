"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

/**
 * Fetch all expenses for a trip, ordered by date descending.
 *
 * @param tripId - ID of the parent trip.
 * @returns Success with expense array, or error string.
 * @remarks Auth: requires session. Trip ownership validated.
 */
export async function getTripExpenses(tripId: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: { in: coupleUserIds } },
    });
    if (!trip) return { success: false as const, error: "Trip not found" };

    const expenses = await prisma.tripExpense.findMany({
      where: { tripId },
      orderBy: { date: "desc" },
    });

    return { success: true as const, data: expenses };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to fetch expenses",
    };
  }
}

/**
 * Add an expense to a trip.
 *
 * @param tripId - ID of the parent trip.
 * @param data - Expense payload.
 * @returns Success with new expense, or error string.
 * @remarks Auth: requires session. Revalidates `/couple/travel/[tripId]`.
 */
export async function addTripExpense(
  tripId: string,
  data: {
    title: string;
    amount: number;
    currency?: string;
    category?: string;
    paidBy?: string;
    date: string;
  },
) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: { in: coupleUserIds } },
    });
    if (!trip) return { success: false as const, error: "Trip not found" };

    const expense = await prisma.tripExpense.create({
      data: {
        tripId,
        userId: user.id,
        title: data.title.trim(),
        amount: data.amount,
        currency: data.currency ?? "INR",
        category: data.category?.trim() ?? null,
        paidBy: data.paidBy ?? null,
        date: new Date(data.date),
      },
    });

    revalidatePath(`/couple/travel/${tripId}`);
    return { success: true as const, data: expense };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to add expense",
    };
  }
}

/**
 * Delete a trip expense, validating trip ownership.
 *
 * @param id - Expense ID.
 * @returns Success, or error string.
 * @remarks Auth: requires session.
 */
export async function deleteTripExpense(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const expense = await prisma.tripExpense.findFirst({
      where: { id },
      include: { trip: true },
    });
    if (!expense) return { success: false as const, error: "Expense not found" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    if (!coupleUserIds.includes(expense.trip.userId)) {
      return { success: false as const, error: "Not authorized" };
    }

    await prisma.tripExpense.delete({ where: { id } });
    revalidatePath(`/couple/travel/${expense.tripId}`);
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to delete expense",
    };
  }
}

/**
 * Get a summary of expenses for a trip: total and breakdown by category.
 *
 * @param tripId - ID of the parent trip.
 * @returns Success with `{ total, byCategory }`, or error string.
 * @remarks Auth: requires session. Trip ownership validated.
 */
export async function getTripExpenseSummary(tripId: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: { in: coupleUserIds } },
    });
    if (!trip) return { success: false as const, error: "Trip not found" };

    const expenses = await prisma.tripExpense.findMany({ where: { tripId } });
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory: Record<string, number> = {};
    for (const e of expenses) {
      const cat = e.category ?? "Other";
      byCategory[cat] = (byCategory[cat] ?? 0) + e.amount;
    }

    return { success: true as const, data: { total, byCategory } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to get summary",
    };
  }
}
