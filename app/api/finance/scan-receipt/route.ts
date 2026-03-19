import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/_lib/auth";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

const RECEIPT_PROMPT = `You are a receipt/bill parser. Extract structured data from this receipt text.
Return ONLY valid JSON (no markdown, no code fences) with these fields:
{
  "storeName": "store or merchant name if visible",
  "totalAmount": <number — the total/grand total amount>,
  "date": "YYYY-MM-DD if visible, otherwise null",
  "category": "<best fit from: Food, Rent, Transport, Shopping, Entertainment, Health, Education, Utilities, EMI, Other>",
  "description": "brief 3-5 word summary of what was purchased",
  "items": [{"name": "item name", "amount": <number>}],
  "confidence": <0-100 how confident you are in the extraction>
}
If you cannot parse the data, return: {"error": "Could not read receipt", "confidence": 0}`;

const VISION_PROMPT = `You are a receipt/bill parser. Extract structured data from the receipt image.
Return ONLY valid JSON (no markdown, no code fences) with these fields:
{
  "storeName": "store or merchant name if visible",
  "totalAmount": <number — the total/grand total amount>,
  "date": "YYYY-MM-DD if visible, otherwise null",
  "category": "<best fit from: Food, Rent, Transport, Shopping, Entertainment, Health, Education, Utilities, EMI, Other>",
  "description": "brief 3-5 word summary of what was purchased",
  "items": [{"name": "item name", "amount": <number>}],
  "confidence": <0-100 how confident you are in the extraction>
}
If you cannot read the receipt, return: {"error": "Could not read receipt", "confidence": 0}`;

/* ── In-memory rate limiter ── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

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

/* ── Gemini AI call ── */
async function callGeminiVision(base64: string, mimeType: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: VISION_PROMPT },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    }
  );
  if (!res.ok) {
    const status = res.status;
    const errText = await res.text();
    console.error("[scan-receipt] Gemini error:", status, errText);
    throw Object.assign(new Error("Gemini API error"), { status });
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callGeminiText(text: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: RECEIPT_PROMPT + "\n\nReceipt text:\n" + text },
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    }
  );
  if (!res.ok) {
    throw new Error("Gemini text API error");
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/* ── OCR fallback via Tesseract.js ── */
async function ocrFallback(buffer: Buffer): Promise<string | null> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(buffer);
    await worker.terminate();
    return data.text;
  } catch (err) {
    console.warn("[scan-receipt] Tesseract fallback unavailable:", err);
    return null;
  }
}

/* ── Regex-based receipt parser (last resort) ── */
function parseReceiptText(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Find total amount — look for common patterns
  let totalAmount: number | null = null;
  const totalPatterns = [
    /(?:total|grand\s*total|amount\s*due|net\s*amount|payable)[:\s]*[₹$]?\s*([\d,]+\.?\d*)/i,
    /[₹$]\s*([\d,]+\.?\d*)\s*$/,
  ];
  for (const line of [...lines].reverse()) {
    for (const pat of totalPatterns) {
      const m = line.match(pat);
      if (m) {
        totalAmount = parseFloat(m[1].replace(/,/g, ""));
        break;
      }
    }
    if (totalAmount) break;
  }

  // Find date
  let date: string | null = null;
  const datePatterns = [
    /(\d{4}[-/]\d{2}[-/]\d{2})/,
    /(\d{2}[-/]\d{2}[-/]\d{4})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4})/i,
  ];
  for (const line of lines) {
    for (const pat of datePatterns) {
      const m = line.match(pat);
      if (m) {
        const d = new Date(m[1]);
        if (!isNaN(d.getTime())) {
          date = d.toISOString().split("T")[0];
          break;
        }
      }
    }
    if (date) break;
  }

  // Store name is usually the first non-empty line
  const storeName = lines[0] || null;

  if (!totalAmount) return null;

  return {
    storeName,
    totalAmount,
    date,
    category: "Other" as const,
    description: storeName ? storeName.substring(0, 50) : "Receipt purchase",
    items: [] as { name: string; amount: number }[],
    confidence: 30,
  };
}

function extractJson(text: string) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

/* ── Handler ── */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("receipt") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No receipt image provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "File must be an image (JPG, PNG, WebP, HEIC)" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image must be under 10MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    // Strategy 1: Gemini Vision (primary)
    if (GEMINI_API_KEY) {
      try {
        const text = await callGeminiVision(base64, file.type);
        const parsed = extractJson(text);
        if (parsed && !parsed.error) {
          return NextResponse.json({ success: true, data: parsed, method: "gemini-vision" });
        }
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        // 429 = rate limited, 403 = quota exceeded — fall through to fallback
        if (status !== 429 && status !== 403) {
          console.error("[scan-receipt] Gemini non-retryable error:", err);
        }
        console.warn("[scan-receipt] Gemini Vision failed, trying fallback…");
      }
    }

    // Strategy 2: OCR (tesseract.js) + Gemini Text (hybrid fallback)
    const ocrText = await ocrFallback(buffer);
    if (ocrText && ocrText.trim().length > 20) {
      // Try Gemini text parsing on OCR output (cheaper, text-only)
      if (GEMINI_API_KEY) {
        try {
          const aiText = await callGeminiText(ocrText);
          const parsed = extractJson(aiText);
          if (parsed && !parsed.error) {
            return NextResponse.json({ success: true, data: parsed, method: "ocr+gemini-text" });
          }
        } catch {
          console.warn("[scan-receipt] Gemini text fallback also failed");
        }
      }

      // Strategy 3: Pure regex parsing on OCR text (fully offline)
      const regexResult = parseReceiptText(ocrText);
      if (regexResult) {
        return NextResponse.json({ success: true, data: regexResult, method: "ocr+regex" });
      }
    }

    return NextResponse.json(
      { error: "Could not extract data from receipt. Try a clearer photo." },
      { status: 422 }
    );
  } catch (error) {
    console.error("[scan-receipt] Unhandled error:", error);
    return NextResponse.json({ error: "Failed to process receipt" }, { status: 500 });
  }
}
