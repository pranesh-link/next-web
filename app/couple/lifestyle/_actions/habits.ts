"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
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
  today.setHours(0, 0, 0, 0);

  return prisma.habit.findMany({
    where: {
      userId: { in: coupleUserIds },
      isActive: true,
    },
    include: {
      logs: {
        where: { loggedOn: today },
      },
    },
    orderBy: { createdAt: "asc" },
  }) as Promise<HabitWithTodayLog[]>;
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
  const habit = await prisma.habit.create({
    data: {
      userId,
      ...(coupleId ? { coupleId } : {}),
      name: data.name,
      description: data.description ?? null,
      targetDays: data.targetDays ?? 7,
      isShared: data.isShared ?? false,
    },
    include: { logs: true },
  });
  revalidatePath(HABITS_PATH);
  return habit as HabitWithTodayLog;
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

  const loggedOn = new Date(date);
  loggedOn.setHours(0, 0, 0, 0);

  const existing = await prisma.habitLog.findFirst({
    where: { habitId, userId, loggedOn },
  });

  if (existing) {
    await prisma.habitLog.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitLog.create({
      data: { habitId, userId, loggedOn },
    });
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
  const habit = await prisma.habit.findFirst({ where: { id, userId } });
  if (!habit) throw new Error("Habit not found");
  await prisma.habit.update({ where: { id }, data: { isActive: false } });
  revalidatePath(HABITS_PATH);
}
