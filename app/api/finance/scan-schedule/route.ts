import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/_lib/auth";
import { createWorker } from "tesseract.js";
import { z } from "zod";

// TODO: Re-enable Gemini when API quota is restored
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
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

/* ── OCR via Tesseract.js (for images) ── */
async function runOCR(buffer: Buffer): Promise<string | null> {
  try {
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(buffer);
    await worker.terminate();
    if (!data.text || data.text.trim().length < 20) return null;
    return data.text;
  } catch (err) {
    console.error("[scan-schedule] Tesseract OCR failed:", err);
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
    let extractedText: string | null = null;

    if (isPdf) {
      extractedText = await extractPdfText(buffer);
    } else {
      extractedText = await runOCR(buffer);
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return NextResponse.json(
        { error: isPdf
          ? "Could not extract text from PDF. Try a PDF with selectable text."
          : "Could not read text from image. Try a clearer, well-lit photo."
        },
        { status: 422 }
      );
    }

    const parsed = parseScheduleText(extractedText);
    if (!parsed) {
      return NextResponse.json(
        { error: "Could not extract loan schedule data. Try a clearer document." },
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
      method: isPdf ? "pdf-parse+regex" : "tesseract-ocr+regex",
    });
  } catch (error) {
    console.error("[scan-schedule] Unhandled error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 });
  }
}
