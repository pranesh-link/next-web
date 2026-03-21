import { auth } from "@/_lib/auth";
import { getQwenClient, QWEN_MODEL } from "@/_lib/qwen";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 60;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];

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

const RECEIPT_PROMPT = `You are a receipt/invoice data extractor. Analyze this receipt image and extract the following into a JSON object:
{
  "storeName": "store or vendor name (string or null)",
  "totalAmount": total amount paid (number, required),
  "date": "YYYY-MM-DD or null if not found",
  "category": "one of: Food, Transport, Shopping, Entertainment, Health, Education, Utilities, Rent, EMI, Other",
  "description": "short description of the purchase",
  "items": [{"name": "item name", "amount": number}],
  "confidence": 0-100 how confident you are in the extraction
}
Return ONLY the JSON object, no markdown fences, no explanation.`;

/* ── Qwen VL vision extraction ── */
async function extractReceiptWithVision(
  buffer: Buffer,
  mimeType: string,
): Promise<z.infer<typeof receiptResponseSchema> | null> {
  const base64 = buffer.toString("base64");
  // Map HEIC/HEIF to JPEG for the data URL (converted upstream or best-effort)
  const dataUrlType = mimeType === "image/heic" || mimeType === "image/heif" ? "image/jpeg" : mimeType;
  const dataUrl = `data:${dataUrlType};base64,${base64}`;

  const response = await getQwenClient().chat.completions.create({
    model: QWEN_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUrl } },
          { type: "text", text: RECEIPT_PROMPT },
        ],
      },
    ],
    max_tokens: 2048,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  if (!raw.trim()) return null;

  try {
    const clean = raw.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    console.warn("[scan-receipt] Failed to parse Qwen response as JSON:", raw.substring(0, 200));
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

    // Extract receipt data with Qwen VL vision model
    const parsed = await extractReceiptWithVision(buffer, file.type);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not extract data from receipt image. Try a clearer, well-lit photo." },
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

    return NextResponse.json({ success: true, data: validated.data, method: "qwen-vl" });
  } catch (error) {
    console.error("[scan-receipt] Unhandled error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to process receipt" }, { status: 500 });
  }
}
