"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";
import {
  getCoupleIdForUser,
  getUserIdsForCouple,
} from "@/_services/finance/couple-service";

const SLEEP_PATH = "/couple/lifestyle/sleep";

/** Exported shape of a SleepLog row returned to the client. */
export type SleepLogRow = {
  id: string;
  userId: string;
  coupleId: string | null;
  date: Date;
  bedtimeAt: Date;
  wakeAt: Date;
  durationMins: number;
  quality: number;
  note: string | null;
  createdAt: Date;
};

/** Input for {@link logSleep}. */
export type SleepLogInput = {
  /** ISO date string (YYYY-MM-DD) representing the sleep night. */
  date: string;
  /** ISO datetime string for the bedtime (e.g. "2026-05-12T23:00"). */
  bedtimeAt: string;
  /** ISO datetime string for the wake time (e.g. "2026-05-13T07:00"). */
  wakeAt: string;
  /** Sleep quality rating 1–5. */
  quality: number;
  /** Optional note. */
  note?: string;
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
 * Retrieve the most recent sleep logs for the couple.
 *
 * @param limit - Maximum number of records to return (default 7).
 * @returns Sleep logs ordered newest first.
 * @remarks Auth: requires session. No revalidation (read-only).
 */
export async function getSleepLogs(limit = 7): Promise<SleepLogRow[]> {
  const userId = await requireUserId();
  const coupleUserIds = await getUserIdsForCouple(userId);
  return prisma.sleepLog.findMany({
    where: { userId: { in: coupleUserIds } },
    orderBy: { date: "desc" },
    take: limit,
  }) as Promise<SleepLogRow[]>;
}

/**
 * Create a sleep log for the signed-in user. Duration is computed automatically
 * from {@link SleepLogInput.bedtimeAt} and {@link SleepLogInput.wakeAt}.
 *
 * @param data - Sleep session details.
 * @returns The created sleep log row.
 * @throws When wakeAt is not after bedtimeAt.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/sleep`.
 */
export async function logSleep(data: SleepLogInput): Promise<SleepLogRow> {
  const userId = await requireUserId();
  const coupleId = await getCoupleIdForUser(userId);

  const bedtime = new Date(data.bedtimeAt);
  const wake = new Date(data.wakeAt);
  const durationMins = Math.round(
    (wake.getTime() - bedtime.getTime()) / 60_000,
  );
  if (durationMins <= 0) throw new Error("Wake time must be after bedtime");

  const record = await prisma.sleepLog.create({
    data: {
      userId,
      ...(coupleId ? { coupleId } : {}),
      date: new Date(data.date),
      bedtimeAt: bedtime,
      wakeAt: wake,
      durationMins,
      quality: data.quality,
      note: data.note ?? null,
    },
  });
  revalidatePath(SLEEP_PATH);
  return record as SleepLogRow;
}

/**
 * Delete a sleep log owned by the signed-in user.
 *
 * @param id - Primary key of the sleep log to remove.
 * @returns Resolves when the record is deleted.
 * @throws When the record does not exist or is not owned by the user.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/sleep`.
 */
export async function deleteSleepLog(id: string): Promise<void> {
  const userId = await requireUserId();
  const log = await prisma.sleepLog.findFirst({ where: { id, userId } });
  if (!log) throw new Error("Sleep log not found");
  await prisma.sleepLog.delete({ where: { id } });
  revalidatePath(SLEEP_PATH);
}
