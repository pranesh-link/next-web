/**
 * Zod validation schemas for the LuvVerse Lifestyle / Wellness module.
 *
 * Schemas defined here are consumed by server actions in
 * `app/couple/lifestyle/_actions/**` and by any future API routes that touch
 * body metrics or body profiles. Keep numeric bounds aligned with the
 * service-layer constraints in `app/_services/lifestyle/body-metric-service.ts`.
 */
import { z } from "zod";

/**
 * Payload for creating or replacing a body metric for a given subject + date.
 *
 * @remarks `weightInKg` and `heightInCm` use realistic human ranges — values
 * outside these bounds are almost always input errors.
 */
export const upsertBodyMetricSchema = z.object({
  subjectId: z.string().uuid("Subject id must be a valid uuid"),
  measuredOn: z.coerce.date(),
  weightInKg: z
    .number()
    .min(20, "Weight must be at least 20 kg")
    .max(500, "Weight cannot exceed 500 kg"),
  heightInCm: z
    .number()
    .min(50, "Height must be at least 50 cm")
    .max(300, "Height cannot exceed 300 cm"),
  note: z.string().max(200, "Note cannot exceed 200 characters").optional(),
});

/**
 * Patch payload for updating a subject's body profile.
 *
 * All fields are optional and individually nullable so a caller can clear a
 * stored value by passing `null`.
 */
export const updateBodyProfileSchema = z.object({
  defaultHeightInCm: z
    .number()
    .min(50, "Default height must be at least 50 cm")
    .max(300, "Default height cannot exceed 300 cm")
    .optional()
    .nullable(),
  targetWeightInKg: z
    .number()
    .min(20, "Target weight must be at least 20 kg")
    .max(500, "Target weight cannot exceed 500 kg")
    .optional()
    .nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  sex: z.string().max(20, "Sex value too long").optional().nullable(),
});

/**
 * Filters for listing body metrics — all fields optional.
 *
 * When `subjectId` is omitted the action returns metrics for every couple
 * member. `from` and `to` form an inclusive date window on `measuredOn`.
 */
export const listBodyMetricsSchema = z.object({
  subjectId: z.string().uuid("Subject id must be a valid uuid").optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

/** Inferred input type for {@link upsertBodyMetricSchema}. */
export type UpsertBodyMetricInput = z.infer<typeof upsertBodyMetricSchema>;

/** Inferred input type for {@link updateBodyProfileSchema}. */
export type UpdateBodyProfileInput = z.infer<typeof updateBodyProfileSchema>;

/** Inferred input type for {@link listBodyMetricsSchema}. */
export type ListBodyMetricsInput = z.infer<typeof listBodyMetricsSchema>;
