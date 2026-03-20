import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/_lib/auth";
import { createWorker } from "tesseract.js";
import { z } from "zod";

export const maxDuration = 60;

// TODO: Re-enable Gemini when API quota is restored
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// Magic bytes for file type validation
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true; // no signature to check (e.g. heic)
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

// Zod schema for validating parsed result
const receiptResponseSchema = z.object({
  storeName: z.string().max(200).nullable().optional(),
  totalAmount: z.number().min(0).max(100_000_000),
  date: z.string().nullable().optional(),
  category: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
  items: z.array(z.object({
    name: z.string().max(200),
    amount: z.number(),
  })).optional().default([]),
  confidence: z.number().min(0).max(100).optional().default(50),
});

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

/* ── OCR via Tesseract.js ── */
async function runOCR(buffer: Buffer): Promise<{ text: string; confidence: number } | null> {
  try {
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(buffer);
    await worker.terminate();
    if (!data.text || data.text.trim().length < 10) return null;
    return { text: data.text, confidence: data.confidence };
  } catch (err) {
    console.error("[scan-receipt] Tesseract OCR failed:", err);
    return null;
  }
}

/* ── Category detection ── */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ["restaurant", "cafe", "coffee", "pizza", "burger", "food", "swiggy", "zomato", "uber eats", "dominos", "mcdonalds", "starbucks", "kfc", "subway", "bakery", "grocery", "supermarket", "bigbasket", "blinkit", "zepto", "dmart", "reliance fresh", "more", "spar"],
  Transport: ["uber", "ola", "lyft", "rapido", "taxi", "cab", "metro", "bus", "train", "petrol", "diesel", "fuel", "parking", "toll", "irctc", "redbus"],
  Shopping: ["amazon", "flipkart", "myntra", "ajio", "mall", "store", "shop", "retail", "mart", "clothing", "electronics", "wear", "fashion"],
  Entertainment: ["netflix", "spotify", "hotstar", "prime video", "movie", "cinema", "pvr", "inox", "theater", "theatre", "game", "play"],
  Health: ["pharmacy", "medical", "hospital", "clinic", "doctor", "medicine", "lab", "diagnostic", "apollo", "medplus", "1mg", "pharmeasy", "netmeds"],
  Education: ["book", "course", "udemy", "coursera", "school", "college", "tuition", "library", "stationery"],
  Utilities: ["electricity", "water", "gas", "internet", "broadband", "wifi", "mobile", "recharge", "jio", "airtel", "vodafone", "bsnl", "bill pay"],
  Rent: ["rent", "lease", "landlord", "housing", "apartment", "flat"],
  EMI: ["emi", "loan", "installment", "credit card"],
};

function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return "Other";
}

