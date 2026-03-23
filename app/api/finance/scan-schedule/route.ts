import { auth } from "@/_lib/auth";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

// Python service fallback
const SCAN_SERVICE_URL = process.env.SCAN_SERVICE_URL;
const SCAN_SERVICE_API_KEY = process.env.SCAN_SERVICE_API_KEY;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_SCHEDULE_MODEL = process.env.GEMINI_SCHEDULE_MODEL || "gemini-flash-latest";

// Singleton — avoid creating a new client per request
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

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

function buildSchedulePrompt(): string {
  const today = new Date().toISOString().split("T")[0];
  return `You are a loan repayment schedule parser. Today's date is ${today}. Extract ALL information from this document and return a single JSON object — no markdown, no code blocks, no explanation.

JSON format:
{
  "loanProvider": "lender or bank name only (string | null). Examples: 'BAJAJ HOUSING FINANCE', 'SBI', 'HDFC BANK', 'ICICI BANK'. Look for the institution/lender name in the document header. Null if not found.",
  "loanName": "loan product or type only — do NOT include the lender name here (string, default 'Imported Loan'). Examples: 'HOME LOAN', 'HOME LOAN TOPUP', 'CAR LOAN', 'PERSONAL LOAN', 'LAP'. Look for a product type / loan type field in the document header — use that value only.",
  "loanAccountNumber": "string | null  // loan or account/reference number exactly as printed in the document header or footer (e.g. 'XXXXXXXXXX01'). Null if not found.",
  "scheduleGeneratedOn": "YYYY-MM-DD | null  // date this document was generated/printed/issued — look for 'Generated on', 'Statement Date', 'As of', 'Print Date', 'Schedule Date' in the header or footer. Null if not found.",
  "principal": 0.00,
  "interestRate": 0.00,
  "tenureMonths": 0,
  "emiAmount": 0.00,
  "startDate": "YYYY-MM-DD or empty string",
  "remainingBalance": 0.00,
  "prepayments": [],
  "schedule": [],
  "confidence": 85
}

Rules:
- principal: the original loan amount (disbursed amount)
- interestRate: annual interest rate as a percentage (e.g. 8.5 not 0.085)
- tenureMonths: total loan tenure in months (count of regular EMI rows in the schedule)
- emiAmount: the regular recurring monthly EMI amount for the normal EMI schedule. Derive this from the repeated standard EMI rows, not from irregular first/last rows, moratorium/adjustment rows, partial-month rows, or any prepayment/part-payment/principal adjustment rows. If multiple EMI values appear, choose the most common recurring EMI among the regular schedule rows.
- startDate: first EMI payment date in YYYY-MM-DD format, or empty string
- remainingBalance: find the MOST RECENT EMI row whose date is on or before today (${today}). Return the closing principal / outstanding balance from that row. If the schedule has no rows on or before today, return 0
- prepayments: array of part-prepayments found in the schedule — rows labeled as part-payment, prepayment, principal adjustment, or rows where the principal component is significantly larger than a normal EMI principal. Each entry: {"date": "YYYY-MM-DD", "amount": 0.00, "balanceAfter": 0.00}. If none found, return []
- schedule: array of ALL regular EMI rows from the amortization table (exclude prepayment rows). Each entry MUST have exactly these fields:
  {"month": 1, "date": "YYYY-MM-DD", "emi": 0.00, "principal": 0.00, "interest": 0.00, "balance": 0.00}
  month is the sequential row number (1-based). date is the payment date. emi is total EMI paid for that EMI row. principal is the principal component. interest is the interest component. balance is the closing/outstanding principal balance after payment.
  Extract EVERY row — do not skip, truncate, or summarise rows. If the document has 171 rows, return all 171.
- Do not let a one-off EMI value override the regular emiAmount field. The schedule array should preserve each row's actual EMI, but the top-level emiAmount must represent the standard recurring EMI.
- confidence: integer 1-100 reflecting how clearly you could read the document
- Return ONLY valid JSON, absolutely no other text`;
}

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif",
]);

type PrepaymentEntry = {
  date: string;
  amount: number;
  balanceAfter?: number;
};

type ScheduleRow = {
  month: number;
  date: string;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
};

type ScheduleData = {
  loanName: string;
  loanProvider?: string | null;
  loanAccountNumber?: string | null;
  scheduleGeneratedOn?: string | null;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: string;
  remainingBalance: number;
  totalScheduleRows?: number;
  prepayments?: PrepaymentEntry[];
  schedule?: ScheduleRow[];
  emisPaid?: number;
  confidence: number;
};

