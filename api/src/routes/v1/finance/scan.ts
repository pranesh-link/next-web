import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/auth.js";
import { GoogleGenAI } from "@google/genai";

type AuthReq = { userId: string };

// ── Gemini client ─────────────────────────────────────────────────────────────

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// ── In-memory rate limiter (resets per-process; good enough for single machine) ─

const rateMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string, max: number): boolean {
  const now = Date.now();
  const entry = rateMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// ── Shared Gemini call helper ─────────────────────────────────────────────────

async function callGemini(model: string, mimeType: string, fileBuffer: ArrayBuffer, prompt: string): Promise<string> {
  if (!ai) throw new Error("Gemini API key not configured");
  const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Gemini timed out")), 50_000));
  const call = ai.models.generateContent({
    model,
    config: { temperature: model.includes("flash") ? 0.2 : 1.0, thinkingConfig: { thinkingBudget: 0 } },
    contents: [{ parts: [
      { inlineData: { mimeType, data: Buffer.from(fileBuffer).toString("base64") } },
      { text: prompt },
    ]}],
  });
  const response = await Promise.race([call, timeout]);
  let text = response.text?.trim() ?? "";
  if (!text) throw new Error("Gemini returned empty response");
  const finishReason = (response as any).candidates?.[0]?.finishReason;
  if (finishReason === "MAX_TOKENS") throw new Error("Document too large: Gemini output truncated");
  if (text.startsWith("```")) text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  return text;
}

// ── Receipt scan ──────────────────────────────────────────────────────────────

const RECEIPT_ALLOWED_TYPES = new Set(["image/jpeg","image/jpg","image/png","image/webp","image/gif","image/heic","image/heif"]);
const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;
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
- category: best fit based on store type and items
- confidence: integer 1-100
- Return ONLY valid JSON, absolutely no other text`;

// ── Schedule scan (types inlined) ────────────────────────────────────────────

type ScheduleRow = { month: number; date: string; emi: number; principal: number; interest: number; balance: number };
type PrepaymentEntry = { date: string; amount: number; balanceAfter?: number };
type ScheduleData = {
  loanName: string; loanProvider?: string | null; loanAccountNumber?: string | null;
  scheduleGeneratedOn?: string | null; rawScheduleText?: string;
  principal: number; interestRate: number; tenureMonths: number; emiAmount: number;
  startDate: string; remainingBalance: number; totalScheduleRows?: number;
  prepayments?: PrepaymentEntry[]; schedule?: ScheduleRow[]; emisPaid?: number; confidence: number;
};

const SCHEDULE_ALLOWED_TYPES = new Set(["application/pdf","image/jpeg","image/jpg","image/png","image/webp","image/gif","image/heic","image/heif"]);
const SCHEDULE_MAX_BYTES = 20 * 1024 * 1024;
const GEMINI_SCHEDULE_MODEL = process.env.GEMINI_SCHEDULE_MODEL || "gemini-2.5-flash";

function buildSchedulePrompt(): string {
  const today = new Date().toISOString().split("T")[0];
  return `You are a loan repayment schedule parser. Today's date is ${today}. Extract key loan information from this document and return a single JSON object — no markdown, no code blocks, no explanation.

JSON format:
{
  "loanProvider": "lender or bank name only (string | null)",
  "loanName": "loan product or type only (string, default 'Imported Loan')",
  "loanAccountNumber": "string | null",
  "scheduleGeneratedOn": "YYYY-MM-DD | null",
  "principal": 0.00,
  "interestRate": 0.00,
  "tenureMonths": 0,
  "emiAmount": 0.00,
  "startDate": "YYYY-MM-DD or empty string",
  "remainingBalance": 0.00,
  "prepayments": [],
  "rawScheduleText": "ENTIRE amortization table as plain text, one row per line, pipe-separated: month|date|emi|principal|interest|balance. Use YYYY-MM-DD for dates. Empty string if no table.",
  "schedule": [],
  "confidence": 85
}

Rules:
- principal: original disbursed loan amount
- interestRate: annual rate as percentage (e.g. 8.5 not 0.085)
- tenureMonths: total months (count of regular EMI rows)
- emiAmount: most common recurring monthly EMI, ignoring first/last/prepayment rows
- startDate: first EMI date in YYYY-MM-DD
- remainingBalance: closing balance from the most recent EMI row on or before today (${today}). Return 0 if none.
- prepayments: part-payment rows where principal > normal EMI principal. Each: {"date":"YYYY-MM-DD","amount":0,"balanceAfter":0}. [] if none.
- schedule: always return []
- Return ONLY valid JSON`;
}

// normalizeScheduleData inlined from app/_services/finance/schedule-scan/normalize.ts
function roundMoney(v: number) { return Math.round(v); }
function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }
function parseIsoDate(v: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y,m,d] = v.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  return isNaN(dt.getTime()) ? null : dt;
}
function normalizeRows(rows?: ScheduleRow[]): ScheduleRow[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((r, i) => ({
      month: isFinite(r?.month) ? Math.max(1, Math.trunc(r.month)) : i+1,
      date: typeof r?.date === "string" ? r.date.trim() : "",
      emi: isFinite(r?.emi) ? Math.max(0, roundMoney(r.emi)) : 0,
      principal: isFinite(r?.principal) ? Math.max(0, roundMoney(r.principal)) : 0,
      interest: isFinite(r?.interest) ? Math.max(0, roundMoney(r.interest)) : 0,
      balance: isFinite(r?.balance) ? Math.max(0, roundMoney(r.balance)) : 0,
    }))
    .filter(r => r.emi > 0 || r.principal > 0 || r.interest > 0 || r.balance > 0)
    .sort((a, b) => {
      const da = parseIsoDate(a.date), db = parseIsoDate(b.date);
      if (da && db) return da.getTime() - db.getTime();
      if (da) return -1; if (db) return 1;
      return a.month - b.month;
    })
    .map((r, i) => ({ ...r, month: i+1 }));
}
function parseRawRows(raw: string): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  for (const line of raw.split("\n")) {
    const parts = line.trim().split("|");
    if (parts.length < 6) continue;
    const date = parts[1].trim();
    if (!parseIsoDate(date)) continue;
    const emi = parseFloat(parts[2].replace(/,/g,"")), principal = parseFloat(parts[3].replace(/,/g,"")),
          interest = parseFloat(parts[4].replace(/,/g,"")), balance = parseFloat(parts[5].replace(/,/g,""));
    if (!isFinite(emi) && !isFinite(principal)) continue;
    rows.push({ month: rows.length+1, date, emi: isFinite(emi)?Math.max(0,Math.round(emi)):0,
      principal: isFinite(principal)?Math.max(0,Math.round(principal)):0,
      interest: isFinite(interest)?Math.max(0,Math.round(interest)):0,
      balance: isFinite(balance)?Math.max(0,Math.round(balance)):0 });
  }
  return rows;
}
function getRegularEmi(schedule: ScheduleRow[]): number {
  const nonClosure = schedule.filter((r, i) => !(r.balance===0 && schedule[i-1] && r.emi < schedule[i-1].emi*0.75));
  const counts = new Map<number,number>();
  nonClosure.forEach(r => counts.set(r.emi, (counts.get(r.emi)??0)+1));
  let best = 0, bestCount = -1;
  for (const [emi, count] of counts) if (count > bestCount) { best=emi; bestCount=count; }
  return best || nonClosure[0]?.emi || 0;
}
function latestDueRow(schedule: ScheduleRow[], today: Date): ScheduleRow | null {
  let latest: ScheduleRow | null = null;
  for (const r of schedule) { const d = parseIsoDate(r.date); if (!d || d>today) continue; latest=r; }
  return latest;
}
function balanceFromRaw(raw: string, today: Date): number | null {
  let latestDate: Date|null=null, latestBal: number|null=null;
  for (const line of raw.split("\n")) {
    const parts = line.trim().split("|");
    if (parts.length < 6) continue;
    const d = parseIsoDate(parts[1].trim()), bal = parseFloat(parts[5].replace(/,/g,""));
    if (!d || !isFinite(bal) || bal<0 || d>today) continue;
    if (!latestDate || d>=latestDate) { latestDate=d; latestBal=Math.round(bal); }
  }
  return latestBal;
}
function normalizeScheduleData(parsed: ScheduleData): ScheduleData {
  const today = new Date(); today.setHours(0,0,0,0);
  const schedule = normalizeRows(parsed.schedule);
  const prepayments = (Array.isArray(parsed.prepayments) ? parsed.prepayments : [])
    .map(e => ({ date: typeof e?.date==="string"?e.date.trim():"", amount: typeof e?.amount==="number"?Math.max(0,roundMoney(e.amount)):0,
      balanceAfter: typeof e?.balanceAfter==="number"?Math.max(0,roundMoney(e.balanceAfter)):undefined }))
    .filter(e => e.amount > 0);
  const rawText = typeof parsed.rawScheduleText==="string" ? parsed.rawScheduleText.trim() : "";
  const effective = schedule.length===0&&rawText ? normalizeRows(parseRawRows(rawText)) : schedule;
  const firstRow = effective[0];
  const latestRow = latestDueRow(effective, today);
  const firstDate = firstRow ? parseIsoDate(firstRow.date) : null;
  const principalFromSchedule = firstRow ? roundMoney(firstRow.principal+firstRow.balance) : 0;
  const rawBal = effective.length===0&&rawText ? balanceFromRaw(rawText, today) : null;

  const normalized: ScheduleData = {
    loanName: parsed.loanName?.trim()||"Imported Loan",
    loanProvider: parsed.loanProvider?.trim()||null,
    loanAccountNumber: parsed.loanAccountNumber?.trim()||null,
    scheduleGeneratedOn: parsed.scheduleGeneratedOn?.trim()||null,
    rawScheduleText: rawText||undefined,
    principal: principalFromSchedule||Math.max(0,roundMoney(parsed.principal||0)),
    interestRate: Math.max(0,parsed.interestRate||0),
    tenureMonths: effective.length||Math.max(0,Math.trunc(parsed.tenureMonths||0)),
    emiAmount: effective.length>0 ? getRegularEmi(effective) : Math.max(0,roundMoney(parsed.emiAmount||0)),
    startDate: firstDate ? firstRow!.date : (parsed.startDate||""),
    remainingBalance: latestRow ? latestRow.balance : (rawBal ?? Math.max(0,roundMoney(parsed.remainingBalance||0))),
    totalScheduleRows: effective.length,
    prepayments,
    schedule: effective,
    emisPaid: latestRow ? effective.findIndex(r=>r.month===latestRow.month)+1 : parsed.emisPaid,
    confidence: clamp(Math.round(parsed.confidence||0),1,100),
  };

  if (effective.length===0 && normalized.startDate) {
    const start = parseIsoDate(normalized.startDate);
    if (start) {
      const elapsed = Math.max(0,(today.getFullYear()-start.getFullYear())*12+(today.getMonth()-start.getMonth()));
      const emiDayPassed = today.getDate() >= start.getDate();
      normalized.emisPaid = Math.min(elapsed+(emiDayPassed?1:0), normalized.tenureMonths);
    }
  }
  return normalized;
}

// ── Route registration ────────────────────────────────────────────────────────

export async function registerFinanceScanRoutes(app: FastifyInstance) {
  // POST /api/v1/finance/scan-receipt
  app.post("/scan-receipt", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;

    if (!checkRateLimit(userId, 20)) {
      return reply.code(429).send({ error: "Too many requests. Please wait a moment." });
    }

    if (!ai) return reply.code(503).send({ error: "Scan service not configured" });

    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "No receipt file provided" });

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);
    const mimeType = data.mimetype || "image/jpeg";

    if (!RECEIPT_ALLOWED_TYPES.has(mimeType)) {
      return reply.code(400).send({ error: "File must be an image (JPG, PNG, WebP, HEIC/HEIF)" });
    }
    if (buffer.length > RECEIPT_MAX_BYTES) {
      return reply.code(400).send({ error: "Image must be under 10MB" });
    }

    try {
      const text = await callGemini("gemini-flash-latest", mimeType, buffer.buffer as ArrayBuffer, RECEIPT_PROMPT);
      const parsed = JSON.parse(text);
      if (!parsed.totalAmount) {
        return reply.code(422).send({ error: "Could not extract total amount from receipt. Try a clearer image." });
      }
      return reply.send({ success: true, data: parsed, method: "gemini-js" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[scan-receipt] error:", msg);
      return reply.code(500).send({ error: `Scan failed: ${msg}` });
    }
  });

  // POST /api/v1/finance/scan-schedule
  app.post("/scan-schedule", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;

    if (!checkRateLimit(userId, 10)) {
      return reply.code(429).send({ error: "Too many requests. Please wait a moment." });
    }

    if (!ai) return reply.code(503).send({ error: "Scan service not configured" });

    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "No schedule file provided" });

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);
    const mimeType = data.mimetype || "image/jpeg";

    if (!SCHEDULE_ALLOWED_TYPES.has(mimeType)) {
      return reply.code(400).send({ error: "File must be a PDF or image (JPG, PNG, WebP, HEIC/HEIF)" });
    }
    if (buffer.length > SCHEDULE_MAX_BYTES) {
      return reply.code(400).send({ error: "File must be under 20MB" });
    }

    try {
      const text = await callGemini(GEMINI_SCHEDULE_MODEL, mimeType, buffer.buffer as ArrayBuffer, buildSchedulePrompt());
      const rawParsed = JSON.parse(text) as ScheduleData;
      const parsed = normalizeScheduleData(rawParsed);

      if (!parsed.principal && !parsed.emiAmount && !parsed.tenureMonths) {
        return reply.code(422).send({ error: "Could not extract loan schedule data. Try a clearer document." });
      }

      // Remaining balance fallback using compound interest formula
      if (
        parsed.remainingBalance <= 0 &&
        parsed.principal > 0 &&
        parsed.emiAmount > 0 &&
        parsed.emisPaid != null &&
        parsed.emisPaid < parsed.tenureMonths
      ) {
        const r = parsed.interestRate / 12 / 100;
        const n = parsed.emisPaid;
        parsed.remainingBalance = r > 0
          ? Math.max(0, Math.round(parsed.principal * Math.pow(1+r,n) - (parsed.emiAmount * (Math.pow(1+r,n)-1)) / r))
          : Math.max(0, Math.round(parsed.principal - parsed.emiAmount * n));
      }

      return reply.send({ success: true, data: parsed, method: "gemini-js", model: GEMINI_SCHEDULE_MODEL });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[scan-schedule] error:", msg);
      return reply.code(500).send({ error: `Scan failed: ${msg}` });
    }
  });
}
