import { auth } from "@/_lib/auth";
import { getQwenClient, QWEN_MODEL } from "@/_lib/qwen";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// TODO: Re-enable Gemini when API quota is restored
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

// Magic bytes for file type validation
const MAGIC_BYTES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true;
  return signatures.some((sig) =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

// Zod schema for validating AI schedule response
const scheduleEntrySchema = z.object({
  month: z.number().int().min(0).max(1200),
  date: z.string().max(20).optional().default(""),
  emi: z.number().min(0).max(100_000_000),
  principal: z.number().min(0).max(100_000_000),
  interest: z.number().min(0).max(100_000_000),
  balance: z.number().min(0).max(500_000_000),
});

const scheduleResponseSchema = z.object({
  loanName: z.string().max(200).optional().default("Imported Loan"),
  principal: z.number().min(0).max(500_000_000),
  interestRate: z.number().min(0).max(50),
  tenureMonths: z.number().int().min(0).max(600),
  emiAmount: z.number().min(0).max(100_000_000),
  startDate: z.string().max(20).optional().default(""),
  remainingBalance: z.number().min(0).max(500_000_000),
  schedule: z.array(scheduleEntrySchema).optional().default([]),
  confidence: z.number().min(0).max(100).optional().default(50),
});

/* ── In-memory rate limiter ── */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
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

const SCHEDULE_PROMPT = `You are a loan amortization schedule extractor. Analyze this document and extract the loan schedule data into a JSON object:
{
  "loanName": "type of loan (Home Loan, Car Loan, Personal Loan, Education Loan, or Imported Loan)",
  "principal": total loan principal amount (number),
  "interestRate": annual interest rate as percentage (number),
  "tenureMonths": total number of months (number),
  "emiAmount": monthly EMI amount (number),
  "startDate": "YYYY-MM-DD or empty string",
  "remainingBalance": remaining balance (number),
  "schedule": [
    {
      "month": month number (1-based integer),
      "date": "YYYY-MM-DD or empty string",
      "emi": EMI payment amount (number),
      "principal": principal component (number),
      "interest": interest component (number),
      "balance": outstanding balance after payment (number)
    }
  ],
  "confidence": 0-100 how confident you are in the extraction
}
Extract as many schedule rows as visible. Return ONLY the JSON object, no markdown fences, no explanation.`;

/* ── Qwen VL vision extraction (for images) ── */
async function extractScheduleWithVision(
  buffer: Buffer,
  mimeType: string,
): Promise<z.infer<typeof scheduleResponseSchema> | null> {
  const base64 = buffer.toString("base64");
  const dataUrlType = mimeType === "image/heic" || mimeType === "image/heif" ? "image/jpeg" : mimeType;
  const dataUrl = `data:${dataUrlType};base64,${base64}`;

  const response = await getQwenClient().chat.completions.create({
    model: QWEN_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUrl } },
          { type: "text", text: SCHEDULE_PROMPT },
        ],
      },
    ],
    max_tokens: 4096,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  if (!raw.trim()) return null;

  try {
    const clean = raw.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    console.warn("[scan-schedule] Failed to parse Qwen response as JSON:", raw.substring(0, 200));
    return null;
  }
}

/* ── Qwen text extraction (for PDF text) ── */
async function extractScheduleFromText(
  text: string,
): Promise<z.infer<typeof scheduleResponseSchema> | null> {
  const response = await getQwenClient().chat.completions.create({
    model: QWEN_MODEL,
    messages: [
      {
        role: "user",
        content: SCHEDULE_PROMPT + "\n\nDocument text:\n" + text.substring(0, 8000),
      },
    ],
    max_tokens: 4096,
  });

  const raw = response.choices[0]?.message?.content ?? "";
  if (!raw.trim()) return null;

  try {
    const clean = raw.replace(/```json\n?|```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch {
    console.warn("[scan-schedule] Failed to parse Qwen text response as JSON:", raw.substring(0, 200));
    return null;
  }
}

/* ── pdf-parse fallback ── */
async function extractPdfText(buffer: Buffer): Promise<string | null> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text;
  } catch (err) {
    console.warn("[scan-schedule] pdf-parse failed:", err);
    return null;
  }
}

