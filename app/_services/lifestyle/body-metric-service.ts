/**
 * Couple-aware persistence layer for body metrics and body profile.
 *
 * All functions are session-bound — callers pass the signed-in `userId`
 * obtained from `auth()`. Cross-subject access is gated by
 * {@link assertSubjectAuthorized}: a user may only read/write their own
 * data or that of a partner in the same couple.
 */
import { db } from "@db";
import { bodyMetrics, bodyProfiles, users } from "@db/schema";
import { eq, and, inArray, gte, lte } from "drizzle-orm";
import {
  getCoupleIdForUser,
  getCoupleMembers,
  getUserIdsForCouple,
} from "@/_services/finance/couple-service";
import { categoryFromBmi } from "./bmi";

/** A persisted body metric row. */
export type BodyMetricRow = typeof bodyMetrics.$inferSelect;

/** A persisted body profile row. */
export type BodyProfileRow = typeof bodyProfiles.$inferSelect;

/** A trackable subject — either the signed-in user or a couple partner. */
export interface CoupleSubject {
  id: string;
  name: string | null;
  image: string | null;
  isSelf: boolean;
}

/**
 * List the subjects the signed-in user may track metrics for.
 *
 * Returns just the user themselves when they are not in a couple.
 *
 * @param userId - The signed-in user id.
 * @returns Array with `isSelf` set to `true` for the signed-in user.
 */
export async function getCoupleSubjects(userId: string): Promise<CoupleSubject[]> {
  const coupleId = await getCoupleIdForUser(userId);
  if (!coupleId) {
    const self = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, name: true, image: true },
    });
    if (!self) return [];
    return [{ id: self.id, name: self.name, image: self.image, isSelf: true }];
  }
  const members = await getCoupleMembers(coupleId);
  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    image: m.user.image,
    isSelf: m.user.id === userId,
  }));
}

async function assertSubjectAuthorized(
  userId: string,
  subjectId: string,
): Promise<void> {
  if (subjectId === userId) return;
  const coupleUserIds = await getUserIdsForCouple(userId);
  if (!coupleUserIds.includes(subjectId)) {
    throw new Error("Forbidden: subject not authorized");
  }
}

/** Optional date-window arguments for {@link listMetrics}. */
export interface ListMetricsArgs {
  userId: string;
  subjectId?: string;
  from?: Date;
  to?: Date;
}

/**
 * List body metrics visible to the signed-in user.
 *
 * When `subjectId` is omitted, returns metrics for every member of the
 * couple. When supplied, the subject must be the user themselves or a
 * partner in the same couple.
 *
 * @param args - Caller, optional subject filter, and optional date range.
 * @returns Metrics ordered by `measuredOn` descending.
 */
export async function listMetrics(args: ListMetricsArgs): Promise<BodyMetricRow[]> {
  const { userId, subjectId, from, to } = args;
  const coupleUserIds = await getUserIdsForCouple(userId);
  const subjectIds = subjectId ? [subjectId] : coupleUserIds;
  if (subjectId && !coupleUserIds.includes(subjectId)) {
    throw new Error("Forbidden: subject not authorized");
  }
  const conditions = [inArray(bodyMetrics.subjectId, subjectIds)];
  if (from) conditions.push(gte(bodyMetrics.measuredOn, from.toISOString().split("T")[0]));
  if (to) conditions.push(lte(bodyMetrics.measuredOn, to.toISOString().split("T")[0]));

  return db.query.bodyMetrics.findMany({
    where: and(...conditions),
    orderBy: (t, { desc }) => [desc(t.measuredOn)],
  });
}

/** Input payload for {@link upsertMetric}. */
export interface UpsertMetricInput {
  userId: string;
  subjectId: string;
  measuredOn: Date;
  weightInKg: number;
  heightInCm: number;
  note?: string;
}

function computeBmi(weightInKg: number, heightInCm: number): number {
  const heightM = heightInCm / 100;
  return Math.round((weightInKg / (heightM * heightM)) * 100) / 100;
}

/**
 * Create or overwrite a metric for the given subject and date.
 *
 * Two entries cannot coexist for the same `(subjectId, measuredOn)`.
 * BMI and category are derived server-side and stored alongside the raw
 * weight and height inputs.
 *
 * @param input - Subject, date, weight (kg), height (cm), and optional note.
 * @returns The persisted metric row.
 * @throws {Error} when the subject is not authorized for the caller.
 */