function roundMoney(value: number): number {
  return Math.round(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function normalizeScheduleRows(schedule?: ScheduleRow[]): ScheduleRow[] {
  if (!Array.isArray(schedule)) return [];

  return schedule
    .map((row, index) => {
      const month = Number.isFinite(row?.month) ? Math.max(1, Math.trunc(row.month)) : index + 1;
      const emi = Number.isFinite(row?.emi) ? Math.max(0, roundMoney(row.emi)) : 0;
      const principal = Number.isFinite(row?.principal) ? Math.max(0, roundMoney(row.principal)) : 0;
      const interest = Number.isFinite(row?.interest) ? Math.max(0, roundMoney(row.interest)) : 0;
      const balance = Number.isFinite(row?.balance) ? Math.max(0, roundMoney(row.balance)) : 0;
      const date = typeof row?.date === "string" ? row.date.trim() : "";

      return { month, date, emi, principal, interest, balance };
    })
    .filter((row) => row.emi > 0 || row.principal > 0 || row.interest > 0 || row.balance > 0)
    .sort((left, right) => {
      const leftDate = parseIsoDate(left.date);
      const rightDate = parseIsoDate(right.date);
      if (leftDate && rightDate) return leftDate.getTime() - rightDate.getTime();
      if (leftDate) return -1;
      if (rightDate) return 1;
      return left.month - right.month;
    })
    .map((row, index) => ({ ...row, month: index + 1 }));
}

function normalizePrepayments(prepayments?: PrepaymentEntry[]): PrepaymentEntry[] {
  if (!Array.isArray(prepayments)) return [];

  return prepayments
    .map((entry) => {
      const amount = typeof entry?.amount === "number" ? entry.amount : NaN;
      const balanceAfter = typeof entry?.balanceAfter === "number" ? entry.balanceAfter : NaN;

      return {
        date: typeof entry?.date === "string" ? entry.date.trim() : "",
        amount: Number.isFinite(amount) ? Math.max(0, roundMoney(amount)) : 0,
        balanceAfter: Number.isFinite(balanceAfter)
          ? Math.max(0, roundMoney(balanceAfter))
          : undefined,
      };
    })
    .filter((entry) => entry.amount > 0)
    .sort((left, right) => {
      const leftDate = parseIsoDate(left.date);
      const rightDate = parseIsoDate(right.date);
      if (leftDate && rightDate) return leftDate.getTime() - rightDate.getTime();
      if (leftDate) return -1;
      if (rightDate) return 1;
      return 0;
    });
}

function getRegularEmiAmount(schedule: ScheduleRow[]): number {
  // Exclude the closing row (last row with balance=0 whose EMI is much smaller than the preceding row).
  const nonClosureRows = schedule.filter((row, index) => {
    const previous = schedule[index - 1];
    return !(row.balance === 0 && previous && row.emi < previous.emi * 0.75);
  });

  // Find the mode (most frequent EMI) across ALL non-closure rows.
  // This correctly handles floating-rate loans where a new rate dominates the bulk of the schedule.
  const counts = new Map<number, number>();
  nonClosureRows.forEach((row) => {
    counts.set(row.emi, (counts.get(row.emi) ?? 0) + 1);
  });

  let selectedEmi = 0;
  let selectedCount = -1;

  for (const [emi, count] of counts.entries()) {
    if (count > selectedCount) {
      selectedEmi = emi;
      selectedCount = count;
    }
  }

  return selectedEmi || nonClosureRows[0]?.emi || 0;
}

function getMostRecentScheduleRow(schedule: ScheduleRow[], today: Date): ScheduleRow | null {
  let latest: ScheduleRow | null = null;

  for (const row of schedule) {
    const date = parseIsoDate(row.date);
    if (!date || date.getTime() > today.getTime()) continue;
    latest = row;
  }

  return latest;
}

function normalizeScheduleData(parsed: ScheduleData): ScheduleData {
  const today = startOfToday();
  const schedule = normalizeScheduleRows(parsed.schedule);
  const prepayments = normalizePrepayments(parsed.prepayments);
  const firstRow = schedule[0];
  const latestDueRow = getMostRecentScheduleRow(schedule, today);
  const firstRowDate = firstRow ? parseIsoDate(firstRow.date) : null;
  const principalFromFirstRow = firstRow ? roundMoney(firstRow.principal + firstRow.balance) : 0;

  const normalized: ScheduleData = {
    loanName: parsed.loanName?.trim() || "Imported Loan",
    loanProvider: parsed.loanProvider?.trim() || null,
    loanAccountNumber: parsed.loanAccountNumber?.trim() || null,
    scheduleGeneratedOn: parsed.scheduleGeneratedOn?.trim() || null,
    principal: principalFromFirstRow || Math.max(0, roundMoney(parsed.principal || 0)),
    interestRate: Math.max(0, parsed.interestRate || 0),
    tenureMonths: schedule.length || Math.max(0, Math.trunc(parsed.tenureMonths || 0)),
    emiAmount: schedule.length > 0
      ? getRegularEmiAmount(schedule)
      : Math.max(0, roundMoney(parsed.emiAmount || 0)),
    startDate: firstRowDate ? firstRow.date : (parsed.startDate || ""),
    remainingBalance: latestDueRow
      ? latestDueRow.balance
      : Math.max(0, roundMoney(parsed.remainingBalance || 0)),
    totalScheduleRows: schedule.length,
    prepayments,
    schedule,
    emisPaid: latestDueRow ? schedule.findIndex((row) => row.month === latestDueRow.month) + 1 : parsed.emisPaid,
    confidence: clamp(Math.round(parsed.confidence || 0), 1, 100),
  };

  if (schedule.length === 0 && normalized.startDate) {
    const start = parseIsoDate(normalized.startDate);
    if (start) {
      const monthsElapsed = Math.max(
        0,
        (today.getFullYear() - start.getFullYear()) * 12 +
          (today.getMonth() - start.getMonth()),
      );
      const emiDayPassed = today.getDate() >= start.getDate();
      normalized.emisPaid = Math.min(
        monthsElapsed + (emiDayPassed ? 1 : 0),
        normalized.tenureMonths,
      );
    }
  }

  return normalized;
}

async function scanWithGemini(fileBuffer: ArrayBuffer, mimeType: string): Promise<ScheduleData> {
  if (!ai) throw new Error("Gemini API key not configured");

  // Fail gracefully at 50s so the error is catchable before Vercel's 60s hard kill
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini request timed out")), 50_000)
  );

  const geminiPromise = ai.models.generateContent({
    model: GEMINI_SCHEDULE_MODEL,
    config: {
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 },
    },
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: Buffer.from(fileBuffer).toString("base64") } },
          { text: buildSchedulePrompt() },
        ],
      },
    ],
  });

  const response = await Promise.race([geminiPromise, timeoutPromise]);

  let text = response.text?.trim() ?? "";

  // Strip markdown code fences if Gemini adds them
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }

  return JSON.parse(text) as ScheduleData;
}

