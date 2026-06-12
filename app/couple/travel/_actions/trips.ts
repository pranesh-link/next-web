"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { trips, tripItineraryItems, tripExpenses, tripChecklist } from "@db/schema";
import { eq, and, inArray, desc, asc } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import {
  getUserIdsForCouple,
  getCoupleIdForUser,
} from "@/_services/finance/couple-service";
import type { TripStatus } from "../_types";

/**
 * Fetch all trips for the current user's couple, ordered by startDate descending.
 *
 * @returns Success with trip array, or error string.
 * @remarks Auth: requires session.
 */
export async function getTrips() {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const data = await db.query.trips.findMany({
      where: inArray(trips.userId, coupleUserIds),
      orderBy: [desc(trips.startDate)],
    });

    return { success: true as const, data };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch trips",
    };
  }
}

/**
 * Get a single trip with its itinerary items, expenses, and checklist.
 *
 * @param id - Trip ID.
 * @returns Success with trip + relations, or error string.
 * @remarks Auth: requires session. Ownership is validated via couple membership.
 */
export async function getTrip(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const trip = await db.query.trips.findFirst({
      where: and(eq(trips.id, id), inArray(trips.userId, coupleUserIds)),
    });

    if (!trip) return { success: false as const, error: "Trip not found" };

    const [itineraryItems, expenses, checklistItems] = await Promise.all([
      db.query.tripItineraryItems.findMany({
        where: eq(tripItineraryItems.tripId, id),
        orderBy: [asc(tripItineraryItems.day), asc(tripItineraryItems.time)],
      }),
      db.query.tripExpenses.findMany({
        where: eq(tripExpenses.tripId, id),
        orderBy: [desc(tripExpenses.date)],
      }),
      db.query.tripChecklist.findMany({
        where: eq(tripChecklist.tripId, id),
        orderBy: [asc(tripChecklist.createdAt)],
      }),
    ]);

    return { success: true as const, data: { ...trip, itineraryItems, expenses, checklistItems } };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to fetch trip",
    };
  }
}

/**
 * Create a new trip tagged with the user's coupleId.
 *
 * @param data - Trip creation payload.
 * @returns Success with new trip row, or error string.
 * @remarks Auth: requires session. Revalidates `/couple/travel`.
 */
export async function createTrip(data: {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget?: number;
  notes?: string;
}) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleId = await getCoupleIdForUser(user.id);
    const [trip] = await db
      .insert(trips)
      .values({
        userId: user.id,
        name: data.name.trim(),
        destination: data.destination.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        budget: data.budget ?? null,
        notes: data.notes?.trim() ?? null,
        ...(coupleId ? { coupleId } : {}),
      })
      .returning();

    revalidatePath("/couple/travel");
    return { success: true as const, data: trip };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to create trip",
    };
  }
}

/**
 * Update the status of a trip.
 *
 * @param id - Trip ID.
 * @param status - New TripStatus value.
 * @returns Success with updated trip, or error string.
 * @remarks Auth: requires session. Ownership validated via couple membership.
 */
export async function updateTripStatus(id: string, status: TripStatus) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const existing = await db.query.trips.findFirst({
      where: and(eq(trips.id, id), inArray(trips.userId, coupleUserIds)),
    });
    if (!existing) return { success: false as const, error: "Trip not found" };

    const [trip] = await db
      .update(trips)
      .set({ status })
      .where(eq(trips.id, id))
      .returning();

    revalidatePath("/couple/travel");
    revalidatePath(`/couple/travel/${id}`);
    return { success: true as const, data: trip };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

/**
 * Delete a trip and all its related items (cascade).
 *
 * @param id - Trip ID.
 * @returns Success, or error string.
 * @remarks Auth: requires session. Ownership validated via couple membership.
 */
export async function deleteTrip(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const existing = await db.query.trips.findFirst({
      where: and(eq(trips.id, id), inArray(trips.userId, coupleUserIds)),
    });
    if (!existing) return { success: false as const, error: "Trip not found" };

    await db.delete(trips).where(eq(trips.id, id));

    revalidatePath("/couple/travel");
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete trip",
    };
  }
}
