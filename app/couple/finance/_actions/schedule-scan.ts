"use server";

import { unstable_noStore as noStore } from "next/cache";
import { requireAuthForAction } from "@/_lib/auth-utils";
import {
  scanSchedule,
  checkScheduleScanRateLimit,
  type ScheduleData,
} from "@/_services/finance/schedule-scan-service";

export type ScanScheduleActionResult =
  | { success: true; data: ScheduleData; method: string; model?: string }
  | { success: false; error: string; geminiError?: string };

/**
 * Server-action wrapper around the schedule-scan service.
 *
 * Accepts a FormData with a `schedule` File entry (matches the existing
 * route handler contract), performs auth + rate-limit checks, then
 * delegates to the shared service.
 *
 * param formData: FormData containing the `schedule` File field.
 * return: A discriminated result indicating success (with normalized schedule data) or failure (with an error message).
 */
export async function scanScheduleAction(
  formData: FormData
): Promise<ScanScheduleActionResult> {
  noStore();

  const user = await requireAuthForAction();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!checkScheduleScanRateLimit(user.id)) {
    return { success: false, error: "Too many requests. Please wait a moment." };
  }

  const file = formData.get("schedule");
  if (!(file instanceof File)) {
    return { success: false, error: "No schedule file provided" };
  }

  const result = await scanSchedule(file);

  if (!result.ok) {
    const payload: ScanScheduleActionResult = { success: false, error: result.error };
    if (result.geminiError) payload.geminiError = result.geminiError;
    return payload;
  }

  const body = result.body as
    | { success?: boolean; data?: ScheduleData; method?: string; model?: string; error?: string }
    | undefined;

  if (body && body.success && body.data) {
    return {
      success: true,
      data: body.data,
      method: body.method ?? "python",
      ...(body.model ? { model: body.model } : {}),
    };
  }

  if (body && body.error) {
    return { success: false, error: body.error };
  }

  // Python service may return ScheduleData directly (legacy shape)
  if (body && typeof body === "object" && "principal" in body) {
    return {
      success: true,
      data: body as unknown as ScheduleData,
      method: "python",
    };
  }

  return { success: false, error: "Unexpected scan response" };
}
