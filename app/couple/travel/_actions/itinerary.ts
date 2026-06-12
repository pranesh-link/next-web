"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@db";
import { trips, tripItineraryItems } from "@db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

/**
 * Fetch all itinerary items for a trip, ordered by day then time.
 *
 * @param tripId - ID of the parent trip.
 * @returns Success with item array, or error string.
 * @remarks Auth: requires session. Trip ownership is validated.
 */
export async function getItinerary(tripId: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const trip = await db.query.trips.findFirst({
      where: and(eq(trips.id, tripId), inArray(trips.userId, coupleUserIds)),
    });
    if (!trip) return { success: false as const, error: "Trip not found" };

    const data = await db.query.tripItineraryItems.findMany({
      where: eq(tripItineraryItems.tripId, tripId),
      orderBy: [asc(tripItineraryItems.day), asc(tripItineraryItems.time)],
    });

    return { success: true as const, data };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to fetch itinerary",
    };
  }
}

/**
 * Add an itinerary item to a trip.
 *
 * @param tripId - ID of the parent trip.
 * @param data - Item payload.
 * @returns Success with new item, or error string.
 * @remarks Auth: requires session. Revalidates `/couple/travel/[tripId]`.
 */
export async function addItineraryItem(
  tripId: string,
  data: {
    day: number;
    time?: string;
    title: string;
    description?: string;
    location?: string;
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

    const [item] = await db
      .insert(tripItineraryItems)
      .values({
        tripId,
        day: data.day,
        time: data.time ?? null,
        title: data.title.trim(),
        description: data.description?.trim() ?? null,
        location: data.location?.trim() ?? null,
      })
      .returning();

    revalidatePath(`/couple/travel/${tripId}`);
    return { success: true as const, data: item };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add itinerary item",
    };
  }
}

/**
 * Delete an itinerary item, validating trip ownership.
 *
 * @param id - Itinerary item ID.
 * @returns Success, or error string.
 * @remarks Auth: requires session.
 */
export async function deleteItineraryItem(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const item = await db.query.tripItineraryItems.findFirst({
      where: eq(tripItineraryItems.id, id),
    });
    if (!item) return { success: false as const, error: "Item not found" };

    const trip = await db.query.trips.findFirst({
      where: eq(trips.id, item.tripId),
    });
    const coupleUserIds = await getUserIdsForCouple(user.id);
    if (!trip || !coupleUserIds.includes(trip.userId)) {
      return { success: false as const, error: "Not authorized" };
    }

    await db.delete(tripItineraryItems).where(eq(tripItineraryItems.id, id));
    revalidatePath(`/couple/travel/${item.tripId}`);
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete item",
    };
  }
}