/* ── Receipt text parser ── */
function parseReceiptText(text: string, ocrConfidence: number) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // ── Find total amount ──
  let totalAmount: number | null = null;
  const totalPatterns = [
    // Explicit total labels
    /(?:grand\s*total|sub\s*total|total\s*amount|total\s*due|amount\s*due|amount\s*payable|net\s*amount|net\s*payable|total\s*bill|bill\s*total|total)[:\s]*[₹$€£]?\s*([\d,]+\.?\d*)/i,
    // Total with currency symbol prefix
    /(?:total|amount)[:\s]*(?:Rs\.?|INR|₹)\s*([\d,]+\.?\d*)/i,
    // Standalone currency amounts on total-like lines
    /(?:total|payable|due|balance|paid)[^\d]*[₹$€£]?\s*([\d,]+\.?\d{0,2})\s*$/i,
  ];

  // Search from bottom up (totals are usually near the end)
  for (const line of [...lines].reverse()) {
    for (const pat of totalPatterns) {
      const m = line.match(pat);
      if (m) {
        const val = parseFloat(m[1].replace(/,/g, ""));
        if (val > 0 && val < 100_000_000) {
          totalAmount = val;
          break;
        }
      }
    }
    if (totalAmount) break;
  }

  // If no labeled total, find the largest currency amount
  if (!totalAmount) {
    const amountPattern = /[₹$€£]\s*([\d,]+\.?\d*)|(?:Rs\.?|INR)\s*([\d,]+\.?\d*)|([\d,]+\.\d{2})/g;
    let maxAmount = 0;
    for (const line of lines) {
      let match;
      while ((match = amountPattern.exec(line)) !== null) {
        const val = parseFloat((match[1] || match[2] || match[3]).replace(/,/g, ""));
        if (val > maxAmount && val < 100_000_000) {
          maxAmount = val;
        }
      }
    }
    if (maxAmount > 0) totalAmount = maxAmount;
  }

  // ── Find date ──
  let date: string | null = null;
  const datePatterns: { re: RegExp; parse: (m: RegExpMatchArray) => Date | null }[] = [
    // YYYY-MM-DD or YYYY/MM/DD
    { re: /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/, parse: (m) => new Date(`${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`) },
    // DD-MM-YYYY or DD/MM/YYYY
    { re: /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/, parse: (m) => {
      const day = parseInt(m[1]), month = parseInt(m[2]);
      if (month >= 1 && month <= 12) return new Date(`${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`);
      if (day >= 1 && day <= 12) return new Date(`${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`);
      return null;
    }},
    // DD Mon YYYY or DD Month YYYY
    { re: /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*[\s,]+(\d{4})/i, parse: (m) => new Date(`${m[2]} ${m[1]}, ${m[3]}`) },
    // Mon DD, YYYY
    { re: /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2})[\s,]+(\d{4})/i, parse: (m) => new Date(`${m[1]} ${m[2]}, ${m[3]}`) },
  ];

  for (const line of lines) {
    for (const { re, parse } of datePatterns) {
      const m = line.match(re);
      if (m) {
        const d = parse(m);
        if (d && !isNaN(d.getTime()) && d.getFullYear() >= 2000 && d.getFullYear() <= 2030) {
          date = d.toISOString().split("T")[0];
          break;
        }
      }
    }
    if (date) break;
  }

  // ── Find store name (first meaningful line) ──
  let storeName: string | null = null;
  for (const line of lines.slice(0, 5)) {
    // Skip lines that are just numbers, dates, or very short
    if (line.length < 3) continue;
    if (/^\d+[/\-.]?\d*[/\-.]?\d*$/.test(line)) continue;
    if (/^(date|time|tel|ph|fax|gstin|gst|tin|invoice|receipt|bill|tax)/i.test(line)) continue;
    storeName = line.substring(0, 100);
    break;
  }

  // ── Extract line items ──
  const items: { name: string; amount: number }[] = [];
  const itemPattern = /^(.+?)\s+[₹$]?\s*([\d,]+\.?\d{0,2})\s*$/;
  for (const line of lines) {
    const m = line.match(itemPattern);
    if (m) {
      const name = m[1].trim();
      const amount = parseFloat(m[2].replace(/,/g, ""));
      // Skip total/subtotal lines and header-like lines
      if (
        name.length >= 2 &&
        amount > 0 &&
        amount < (totalAmount ?? Infinity) &&
        !/total|subtotal|tax|gst|cgst|sgst|discount|round|change|cash|card|upi|paid/i.test(name)
      ) {
        items.push({ name: name.substring(0, 200), amount });
      }
    }
  }

  if (!totalAmount) return null;

  const category = detectCategory(text);
  // Scale OCR confidence (0-100) to our receipt confidence
  // Good OCR (>80) with total found → 55-65 confidence
  const confidence = Math.min(65, Math.max(35, Math.round(ocrConfidence * 0.6 + (items.length > 0 ? 10 : 0) + (date ? 5 : 0))));

  return {
    storeName,
    totalAmount,
    date,
    category,
    description: storeName
      ? `${category} at ${storeName.substring(0, 30)}`
      : `${category} purchase`,
    items,
    confidence,
  };
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
      return NextResponse.json({ error: "File must be an image (JPG, PNG, WebP, HEIC/HEIF)" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Image must be under 10MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: "File content doesn't match its type" }, { status: 400 });
    }

    // OCR the image with Tesseract.js
    const ocrResult = await runOCR(buffer);
    if (!ocrResult) {
      return NextResponse.json(
        { error: "Could not read text from image. Try a clearer, well-lit photo." },
        { status: 422 }
      );
    }

    // Parse the OCR text
    const parsed = parseReceiptText(ocrResult.text, ocrResult.confidence);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not find a total amount in the receipt. Try a clearer photo." },
        { status: 422 }
      );
    }

    const validated = receiptResponseSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn("[scan-receipt] Validation failed:", validated.error.message);
      return NextResponse.json(
        { error: "Could not extract valid data from receipt." },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: validated.data, method: "tesseract-ocr" });
  } catch (error) {
    console.error("[scan-receipt] Unhandled error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to process receipt" }, { status: 500 });
  }
}
