import { auth } from "@/_lib/auth";
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/_lib/prisma";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

export const maxDuration = 60;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_SCHEDULE_MODEL = process.env.GEMINI_SCHEDULE_MODEL || "gemini-2.5-flash";

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

type ScheduleRow = {
  month: number;
  date: string;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
};

/* ── Chunk prompt: text-to-text, no image ── */

function buildRowParsePrompt(rawScheduleText: string, startMonth: number, endMonth: number): string {
  return `You are a loan amortization schedule parser. Parse the following schedule text and extract ONLY the rows where the sequential row number (1-based, counting only regular EMI rows, excluding prepayment/part-payment/adjustment rows) is between ${startMonth} and ${endMonth} inclusive.

Schedule text:
${rawScheduleText}

Return a JSON array only — no markdown, no code fences, no explanation:
[{"month":${startMonth},"date":"YYYY-MM-DD","emi":0.00,"principal":0.00,"interest":0.00,"balance":0.00}, ...]

Rules:
- month: sequential 1-based row number in the FULL schedule (not relative to this chunk)
- date: payment date in YYYY-MM-DD format
- emi: total EMI paid that month
- principal: principal component
- interest: interest component
- balance: closing outstanding principal balance after this payment
- Skip prepayment / part-payment / principal adjustment rows when counting
- If no rows exist in the range ${startMonth}–${endMonth}, return []
- Return ONLY the JSON array, absolutely nothing else`;
}

/* ── Gemini text-to-text call ── */

async function callGeminiForRows(prompt: string): Promise<ScheduleRow[]> {
  if (!ai) throw new Error("Gemini API key not configured");

  const timeoutMs = 45_000;
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Gemini chunk request timed out")), timeoutMs)
  );

  const geminiPromise = ai.models.generateContent({
    model: GEMINI_SCHEDULE_MODEL,
    config: { temperature: 1.0, thinkingConfig: { thinkingBudget: 0 } },
    contents: [{ parts: [{ text: prompt }] }],
  });

  const response = await Promise.race([geminiPromise, timeoutPromise]);

  let text = response.text?.trim() ?? "";
  if (!text) throw new Error("Gemini returned empty response for chunk");

  // Strip markdown fences if present
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "").trim();
  }

  // Parse array
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed as ScheduleRow[];
  } catch {
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) return JSON.parse(arrMatch[0]) as ScheduleRow[];
    console.error("[update-schedule] JSON parse failed for chunk:", text.slice(0, 200));
    return [];
  }
}

/* ── Normalise extracted rows ── */

function normalizeRows(rows: ScheduleRow[]): ScheduleRow[] {
  return rows
    .filter((r) => r && (r.emi > 0 || r.principal > 0 || r.interest > 0))
    .map((r) => ({
      month: Math.max(1, Math.trunc(Number(r.month) || 1)),
      date: typeof r.date === "string" ? r.date.trim() : "",
      emi: Math.max(0, Math.round(Number(r.emi) || 0)),
      principal: Math.max(0, Math.round(Number(r.principal) || 0)),
      interest: Math.max(0, Math.round(Number(r.interest) || 0)),
      balance: Math.max(0, Math.round(Number(r.balance) || 0)),
    }))
    .sort((a, b) => a.month - b.month)
    .map((r, i) => ({ ...r, month: i + 1 })); // resequence to be safe
}

/* ── Route handler ── */

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { loanId?: string; rawScheduleText?: string; tenureMonths?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { loanId, rawScheduleText, tenureMonths } = body;

  if (!loanId || typeof loanId !== "string") {
    return NextResponse.json({ error: "loanId is required" }, { status: 400 });
  }
  if (!rawScheduleText || typeof rawScheduleText !== "string" || rawScheduleText.trim().length < 10) {
    return NextResponse.json({ error: "rawScheduleText is required and must be non-empty" }, { status: 400 });
  }
  if (!tenureMonths || typeof tenureMonths !== "number" || tenureMonths < 1) {
    return NextResponse.json({ error: "tenureMonths must be a positive number" }, { status: 400 });
  }

  // Verify the user owns (or is coupled to) this loan
  const userId = session.user.id;
  const coupleUserIds = await getUserIdsForCouple(userId);
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId: { in: coupleUserIds } },
    select: { id: true },
  });

  if (!loan) {
    return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  }

  if (!ai) {
    return NextResponse.json({ error: "Gemini API key not configured" }, { status: 503 });
  }

  // --- Chunked extraction ---
  const CHUNK_SIZE = 60;
  const numChunks = Math.ceil(tenureMonths / CHUNK_SIZE);
  const allRows: ScheduleRow[] = [];

  console.log(`[update-schedule] Extracting ${tenureMonths} rows in ${numChunks} chunk(s) for loan ${loanId}`);

  for (let c = 0; c < numChunks; c++) {
    const startMonth = c * CHUNK_SIZE + 1;
    const endMonth = Math.min((c + 1) * CHUNK_SIZE, tenureMonths);

    try {
      const prompt = buildRowParsePrompt(rawScheduleText.trim(), startMonth, endMonth);
      const rows = await callGeminiForRows(prompt);
      const validRows = rows.filter((r) => r.month >= startMonth && r.month <= endMonth);
      console.log(`[update-schedule] Chunk ${c + 1}/${numChunks}: extracted ${validRows.length} rows (${startMonth}–${endMonth})`);
      allRows.push(...validRows);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[update-schedule] Chunk ${c + 1} failed:`, msg);
      return NextResponse.json(
        { error: `Failed to extract rows ${startMonth}–${endMonth}: ${msg}` },
        { status: msg.includes("timed out") ? 504 : 422 }
      );
    }
  }

  if (allRows.length === 0) {
    return NextResponse.json({ error: "No schedule rows could be extracted from the text" }, { status: 422 });
  }

  const normalized = normalizeRows(allRows);

  // Persist to DB
  await prisma.loan.update({
    where: { id: loanId },
    data: { schedule: normalized },
  });

  console.log(`[update-schedule] Saved ${normalized.length} rows for loan ${loanId}`);

  return NextResponse.json({ success: true, rowsExtracted: normalized.length });
}
