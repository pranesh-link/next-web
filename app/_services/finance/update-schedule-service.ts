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
 * Parse the pipe-separated rawScheduleText produced by the schedule scanner.
 * Format per line: month|YYYY-MM-DD|emi|principal|interest|balance
 *
 * param raw: The raw schedule text dump from the scan-schedule output.
 * return: Structured schedule rows in chronological order.
 */
function parseRawScheduleText(raw: string): ScheduleRow[] {
  const rows: ScheduleRow[] = [];
  let seq = 0;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const parts = trimmed.split("|");
    if (parts.length < 5) continue;

    const date = parts[1]?.trim() ?? "";
    const emi = Math.round(Math.abs(parseFloat(parts[2]) || 0));
    const principal = Math.round(Math.abs(parseFloat(parts[3]) || 0));
    const interest = Math.round(Math.abs(parseFloat(parts[4]) || 0));
    const balance = Math.round(Math.abs(parseFloat(parts[5] ?? "0") || 0));

    if (emi === 0 && principal === 0 && interest === 0) continue;
    if (!/\d{4}-\d{2}-\d{2}/.test(date)) continue;

    seq++;
    rows.push({ month: seq, date, emi, principal, interest, balance });
  }

  return rows;
}

export type UpdateScheduleResult =
  | { ok: true; status: 200; body: { success: true; rowsExtracted: number; method: string } }
  | { ok: false; status: number; error: string };

/**
 * Update a loan's persisted schedule by parsing the supplied rawScheduleText.
 * Verifies the loan belongs to the calling user (or their couple) before
 * writing.
 *
 * Caller is responsible for authentication.
 *
 * param userId: Authenticated user id.
 * param loanId: Target loan id.
 * param rawScheduleText: Pipe-separated schedule dump from the schedule scanner.
 * return: An {@link UpdateScheduleResult} envelope.
 */
export async function updateLoanScheduleFromRawText(
  userId: string,
  loanId: string,
  rawScheduleText: string
): Promise<UpdateScheduleResult> {
  if (!loanId || typeof loanId !== "string") {
    return { ok: false, status: 400, error: "loanId is required" };
  }
  if (
    !rawScheduleText ||
    typeof rawScheduleText !== "string" ||
    rawScheduleText.trim().length < 10
  ) {
    return {
      ok: false,
      status: 400,
      error: "rawScheduleText is required and must be non-empty",
    };
  }

  const coupleUserIds = await getUserIdsForCouple(userId);
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId: { in: coupleUserIds } },
    select: { id: true },
  });

  if (!loan) {
    return { ok: false, status: 404, error: "Loan not found" };
  }

  const rows = parseRawScheduleText(rawScheduleText.trim());
  console.log(`[update-schedule] Parsed ${rows.length} rows from rawScheduleText for loan ${loanId}`);

  if (rows.length === 0) {
    return {
      ok: false,
      status: 422,
      error: "No schedule rows could be parsed from the text",
    };
  }

  await prisma.loan.update({
    where: { id: loanId },
    data: { schedule: rows },
  });

  return {
    ok: true,
    status: 200,
    body: { success: true, rowsExtracted: rows.length, method: "text-parse" },
  };
}
