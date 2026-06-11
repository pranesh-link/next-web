"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/_lib/auth";
import { db } from "@db";
import { habits, habitLogs } from "@db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import {
  getCoupleIdForUser,
  getUserIdsForCouple,
} from "@/_services/finance/couple-service";

const HABITS_PATH = "/couple/lifestyle/habits";

/** Exported shape of a HabitLog row. */
export type HabitLogRow = {
  id: string;
  habitId: string;
  userId: string;
  loggedOn: Date;
  completed: boolean;
  note: string | null;
  createdAt: Date;
};

/** Exported shape of a Habit row with today's logs included. */
export type HabitWithTodayLog = {
  id: string;
  userId: string;
  coupleId: string | null;
  name: string;
  description: string | null;
  targetDays: number;
  isShared: boolean;
  isActive: boolean;
  createdAt: Date;
  logs: HabitLogRow[];
};

/** Input for {@link createHabit}. */
export type CreateHabitInput = {
  /** Habit display name. */
  name: string;
  /** Optional description. */
  description?: string;
  /** Target days per week (default 7). */
  targetDays?: number;
  /** Whether the habit is visible to both couple members. */
  isShared?: boolean;
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
 * Retrieve all active habits for the couple, including today's completion logs.
 *
 * @returns Active habits ordered by creation time, each with a `logs` array
 *   containing at most one entry for today.
 * @remarks Auth: requires session. No revalidation (read-only).
 */
export async function getHabits(): Promise<HabitWithTodayLog[]> {
  const userId = await requireUserId();
  const coupleUserIds = await getUserIdsForCouple(userId);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const habitsList = await db.query.habits.findMany({
    where: and(inArray(habits.userId, coupleUserIds), eq(habits.isActive, true)),
    orderBy: [asc(habits.createdAt)],
  });
  if (habitsList.length === 0) return [];

  const habitIds = habitsList.map((h) => h.id);
  const todayLogs = await db.query.habitLogs.findMany({
    where: and(inArray(habitLogs.habitId, habitIds), eq(habitLogs.loggedOn, todayStr)),
  });

  return habitsList.map((h) => ({
    ...h,
    logs: todayLogs.filter((l) => l.habitId === h.id),
  })) as HabitWithTodayLog[];
}

/**
 * Create a new habit for the signed-in user.
 *
 * @param data - Habit definition.
 * @returns The created habit row.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/habits`.
 */
export async function createHabit(
  data: CreateHabitInput,
): Promise<HabitWithTodayLog> {
  const userId = await requireUserId();
  const coupleId = await getCoupleIdForUser(userId);
  const [habit] = await db
    .insert(habits)
    .values({
      userId,
      ...(coupleId ? { coupleId } : {}),
      name: data.name,
      description: data.description ?? null,
      targetDays: data.targetDays ?? 7,
      isShared: data.isShared ?? false,
    })
    .returning();
  revalidatePath(HABITS_PATH);
  return { ...habit, logs: [] } as HabitWithTodayLog;
}

/**
 * Toggle a habit's completion for the signed-in user on a given date.
 * If a log already exists for habit + user + date, it is deleted (untoggle).
 * If no log exists, one is created (toggle on).
 *
 * @param habitId - The habit to toggle.
 * @param date - ISO date string (YYYY-MM-DD).
 * @returns Resolves when the toggle is complete.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/habits`.
 */
export async function toggleHabitLog(
  habitId: string,
  date: string,
): Promise<void> {
  const userId = await requireUserId();

  const existing = await db.query.habitLogs.findFirst({
    where: and(
      eq(habitLogs.habitId, habitId),
      eq(habitLogs.userId, userId),
      eq(habitLogs.loggedOn, date),
    ),
  });

  if (existing) {
    await db.delete(habitLogs).where(eq(habitLogs.id, existing.id));
  } else {
    await db.insert(habitLogs).values({ habitId, userId, loggedOn: date });
  }

  revalidatePath(HABITS_PATH);
}

/**
 * Archive a habit so it no longer appears in the active list.
 *
 * @param id - Primary key of the habit to archive.
 * @returns Resolves when the habit's `isActive` flag is set to false.
 * @throws When the habit does not exist or is not owned by the user.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/habits`.
 */
export async function archiveHabit(id: string): Promise<void> {
  const userId = await requireUserId();
  const habit = await db.query.habits.findFirst({
    where: and(eq(habits.id, id), eq(habits.userId, userId)),
  });
  if (!habit) throw new Error("Habit not found");
  await db.update(habits).set({ isActive: false }).where(eq(habits.id, id));
  revalidatePath(HABITS_PATH);
}
