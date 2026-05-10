"use server";

import { unstable_noStore as noStore } from "next/cache";
import { requireAuthForAction } from "@/_lib/auth-utils";
import {
  scanReceipt,
  checkReceiptScanRateLimit,
  type ReceiptParsed,
} from "@/_services/finance/receipt-scan-service";

export type ScanReceiptActionResult =
  | { success: true; data: ReceiptParsed; method: string }
  | { success: false; error: string };

/**
 * Server-action wrapper around the receipt-scan service.
 *
 * Accepts a FormData with a `receipt` File entry (matches the existing
 * route handler contract), performs auth + rate-limit checks, then
 * delegates to the shared service.
 *
 * param formData: FormData containing the `receipt` File field.
 * return: A discriminated result indicating success (with parsed data) or failure (with an error message).
 */
export async function scanReceiptAction(
  formData: FormData
): Promise<ScanReceiptActionResult> {
  noStore();

  const user = await requireAuthForAction();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!checkReceiptScanRateLimit(user.id)) {
    return { success: false, error: "Too many requests. Please wait a moment." };
  }

  const file = formData.get("receipt");
  if (!(file instanceof File)) {
    return { success: false, error: "No receipt file provided" };
  }

  const result = await scanReceipt(file);

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  // The service returns either the gemini envelope (success: true, data, method)
  // or the raw python-service body. Normalize both to ScanReceiptActionResult.
  const body = result.body as
    | { success?: boolean; data?: ReceiptParsed; method?: string; error?: string }
    | undefined;

  if (body && body.success && body.data) {
    return { success: true, data: body.data, method: body.method ?? "python" };
  }

  if (body && body.error) {
    return { success: false, error: body.error };
  }

  // Python service returns the parsed object directly without success wrapper
  if (body && typeof body === "object" && "totalAmount" in body) {
    return {
      success: true,
      data: body as unknown as ReceiptParsed,
      method: "python",
    };
  }

  return { success: false, error: "Unexpected scan response" };
}
