"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/_lib/auth";
import {
  deleteMetric,
  getCoupleSubjects,
  getOrCreateProfile,
  listMetrics,
  updateProfile,
  upsertMetric,
  type BodyMetricRow,
  type BodyProfileRow,
  type CoupleSubject,
} from "@/_services/lifestyle/body-metric-service";
import {
  listBodyMetricsSchema,
  updateBodyProfileSchema,
  upsertBodyMetricSchema,
  type ListBodyMetricsInput,
  type UpdateBodyProfileInput,
  type UpsertBodyMetricInput,
} from "@/_lib/validations/lifestyle";

const WELLNESS_PATH = "/couple/lifestyle/wellness";
const uuidSchema = z.string().uuid();

/**
 * Resolve the signed-in user id or throw an `Unauthorized` error.
 *
 * @return The authenticated user id from the session.
 */
async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

/**
 * List body metrics visible to the signed-in user, optionally filtered by
 * subject and date range.
 *
 * @param input - Optional `subjectId` plus `from` / `to` date window.
 * @return Metrics ordered by `measuredOn` descending (per service layer).
 * @remarks Auth: requires session. No revalidation (read-only).
 */
export async function listBodyMetricsAction(
  input: ListBodyMetricsInput,
): Promise<BodyMetricRow[]> {
  const userId = await requireUserId();
  const parsed = listBodyMetricsSchema.safeParse(input ?? {});
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  return listMetrics({ userId, ...parsed.data });
}

/**
 * Create or overwrite a body metric for a subject on a given date.
 *
 * @param input - Subject id, measurement date, weight, height and optional note.
 * @return The persisted metric row.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/wellness`.
 */
export async function upsertBodyMetricAction(
  input: UpsertBodyMetricInput,
): Promise<BodyMetricRow> {
  const userId = await requireUserId();
  const parsed = upsertBodyMetricSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const row = await upsertMetric({ userId, ...parsed.data });
  revalidatePath(WELLNESS_PATH);
  return row;
}

/**
 * Delete a body metric the signed-in user is authorized to remove.
 *
 * @param metricId - Primary key of the metric row to delete.
 * @return Resolves when the metric is removed.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/wellness`.
 */
export async function deleteBodyMetricAction(metricId: string): Promise<void> {
  const userId = await requireUserId();
  if (typeof metricId !== "string" || !metricId) {
    throw new Error("Invalid metric id");
  }
  await deleteMetric(userId, metricId);
  revalidatePath(WELLNESS_PATH);
}

/**
 * Return the subjects (self + couple partners) the signed-in user may track.
 *
 * @return Array of subjects with `isSelf` flagged for the signed-in user.
 * @remarks Auth: requires session. No revalidation (read-only).
 */
export async function getCoupleSubjectsAction(): Promise<CoupleSubject[]> {
  const userId = await requireUserId();
  return getCoupleSubjects(userId);
}

/**
 * Fetch (and lazily create) the body profile for a subject.
 *
 * @param subjectId - The subject whose profile to fetch.
 * @return The existing or newly-created profile row.
 * @remarks Auth: requires session. No revalidation (read-only).
 */
export async function getBodyProfileAction(
  subjectId: string,
): Promise<BodyProfileRow> {
  const userId = await requireUserId();
  const parsed = uuidSchema.safeParse(subjectId);
  if (!parsed.success) throw new Error("Invalid subject id");
  return getOrCreateProfile(userId, parsed.data);
}

/**
 * Update the body profile for a subject.
 *
 * @param subjectId - The subject whose profile to update.
 * @param patch - Partial profile fields; nulls clear stored values.
 * @return The updated profile row.
 * @remarks Auth: requires session. Revalidates `/couple/lifestyle/wellness`.
 */
export async function updateBodyProfileAction(
  subjectId: string,
  patch: UpdateBodyProfileInput,
): Promise<BodyProfileRow> {
  const userId = await requireUserId();
  const parsedSubject = uuidSchema.safeParse(subjectId);
  if (!parsedSubject.success) throw new Error("Invalid subject id");
  const parsed = updateBodyProfileSchema.safeParse(patch);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const { defaultHeightInCm, targetWeightInKg, birthDate, sex } = parsed.data;
  const row = await updateProfile(userId, parsedSubject.data, {
    defaultHeightInCm: defaultHeightInCm ?? undefined,
    targetWeightInKg: targetWeightInKg ?? undefined,
    birthDate,
    sex,
  });
  revalidatePath(WELLNESS_PATH);
  return row;
}