export async function upsertMetric(input: UpsertMetricInput): Promise<BodyMetricRow> {
  const { userId, subjectId, measuredOn, weightInKg, heightInCm, note } = input;
  await assertSubjectAuthorized(userId, subjectId);
  const bmi = computeBmi(weightInKg, heightInCm);
  const bmiCategory = categoryFromBmi(bmi);
  const coupleId = await getCoupleIdForUser(userId);
  const measuredOnStr = measuredOn.toISOString().split("T")[0];
  const [row] = await db
    .insert(bodyMetrics)
    .values({
      userId,
      subjectId,
      coupleId: coupleId ?? null,
      measuredOn: measuredOnStr,
      weightInKg: String(weightInKg),
      heightInCm: String(heightInCm),
      bmi: String(bmi),
      bmiCategory,
      note,
    })
    .onConflictDoUpdate({
      target: [bodyMetrics.subjectId, bodyMetrics.measuredOn],
      set: {
        weightInKg: String(weightInKg),
        heightInCm: String(heightInCm),
        bmi: String(bmi),
        bmiCategory,
        note,
      },
    })
    .returning();
  return row;
}

/**
 * Delete a metric the signed-in user is authorized to remove.
 *
 * @param userId - The signed-in user id.
 * @param metricId - The metric primary key.
 * @throws {Error} when the metric does not exist or is not authorized.
 */
export async function deleteMetric(userId: string, metricId: string): Promise<void> {
  const metric = await db.query.bodyMetrics.findFirst({ where: eq(bodyMetrics.id, metricId) });
  if (!metric) throw new Error("Metric not found");
  await assertSubjectAuthorized(userId, metric.subjectId);
  await db.delete(bodyMetrics).where(eq(bodyMetrics.id, metricId));
}

/**
 * Fetch the body profile for a subject, creating an empty one if missing.
 *
 * @param userId - The signed-in user id.
 * @param subjectId - Subject the profile belongs to.
 * @returns The existing or newly-created profile row.
 * @throws {Error} when the subject is not authorized for the caller.
 */
export async function getOrCreateProfile(
  userId: string,
  subjectId: string,
): Promise<BodyProfileRow> {
  await assertSubjectAuthorized(userId, subjectId);
  const coupleId = await getCoupleIdForUser(userId);
  const [row] = await db
    .insert(bodyProfiles)
    .values({ userId, subjectId, coupleId: coupleId ?? null })
    .onConflictDoUpdate({ target: bodyProfiles.subjectId, set: {} })
    .returning();
  return row;
}

/** Patchable fields for {@link updateProfile}. */
export interface UpdateProfilePatch {
  defaultHeightInCm?: number;
  targetWeightInKg?: number;
  birthDate?: Date | null;
  sex?: string | null;
}

/**
 * Update editable fields of a subject's body profile.
 *
 * Ensures the row exists (via {@link getOrCreateProfile}) before applying
 * the patch.
 *
 * @param userId - The signed-in user id.
 * @param subjectId - Subject whose profile is being updated.
 * @param patch - Fields to overwrite (omitted fields stay unchanged).
 * @returns The updated profile row.
 * @throws {Error} when the subject is not authorized for the caller.
 */
export async function updateProfile(
  userId: string,
  subjectId: string,
  patch: UpdateProfilePatch,
): Promise<BodyProfileRow> {
  await assertSubjectAuthorized(userId, subjectId);
  await getOrCreateProfile(userId, subjectId);
  const set: Record<string, unknown> = {};
  if (patch.defaultHeightInCm !== undefined) set.defaultHeightInCm = String(patch.defaultHeightInCm);
  if (patch.targetWeightInKg !== undefined) set.targetWeightInKg = String(patch.targetWeightInKg);
  if (patch.birthDate !== undefined) set.birthDate = patch.birthDate ? patch.birthDate.toISOString().split("T")[0] : null;
  if (patch.sex !== undefined) set.sex = patch.sex;
  const [row] = await db
    .update(bodyProfiles)
    .set(set)
    .where(eq(bodyProfiles.subjectId, subjectId))
    .returning();
  return row;
}
