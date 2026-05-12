"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import {
  getCoupleIdForUser,
  getUserIdsForCouple,
} from "@/_services/finance/couple-service";

const NUTRITION_PATH = "/couple/lifestyle/nutrition";

/** Exported shape of a NutritionLog row returned to the client. */
export type NutritionLogRow = {
  id: string;
  userId: string;
  coupleId: string | null;
  loggedOn: Date;
  mealType: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  note: string | null;
  createdAt: Date;
};

/** Input for {@link logNutrition}. */
export type NutritionLogInput = {
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** BREAKFAST | LUNCH | DINNER | SNACK */
  mealType: string;
  /** Food item name. */
  name: string;
  /** Total calories. */
  calories: number;
  /** Protein in grams. */
  proteinG?: number;
  /** Carbohydrates in grams. */
  carbsG?: number;
  /** Fat in grams. */
  fatG?: number;
  /** Optional note. */
  note?: string;
};

/** Aggregated daily nutrition totals returned by {@link getNutritionSummary}. */
export type NutritionSummary = {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

/**
 * Resolve the signed-in user id or throw an Unauthorized error.
 *
 * @returns The authenticated user id from the session.
 */
async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

/**
 * Retrieve all nutrition logs for the signed-in user's couple on a given date.
 *
 * @param date - ISO date string (YYYY-MM-DD).
 * @returns Logs ordered by creation time ascending.
 * @remarks Auth: requires session. No revalidation (read-only).
 */
export async function getNutritionLogs(date: string): Promise<NutritionLogRow[]> {
  const userId = await requireUserId();
  const coupleUserIds = await getUserIdsForCouple(userId);
  return prisma.nutritionLog.findMany({
    where: {
      userId: { in: coupleUserIds },
      loggedOn: new Date(date),
    },
    orderBy: { createdAt: "asc" },
  }) as Promise<NutritionLogRow[]>;
}

/**
 * Create a nutrition log entry for the signed-in user.
 *
 * @param data - Meal details to persist.
 * @returns The created nutrition log row.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/nutrition`.
 */
export async function logNutrition(data: NutritionLogInput): Promise<NutritionLogRow> {
  const userId = await requireUserId();
  const coupleId = await getCoupleIdForUser(userId);
  const record = await prisma.nutritionLog.create({
    data: {
      userId,
      ...(coupleId ? { coupleId } : {}),
      loggedOn: new Date(data.date),
      mealType: data.mealType,
      name: data.name,
      calories: data.calories,
      proteinG: data.proteinG ?? 0,
      carbsG: data.carbsG ?? 0,
      fatG: data.fatG ?? 0,
      note: data.note ?? null,
    },
  });
  revalidatePath(NUTRITION_PATH);
  return record as NutritionLogRow;
}

/**
 * Delete a nutrition log owned by the signed-in user.
 *
 * @param id - Primary key of the nutrition log to remove.
 * @returns Resolves when the record is deleted.
 * @throws When the record does not exist or is not owned by the user.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/nutrition`.
 */
export async function deleteNutritionLog(id: string): Promise<void> {
  const userId = await requireUserId();
  const log = await prisma.nutritionLog.findFirst({ where: { id, userId } });
  if (!log) throw new Error("Nutrition log not found");
  await prisma.nutritionLog.delete({ where: { id } });
  revalidatePath(NUTRITION_PATH);
}

/**
 * Aggregate nutrition totals for the couple on a given date.
 *
 * @param date - ISO date string (YYYY-MM-DD).
 * @returns Summed calories, protein, carbs and fat across all couple logs for the day.
 * @remarks Auth: requires session. No revalidation (read-only).
 */
export async function getNutritionSummary(date: string): Promise<NutritionSummary> {
  const userId = await requireUserId();
  const coupleUserIds = await getUserIdsForCouple(userId);
  const logs = await prisma.nutritionLog.findMany({
    where: {
      userId: { in: coupleUserIds },
      loggedOn: new Date(date),
    },
  });
  return (logs as Array<{ calories: unknown; proteinG: unknown; carbsG: unknown; fatG: unknown }>).reduce<NutritionSummary>(
    (acc, log) => ({
      totalCalories: acc.totalCalories + Number(log.calories),
      totalProtein: acc.totalProtein + Number(log.proteinG),
      totalCarbs: acc.totalCarbs + Number(log.carbsG),
      totalFat: acc.totalFat + Number(log.fatG),
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 },
  );
}