/* ── Regex-based schedule parser (last resort) ── */
function parseScheduleText(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Try to find EMI/principal/interest/balance patterns
  const numberPattern = /[\d,]+\.?\d*/g;
  const schedule: Array<{
    month: number; date: string; emi: number;
    principal: number; interest: number; balance: number;
  }> = [];

  let principal: number | null = null;
  let interestRate: number | null = null;
  let emiAmount: number | null = null;
  let loanName = "Imported Loan";

  // Look for loan metadata
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (!principal) {
      const m = lowerLine.match(/(?:loan\s*amount|principal|sanctioned)[:\s]*[₹$]?\s*([\d,]+\.?\d*)/);
      if (m) principal = parseFloat(m[1].replace(/,/g, ""));
    }
    if (!interestRate) {
      const m = lowerLine.match(/(?:interest\s*rate|roi|rate)[:\s]*([\d.]+)\s*%?/);
      if (m) interestRate = parseFloat(m[1]);
    }
    if (!emiAmount) {
      const m = lowerLine.match(/(?:emi|installment|monthly)[:\s]*[₹$]?\s*([\d,]+\.?\d*)/);
      if (m) emiAmount = parseFloat(m[1].replace(/,/g, ""));
    }
    if (lowerLine.includes("home loan")) loanName = "Home Loan";
    else if (lowerLine.includes("car loan") || lowerLine.includes("auto loan")) loanName = "Car Loan";
    else if (lowerLine.includes("personal loan")) loanName = "Personal Loan";
    else if (lowerLine.includes("education loan")) loanName = "Education Loan";
  }

  // Try to extract schedule rows: lines with 4+ numbers in sequence
  let monthNum = 1;
  for (const line of lines) {
    const nums = line.match(numberPattern);
    if (nums && nums.length >= 4) {
      const values = nums.map((n) => parseFloat(n.replace(/,/g, "")));
      // Heuristic: [emi, principal, interest, balance] or [month, emi, principal, interest, balance]
      if (values.length >= 5 && values[0] < 1000) {
        schedule.push({
          month: values[0],
          date: "",
          emi: values[1],
          principal: values[2],
          interest: values[3],
          balance: values[4],
        });
      } else if (values.length >= 4) {
        schedule.push({
          month: monthNum++,
          date: "",
          emi: values[0],
          principal: values[1],
          interest: values[2],
          balance: values[3],
        });
      }
    }
  }

  if (!principal && !emiAmount && schedule.length === 0) return null;

  return {
    loanName,
    principal: principal || (schedule[0]?.balance ?? 0),
    interestRate: interestRate || 0,
    tenureMonths: schedule.length || 0,
    emiAmount: emiAmount || (schedule[0]?.emi ?? 0),
    startDate: new Date().toISOString().split("T")[0],
    remainingBalance: schedule.length > 0 ? schedule[schedule.length - 1].balance : (principal || 0),
    schedule,
    confidence: schedule.length > 0 ? 35 : 15,
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
    const file = formData.get("schedule") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File must be a PDF or image (JPG, PNG, WebP, HEIC)" },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File must be under 20MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: "File content does not match declared type" }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf";
    let parsed: z.infer<typeof scheduleResponseSchema> | null = null;

    if (isPdf) {
      // For PDFs: extract text first, then send text to Qwen
      const pdfText = await extractPdfText(buffer);
      if (pdfText && pdfText.trim().length >= 20) {
        parsed = await extractScheduleFromText(pdfText);
      }
      // Fallback: regex-based parser on extracted text
      if (!parsed && pdfText) {
        parsed = parseScheduleText(pdfText);
      }
    } else {
      // For images: use Qwen VL vision directly
      parsed = await extractScheduleWithVision(buffer, file.type);
    }

    if (!parsed) {
      return NextResponse.json(
        { error: isPdf
          ? "Could not extract loan schedule from PDF. Try a PDF with selectable text."
          : "Could not extract loan schedule from image. Try a clearer, well-lit photo."
        },
        { status: 422 }
      );
    }

    const validated = scheduleResponseSchema.safeParse(parsed);
    if (!validated.success) {
      console.warn("[scan-schedule] Validation failed:", validated.error.message);
      return NextResponse.json(
        { error: "Could not extract valid schedule data." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: validated.data,
      method: isPdf ? "pdf-parse+qwen" : "qwen-vl",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown";
    console.error("[scan-schedule] Unhandled error:", msg);
    return NextResponse.json({ error: `Failed to process document: ${msg}` }, { status: 500 });
  }
}