async function scanWithPythonService(file: File) {
  if (!SCAN_SERVICE_URL || !SCAN_SERVICE_API_KEY) return null;

  const proxyForm = new FormData();
  proxyForm.append("schedule", file, file.name);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55_000);

  try {
    const res = await fetch(`${SCAN_SERVICE_URL}/scan-schedule`, {
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

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("schedule") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No schedule file provided" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: "File must be a PDF or image (JPG, PNG, WebP, HEIC/HEIF)" }, { status: 400 });
  }

  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 20MB" }, { status: 400 });
  }

  // ── Primary: Gemini Vision directly in Next.js ──
  if (GEMINI_API_KEY) {
    try {
      const rawParsed = await scanWithGemini(await file.arrayBuffer(), file.type || "image/jpeg");
      const parsed = normalizeScheduleData(rawParsed);

      if (!parsed.principal && !parsed.emiAmount && !parsed.tenureMonths) {
        return NextResponse.json(
          { error: "Could not extract loan schedule data. Try a clearer document." },
          { status: 422 }
        );
      }

      // remainingBalance is extracted directly from the schedule by Gemini.
      // Fallback to amortization formula only if Gemini returned 0 for an active loan.
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

      return NextResponse.json({ success: true, data: parsed, method: "gemini-js" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[scan-schedule] Gemini JS error:", msg);

      // Fall through to Python service if available
      if (!SCAN_SERVICE_URL) {
        return NextResponse.json(
          { error: "Could not read schedule. Try a clearer, well-lit photo." },
          { status: 422 }
        );
      }
    }
  }

  // ── Fallback: Python service ──
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
    console.error("[scan-schedule] Python proxy error:", msg);
    if (msg.includes("aborted")) {
      return NextResponse.json({ error: "Scan timed out. Try a smaller or clearer file." }, { status: 504 });
    }
    return NextResponse.json({ error: "Scan service unavailable" }, { status: 502 });
  }
}
