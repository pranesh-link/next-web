import { GoogleGenAI } from "@google/genai";

/** External Python scan-service base URL (optional fallback). */
export const SCAN_SERVICE_URL = process.env.SCAN_SERVICE_URL;

/** Bearer token for the external Python scan-service. */
export const SCAN_SERVICE_API_KEY = process.env.SCAN_SERVICE_API_KEY;

/** Google Gemini API key (primary scanner). */
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/** Gemini model id used for schedule parsing. */
export const GEMINI_SCHEDULE_MODEL =
  process.env.GEMINI_SCHEDULE_MODEL || "gemini-2.5-flash";

/** Lazily-initialised Gemini client; `null` when no API key is configured. */
export const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

/** MIME types accepted for schedule uploads. */
export const SCHEDULE_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);
