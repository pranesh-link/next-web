"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/_lib/prisma";
import { requireAuthForAction } from "@/_lib/auth-utils";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

/**
 * Fetch all checklist items for a trip, ordered by creation date.
 *
 * @param tripId - ID of the parent trip.
 * @returns Success with checklist item array, or error string.
 * @remarks Auth: requires session. Trip ownership validated.
 */
export async function getChecklist(tripId: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    const trip = await prisma.trip.findFirst({
      where: { id: tripId, userId: { in: coupleUserIds } },
    });
    if (!trip) return { success: false as const, error: "Trip not found" };

    const items = await prisma.tripChecklist.findMany({
      where: { tripId },
      orderBy: { createdAt: "asc" },
    });

    return { success: true as const, data: items };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to fetch checklist",
    };
  }
}

/**
 * Add a new checklist item to a trip.
 *
 * @param tripId - ID of the parent trip.
 * @param item - Item label text.
 * @param assignedTo - Optional userId of the person responsible.
 * @returns Success with new checklist item, or error string.
 * @remarks Auth: requires session. Revalidates `/couple/travel/[tripId]`.
 */
export async function addChecklistItem(
  tripId: string,
  item: string,
  assignedTo?: string,
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

    const checklistItem = await prisma.tripChecklist.create({
      data: {
        tripId,
        userId: user.id,
        item: item.trim(),
        assignedTo: assignedTo ?? null,
      },
    });

    revalidatePath(`/couple/travel/${tripId}`);
    return { success: true as const, data: checklistItem };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add checklist item",
    };
  }
}

/**
 * Toggle the `packed` boolean of a checklist item.
 *
 * @param id - Checklist item ID.
 * @returns Success with updated item, or error string.
 * @remarks Auth: requires session. Ownership validated via trip.
 */
export async function toggleChecklistItem(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.tripChecklist.findFirst({
      where: { id },
      include: { trip: true },
    });
    if (!existing) return { success: false as const, error: "Item not found" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    if (!coupleUserIds.includes(existing.trip.userId)) {
      return { success: false as const, error: "Not authorized" };
    }

    const updated = await prisma.tripChecklist.update({
      where: { id },
      data: { packed: !existing.packed },
    });

    revalidatePath(`/couple/travel/${existing.tripId}`);
    return { success: true as const, data: updated };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to toggle item",
    };
  }
}

/**
 * Delete a checklist item, validating ownership.
 *
 * @param id - Checklist item ID.
 * @returns Success, or error string.
 * @remarks Auth: requires session.
 */
export async function deleteChecklistItem(id: string) {
  noStore();
  try {
    const user = await requireAuthForAction();
    if (!user) return { success: false as const, error: "Not authenticated" };

    const existing = await prisma.tripChecklist.findFirst({
      where: { id },
      include: { trip: true },
    });
    if (!existing) return { success: false as const, error: "Item not found" };

    const coupleUserIds = await getUserIdsForCouple(user.id);
    if (!coupleUserIds.includes(existing.trip.userId)) {
      return { success: false as const, error: "Not authorized" };
    }

    await prisma.tripChecklist.delete({ where: { id } });
    revalidatePath(`/couple/travel/${existing.tripId}`);
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete checklist item",
    };
  }
}
