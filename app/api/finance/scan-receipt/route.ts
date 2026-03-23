import { GoogleGenAI } from "@google/genai";
import { auth } from "@/_lib/auth";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

// Python service fallback (kept temporarily while Gemini JS is being validated)
const SCAN_SERVICE_URL = process.env.SCAN_SERVICE_URL;
const SCAN_SERVICE_API_KEY = process.env.SCAN_SERVICE_API_KEY;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Singleton — avoid creating a new client per request
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

/* ── In-memory rate limiter ── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW = 60_000;

function checkRateLimit(userId: string): boolean {
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

async function scanWithGemini(fileBuffer: ArrayBuffer, mimeType: string) {
  if (!ai) throw new Error("Gemini API key not configured");

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    config: {
      temperature: 0.2,
      // Disable thinking — gemini-flash-latest now maps to gemini-3-flash-preview
      // which has thinking on by default, consuming output tokens
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

  let text = response.text?.trim() ?? "";

  // Strip markdown code fences if Gemini adds them
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }

  return JSON.parse(text) as {
    storeName: string | null;
    totalAmount: number | null;
    date: string | null;
    items: { name: string; amount: number }[];
    category: string;
    confidence: number;
  };
}

async function scanWithPythonService(file: File) {
  if (!SCAN_SERVICE_URL || !SCAN_SERVICE_API_KEY) return null;

  const proxyForm = new FormData();
  proxyForm.append("receipt", file, file.name);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const res = await fetch(`${SCAN_SERVICE_URL}/scan-receipt`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SCAN_SERVICE_API_KEY}` },
      body: proxyForm,
      signal: controller.signal,
    });
    const data = await res.json();
    return { data, status: res.status };
  } finally {
    clearTimeout(timeout);
  }
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("receipt") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No receipt file provided" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "File must be an image (JPG, PNG, WebP, HEIC/HEIF)" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 10MB" }, { status: 400 });
  }

  // ── Primary: Gemini Vision directly in Next.js ──
  if (GEMINI_API_KEY) {
    try {
      const parsed = await scanWithGemini(await file.arrayBuffer(), file.type || "image/jpeg");

      if (!parsed.totalAmount) {
        return NextResponse.json(
          { error: "Could not find a total amount in the receipt. Try a clearer photo." },
          { status: 422 }
        );
      }

      return NextResponse.json({ success: true, data: parsed, method: "gemini-js" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[scan-receipt] Gemini JS error:", msg);

      // Fall through to Python service if available
      if (!SCAN_SERVICE_URL) {
        return NextResponse.json(
          { error: "Could not read receipt. Try a clearer, well-lit photo." },
          { status: 422 }
        );
      }
    }
  }

  // ── Fallback: Python service (kept temporarily) ──
  if (!SCAN_SERVICE_URL || !SCAN_SERVICE_API_KEY) {
    return NextResponse.json({ error: "Scan service not configured" }, { status: 503 });
  }

  try {
    const result = await scanWithPythonService(file);
    if (!result) {
      return NextResponse.json({ error: "Scan service unavailable" }, { status: 503 });
    }
    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error("[scan-receipt] Python proxy error:", msg);
    if (msg.includes("aborted")) {
      return NextResponse.json({ error: "Scan timed out. Try a smaller or clearer image." }, { status: 504 });
    }
    return NextResponse.json({ error: "Scan service unavailable" }, { status: 502 });
  }
}
