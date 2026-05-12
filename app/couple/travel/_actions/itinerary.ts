"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
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
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: { in: coupleUserIds } },
    });
    if (!trip) return { success: false as const, error: "Trip not found" };

    const items = await prisma.tripItineraryItem.findMany({
      where: { tripId },
      orderBy: [{ day: "asc" }, { time: "asc" }],
    });

    return { success: true as const, data: items };
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
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: { in: coupleUserIds } },
    });
    if (!trip) return { success: false as const, error: "Trip not found" };

    const item = await prisma.tripItineraryItem.create({
      data: {
        tripId,
        day: data.day,
        time: data.time ?? null,
        title: data.title.trim(),
        description: data.description?.trim() ?? null,
        location: data.location?.trim() ?? null,
      },
    });

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

    const item = await prisma.tripItineraryItem.findFirst({
      where: { id },
      include: { trip: true },
    });
    if (!item) return { success: false as const, error: "Item not found" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    if (!coupleUserIds.includes(item.trip.userId)) {
      return { success: false as const, error: "Not authorized" };
    }

    await prisma.tripItineraryItem.delete({ where: { id } });
    revalidatePath(`/couple/travel/${item.tripId}`);
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to delete item",
    };
  }
}
