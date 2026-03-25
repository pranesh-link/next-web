import { auth } from "@/_lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/_lib/prisma";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";

type ScheduleRow = {
  month: number;
  date: string;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
};

/**
 * Parse the pipe-separated rawScheduleText produced by scan-schedule Phase 1.
 * Format per line: month|YYYY-MM-DD|emi|principal|interest|balance
 * No LLM required — pure string parsing.
 */
function parseRawScheduleText(raw: string): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  let seq = 0;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split("|");
    if (parts.length < 5) continue; // need at least month|date|emi|principal|interest

    const date = parts[1]?.trim() ?? "";
    const emi = Math.round(Math.abs(parseFloat(parts[2]) || 0));
    const principal = Math.round(Math.abs(parseFloat(parts[3]) || 0));
    const interest = Math.round(Math.abs(parseFloat(parts[4]) || 0));
    const balance = Math.round(Math.abs(parseFloat(parts[5] ?? "0") || 0));

    // Skip header rows or rows with no financial data
    if (emi === 0 && principal === 0 && interest === 0) continue;
    // Skip rows where date doesn't look like a date
    if (!/\d{4}-\d{2}-\d{2}/.test(date)) continue;

    seq++;
    rows.push({ month: seq, date, emi, principal, interest, balance });
  }

  return rows;
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

  const { loanId, rawScheduleText } = body;

  if (!loanId || typeof loanId !== "string") {
    return NextResponse.json({ error: "loanId is required" }, { status: 400 });
  }
  if (!rawScheduleText || typeof rawScheduleText !== "string" || rawScheduleText.trim().length < 10) {
    return NextResponse.json({ error: "rawScheduleText is required and must be non-empty" }, { status: 400 });
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

  const rows = parseRawScheduleText(rawScheduleText.trim());
  console.log(`[update-schedule] Parsed ${rows.length} rows from rawScheduleText for loan ${loanId}`);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No schedule rows could be parsed from the text" }, { status: 422 });
  }

  await prisma.loan.update({
    where: { id: loanId },
    data: { schedule: rows },
  });

  return NextResponse.json({ success: true, rowsExtracted: rows.length, method: "text-parse" });
}
