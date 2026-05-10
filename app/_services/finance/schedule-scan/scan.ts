import {
  GEMINI_API_KEY,
  GEMINI_SCHEDULE_MODEL,
  SCAN_SERVICE_API_KEY,
  SCAN_SERVICE_URL,
  SCHEDULE_ALLOWED_MIME_TYPES,
} from "./config";
import { scanWithGemini } from "./gemini";
import { normalizeScheduleData } from "./normalize";
import { scanWithPythonService } from "./python-fallback";
import type { ScheduleScanResult } from "./types";

/**
 * Core loan-schedule scanning logic. Handles file validation, primary
 * Gemini Vision parsing (with normalization + remaining-balance fallback),
 * and the Python service fallback.
 *
 * Caller is responsible for authentication and rate-limiting.
 *
 * @param file - The uploaded schedule PDF or image.
 * @returns A {@link ScheduleScanResult} envelope describing success or failure.
 */
export async function scanSchedule(file: File): Promise<ScheduleScanResult> {
  if (!SCHEDULE_ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      ok: false,
      status: 400,
      error: "File must be a PDF or image (JPG, PNG, WebP, HEIC/HEIF)",
    };
  }

  if (file.size > 20 * 1024 * 1024) {
    return { ok: false, status: 400, error: "File must be under 20MB" };
  }

  if (GEMINI_API_KEY) {
    try {
      const rawParsed = await scanWithGemini(await file.arrayBuffer(), file.type || "image/jpeg");
      const parsed = normalizeScheduleData(rawParsed);

      if (!parsed.principal && !parsed.emiAmount && !parsed.tenureMonths) {
        return {
          ok: false,
          status: 422,
          error: "Could not extract loan schedule data. Try a clearer document.",
        };
      }

      if (
        parsed.remainingBalance <= 0 &&
        parsed.principal > 0 &&
        parsed.emiAmount > 0 &&
        parsed.emisPaid != null &&
        parsed.emisPaid < parsed.tenureMonths
      ) {
        const r = parsed.interestRate / 12 / 100;
        const n = parsed.emisPaid;
        if (r > 0) {
          const factor = Math.pow(1 + r, n);
          parsed.remainingBalance = Math.max(
            0,
            Math.round(parsed.principal * factor - (parsed.emiAmount * (factor - 1)) / r),
          );
        } else {
          parsed.remainingBalance = Math.max(
            0,
            Math.round(parsed.principal - parsed.emiAmount * n),
          );
        }
      }

      return {
        ok: true,
        status: 200,
        body: { success: true, data: parsed, method: "gemini-js", model: GEMINI_SCHEDULE_MODEL },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[scan-schedule] Gemini JS error:", msg);

      const isTimeout = msg.includes("timed out");
      const isEmpty = msg.includes("empty response");
      const isTooLarge = msg.includes("too large") || msg.includes("truncated");
      const isQuotaExceeded = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
      return {
        ok: false,
        status: isTimeout ? 504 : isQuotaExceeded ? 503 : 422,
        error: isTimeout
          ? "Document took too long to process. Try a shorter schedule or upload a PDF."
          : isTooLarge
          ? "Schedule is too long to process in one pass. Try uploading a PDF with fewer pages."
          : isQuotaExceeded
          ? "AI service is temporarily unavailable (rate limit). Please try again in a minute."
          : isEmpty
          ? "Could not read this document. Try uploading a clearer copy or a different file."
          : `Could not parse the document. ${msg.includes("Response started with:") ? msg.split("Response started with:")[1]?.trim().slice(0, 80) : "Try a different file or clearer scan."}`,
        geminiError: msg,
      };
    }
  }

  if (!SCAN_SERVICE_URL || !SCAN_SERVICE_API_KEY) {
    return { ok: false, status: 503, error: "Scan service not configured" };
  }

  try {
    const result = await scanWithPythonService(file);
    if (!result) {
      return { ok: false, status: 503, error: "Scan service unavailable" };
    }
    return { ok: true, status: result.status, body: result.data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error("[scan-schedule] Python proxy error:", msg);
    if (msg.includes("aborted")) {
      return { ok: false, status: 504, error: "Scan timed out. Try a smaller or clearer file." };
    }
    return { ok: false, status: 502, error: "Scan service unavailable" };
  }
}
