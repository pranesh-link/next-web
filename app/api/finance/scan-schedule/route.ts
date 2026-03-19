import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/_lib/auth";
import { z } from "zod";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const FETCH_TIMEOUT = 30_000; // 30s
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

const SCHEDULE_PROMPT = `You are a loan repayment schedule parser. Extract structured loan data from this document.
Return ONLY valid JSON (no markdown, no code fences) with these fields:
{
  "loanName": "name/type of loan (e.g. Home Loan, Car Loan, Personal Loan)",
  "principal": <number — original loan/principal amount>,
  "interestRate": <number — annual interest rate in percent, e.g. 8.5>,
  "tenureMonths": <number — total tenure in months>,
  "emiAmount": <number — monthly EMI amount>,
  "startDate": "YYYY-MM-DD of first EMI or disbursement date",
  "remainingBalance": <number — outstanding balance, or same as principal if new>,
  "schedule": [
    {
      "month": <number — installment number starting from 1>,
      "date": "YYYY-MM-DD",
      "emi": <number>,
      "principal": <number — principal component>,
      "interest": <number — interest component>,
      "balance": <number — outstanding balance after this EMI>
    }
  ],
  "confidence": <0-100 how confident you are>
}
IMPORTANT:
- Extract as many schedule rows as visible
- Interest rate must be annual (not monthly)
- schedule array ordered by month
- If not a repayment schedule: {"error": "Not a repayment schedule", "confidence": 0}`;

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

/* ── Gemini call ── */
async function callGemini(base64: string, mimeType: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      body: JSON.stringify({
        contents: [{ parts: [
          { text: SCHEDULE_PROMPT },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    }
  );
  if (!res.ok) {
    console.error("[scan-schedule] Gemini error status:", res.status);
    throw Object.assign(new Error("Gemini API error"), { status: res.status });
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
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
      body: JSON.stringify({
        contents: [{ parts: [
          { text: SCHEDULE_PROMPT + "\n\nExtracted PDF text:\n" + text.substring(0, 30_000) },
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
      }),
    }
  );
  if (!res.ok) throw new Error("Gemini text API error");
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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

    const base64 = buffer.toString("base64");
    const isPdf = file.type === "application/pdf";

    // Strategy 1: Gemini Vision (primary — works for both PDF and images)
    if (GEMINI_API_KEY) {
      try {
        const text = await callGemini(base64, file.type);
        const parsed = extractJson(text);
        if (parsed && !parsed.error) {
          const validated = scheduleResponseSchema.safeParse(parsed);
          if (validated.success) {
            return NextResponse.json({ success: true, data: validated.data, method: "gemini-vision" });
          }
          console.warn("[scan-schedule] Zod validation failed for gemini-vision");
        }
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        if (status !== 429 && status !== 403) {
          console.error("[scan-schedule] Gemini non-retryable error, status:", status);
        }
        console.warn("[scan-schedule] Gemini Vision failed, trying fallback…");
      }
    }

    // Strategy 2: pdf-parse text extraction + Gemini Text (for PDFs)
    if (isPdf) {
      const pdfText = await extractPdfText(buffer);
      if (pdfText && pdfText.trim().length > 50) {
        // Try Gemini text parsing (cheaper, text-only call)
        if (GEMINI_API_KEY) {
          try {
            const aiText = await callGeminiText(pdfText);
            const parsed = extractJson(aiText);
            if (parsed && !parsed.error) {
              const validated = scheduleResponseSchema.safeParse(parsed);
              if (validated.success) {
                return NextResponse.json({ success: true, data: validated.data, method: "pdf-parse+gemini-text" });
              }
              console.warn("[scan-schedule] Zod validation failed for pdf-parse+gemini-text");
            }
          } catch {
            console.warn("[scan-schedule] Gemini text fallback also failed");
          }
        }

        // Strategy 3: Pure regex parsing on PDF text (fully offline)
        const regexResult = parseScheduleText(pdfText);
        if (regexResult) {
          return NextResponse.json({ success: true, data: regexResult, method: "pdf-parse+regex" });
        }
      }
    }

    return NextResponse.json(
      { error: "Could not extract schedule data. Try a clearer document or PDF with selectable text." },
      { status: 422 }
    );
  } catch (error) {
    console.error("[scan-schedule] Unhandled error:", error instanceof Error ? error.message : "Unknown");
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 });
  }
}
