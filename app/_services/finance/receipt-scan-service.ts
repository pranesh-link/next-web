import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

export function checkReceiptScanRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

const RECEIPT_PROMPT = `You are a receipt parser. Extract information from this receipt image and return ONLY a JSON object — no markdown, no code blocks, no explanation.

JSON format:
{
  "storeName": "name of the store or merchant (string or null)",
  "totalAmount": 0.00,
  "date": "YYYY-MM-DD or null",
  "items": [{"name": "item name", "amount": 0.00}],
  "category": "one of: Food, Transport, Shopping, Health, Entertainment, Utilities, Rent, EMI, Other",
  "confidence": 85
}

Rules:
- totalAmount: the grand total / amount paid — must be a number, not null
- date: YYYY-MM-DD format, or null if not clearly visible
- items: individual line items only; exclude subtotals, taxes, discounts, totals
- category: best fit based on store type and items — grocery/supermarket/provision stores → Food, pharmacies → Health, fuel/cab → Transport, clothing/electronics → Shopping
- confidence: integer 1-100 reflecting how clearly you could read the receipt
- Return ONLY valid JSON, absolutely no other text`;

export const RECEIPT_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
]);

export type ReceiptParsed = {
  storeName: string | null;
  totalAmount: number | null;
  date: string | null;
  items: { name: string; amount: number }[];
  category: string;
  confidence: number;
};

export type ReceiptScanResult =
  | { ok: true; status: 200; body: { success: true; data: ReceiptParsed; method: string } }
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; error: string };

async function scanWithGemini(fileBuffer: ArrayBuffer, mimeType: string): Promise<ReceiptParsed> {
  if (!ai) throw new Error("Gemini API key not configured");

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini request timed out")), 50_000)
  );

  const geminiPromise = ai.models.generateContent({
    model: "gemini-flash-latest",
    config: {
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 },
    },
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: Buffer.from(fileBuffer).toString("base64") } },
          { text: RECEIPT_PROMPT },
        ],
      },
    ],
  });

  const response = await Promise.race([geminiPromise, timeoutPromise]);

  let text = response.text?.trim() ?? "";

  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }

  return JSON.parse(text) as ReceiptParsed;
}

/**
 * Core receipt-scan logic. Validates the file, applies Gemini vision,
 * and returns a uniform result envelope.
 *
 * Caller is responsible for authentication and rate-limiting.
 *
 * @param file - The uploaded receipt image.
 * @returns A {@link ReceiptScanResult} envelope describing success or failure.
 */
export async function scanReceipt(file: File): Promise<ReceiptScanResult> {
  if (!RECEIPT_ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false, status: 400, error: "File must be an image (JPG, PNG, WebP, HEIC/HEIF)" };
  }

  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, status: 400, error: "Image must be under 10MB" };
  }

  if (!GEMINI_API_KEY) {
    return { ok: false, status: 503, error: "Scan service not configured" };
  }

  try {
    const parsed = await scanWithGemini(await file.arrayBuffer(), file.type || "image/jpeg");

    if (!parsed.totalAmount) {
      return {
        ok: false,
        status: 422,
        error: "Could not find a total amount in the receipt. Try a clearer photo.",
      };
    }

    return {
      ok: true,
      status: 200,
      body: { success: true, data: parsed, method: "gemini-js" },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[scan-receipt] Gemini JS error:", msg);
    return {
      ok: false,
      status: 422,
      error: "Could not read receipt. Try a clearer, well-lit photo.",
    };
  }
}
