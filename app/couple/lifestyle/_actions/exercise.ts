"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/_lib/auth";
import { db } from "@db";
import { exerciseLogs } from "@db/schema";
import { eq, and, inArray, asc, gte } from "drizzle-orm";
import {
  getCoupleIdForUser,
  getUserIdsForCouple,
} from "@/_services/finance/couple-service";

const EXERCISE_PATH = "/couple/lifestyle/exercise";

/** Exported shape of an ExerciseLog row returned to the client. */
export type ExerciseLogRow = {
  id: string;
  userId: string;
  coupleId: string | null;
  loggedOn: Date;
  type: string;
  name: string;
  durationMins: number;
  caloriesBurned: number | null;
  note: string | null;
  createdAt: Date;
};

/** Input for {@link logExercise}. */
export type ExerciseLogInput = {
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** CARDIO | STRENGTH | YOGA | SPORTS | OTHER */
  type: string;
  /** Activity name. */
  name: string;
  /** Duration in minutes. */
  durationMins: number;
  /** Estimated calories burned (optional). */
  caloriesBurned?: number;
  /** Optional note. */
  note?: string;
};

/** Aggregated weekly exercise totals. */
export type WeeklyExerciseSummary = {
  totalMins: number;
  totalCaloriesBurned: number;
  daysActive: number;
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
 * Retrieve exercise logs for the couple on a given date.
 *
 * @param date - ISO date string (YYYY-MM-DD).
 * @returns Logs ordered by creation time ascending.
 * @remarks Auth: requires session. No revalidation (read-only).
 */
export async function getExerciseLogs(date: string): Promise<ExerciseLogRow[]> {
  const userId = await requireUserId();
  const coupleUserIds = await getUserIdsForCouple(userId);
  return db.query.exerciseLogs.findMany({
    where: and(
      inArray(exerciseLogs.userId, coupleUserIds),
      eq(exerciseLogs.loggedOn, date),
    ),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
  }) as Promise<ExerciseLogRow[]>;
}

/**
 * Create an exercise log entry for the signed-in user.
 *
 * @param data - Workout details to persist.
 * @returns The created exercise log row.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/exercise`.
 */
export async function logExercise(data: ExerciseLogInput): Promise<ExerciseLogRow> {
  const userId = await requireUserId();
  const coupleId = await getCoupleIdForUser(userId);
  const [record] = await db
    .insert(exerciseLogs)
    .values({
      userId,
      ...(coupleId ? { coupleId } : {}),
      loggedOn: data.date,
      type: data.type,
      name: data.name,
      durationMins: data.durationMins,
      caloriesBurned: data.caloriesBurned ?? null,
      note: data.note ?? null,
    })
    .returning();
  revalidatePath(EXERCISE_PATH);
  return record as ExerciseLogRow;
}

/**
 * Delete an exercise log owned by the signed-in user.
 *
 * @param id - Primary key of the exercise log to remove.
 * @returns Resolves when the record is deleted.
 * @throws When the record does not exist or is not owned by the user.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/exercise`.
 */
export async function deleteExerciseLog(id: string): Promise<void> {
  const userId = await requireUserId();
  const log = await db.query.exerciseLogs.findFirst({
    where: and(eq(exerciseLogs.id, id), eq(exerciseLogs.userId, userId)),
  });
  if (!log) throw new Error("Exercise log not found");
  await db.delete(exerciseLogs).where(eq(exerciseLogs.id, id));
  revalidatePath(EXERCISE_PATH);
}

/**
 * Aggregate exercise activity for the couple over the last 7 days.
 *
 * @returns Total minutes, total calories burned, and distinct active days.
 * @remarks Auth: requires session. No revalidation (read-only).
 */
export async function getWeeklyExerciseSummary(): Promise<WeeklyExerciseSummary> {
  const userId = await requireUserId();
  const coupleUserIds = await getUserIdsForCouple(userId);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
  const logs = await db.query.exerciseLogs.findMany({
    where: and(
      inArray(exerciseLogs.userId, coupleUserIds),
      gte(exerciseLogs.loggedOn, sevenDaysAgoStr),
    ),
  });

  const activeDays = new Set(
    logs.map((l) => String(l.loggedOn).split("T")[0]),
  );

  return logs.reduce<WeeklyExerciseSummary>(
    (acc, log) => ({
      totalMins: acc.totalMins + log.durationMins,
      totalCaloriesBurned: acc.totalCaloriesBurned + Number(log.caloriesBurned ?? 0),
      daysActive: activeDays.size,
    }),
    { totalMins: 0, totalCaloriesBurned: 0, daysActive: 0 },
  );
}
