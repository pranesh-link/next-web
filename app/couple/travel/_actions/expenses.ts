"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { trips, tripExpenses } from "@db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
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
    const trip = await db.query.trips.findFirst({
      where: and(eq(trips.id, tripId), inArray(trips.userId, coupleUserIds)),
    });
    if (!trip) return { success: false as const, error: "Trip not found" };

    const data = await db.query.tripExpenses.findMany({
      where: eq(tripExpenses.tripId, tripId),
      orderBy: [desc(tripExpenses.date)],
    });

    return { success: true as const, data };
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
    const trip = await db.query.trips.findFirst({
      where: and(eq(trips.id, tripId), inArray(trips.userId, coupleUserIds)),
    });
    if (!trip) return { success: false as const, error: "Trip not found" };

    const [expense] = await db
      .insert(tripExpenses)
      .values({
        tripId,
        userId: user.id,
        title: data.title.trim(),
        amount: data.amount,
        currency: data.currency ?? "INR",
        category: data.category?.trim() ?? null,
        paidBy: data.paidBy ?? null,
        date: data.date,
      })
      .returning();

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

    const expense = await db.query.tripExpenses.findFirst({
      where: eq(tripExpenses.id, id),
    });
    if (!expense) return { success: false as const, error: "Expense not found" };

    const trip = await db.query.trips.findFirst({
      where: eq(trips.id, expense.tripId),
    });
    const coupleUserIds = await getUserIdsForCouple(user.id);
    if (!trip || !coupleUserIds.includes(trip.userId)) {
      return { success: false as const, error: "Not authorized" };
    }

    await db.delete(tripExpenses).where(eq(tripExpenses.id, id));
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
    const trip = await db.query.trips.findFirst({
      where: and(eq(trips.id, tripId), inArray(trips.userId, coupleUserIds)),
    });
    if (!trip) return { success: false as const, error: "Trip not found" };

    const expenses = await db.query.tripExpenses.findMany({
      where: eq(tripExpenses.tripId, tripId),
    });
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
