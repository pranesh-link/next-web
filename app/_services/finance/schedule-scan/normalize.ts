import type { PrepaymentEntry, ScheduleData, ScheduleRow } from "./types";

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
  const nonClosureRows = schedule.filter((row, index) => {
    const previous = schedule[index - 1];
    return !(row.balance === 0 && previous && row.emi < previous.emi * 0.75);
  });

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

function parseRawScheduleToRows(raw: string): ScheduleRow[] {
  const rows: ScheduleRow[] = [];

  for (const line of raw.split("\n")) {
    const parts = line.trim().split("|");
    if (parts.length < 6) continue;
    const date = parts[1].trim();
    if (!parseIsoDate(date)) continue;
    const emi = parseFloat(parts[2].replace(/,/g, ""));
    const principal = parseFloat(parts[3].replace(/,/g, ""));
    const interest = parseFloat(parts[4].replace(/,/g, ""));
    const balance = parseFloat(parts[5].replace(/,/g, ""));
    if (!Number.isFinite(emi) && !Number.isFinite(principal)) continue;

    rows.push({
      month: rows.length + 1,
      date,
      emi: Number.isFinite(emi) ? Math.max(0, Math.round(emi)) : 0,
      principal: Number.isFinite(principal) ? Math.max(0, Math.round(principal)) : 0,
      interest: Number.isFinite(interest) ? Math.max(0, Math.round(interest)) : 0,
      balance: Number.isFinite(balance) ? Math.max(0, Math.round(balance)) : 0,
    });
  }

  return rows;
}

function getRemainingBalanceFromRawText(raw: string, today: Date): number | null {
  let latestDate: Date | null = null;
  let latestBalance: number | null = null;

  for (const line of raw.split("\n")) {
    const parts = line.trim().split("|");
    if (parts.length < 6) continue;
    const date = parseIsoDate(parts[1].trim());
    const balance = parseFloat(parts[5].replace(/,/g, ""));
    if (!date || !Number.isFinite(balance) || balance < 0) continue;
    if (date.getTime() > today.getTime()) continue;
    if (!latestDate || date.getTime() >= latestDate.getTime()) {
      latestDate = date;
      latestBalance = Math.round(balance);
    }
  }

  return latestBalance;
}

/**
 * Normalize a raw Gemini-parsed schedule payload into the canonical
 * {@link ScheduleData} shape: cleans rows, sorts by date, derives the
 * regular EMI, fills in remaining balance / EMIs paid, etc.
 *
 * @param parsed - Raw payload as returned by the Gemini model.
 * @returns A normalized, ready-to-persist {@link ScheduleData}.
 */
export function normalizeScheduleData(parsed: ScheduleData): ScheduleData {
  const today = startOfToday();
  const schedule = normalizeScheduleRows(parsed.schedule);
  const prepayments = normalizePrepayments(parsed.prepayments);

  const rawText = typeof parsed.rawScheduleText === "string" ? parsed.rawScheduleText.trim() : "";

  const effectiveSchedule = schedule.length === 0 && rawText
    ? normalizeScheduleRows(parseRawScheduleToRows(rawText))
    : schedule;
  const effectiveFirstRow = effectiveSchedule[0];
  const effectiveLatestDueRow = getMostRecentScheduleRow(effectiveSchedule, today);
  const effectiveFirstRowDate = effectiveFirstRow ? parseIsoDate(effectiveFirstRow.date) : null;
  const principalFromParsedSchedule = effectiveFirstRow ? roundMoney(effectiveFirstRow.principal + effectiveFirstRow.balance) : 0;

  const balanceFromRawText = (effectiveSchedule.length === 0 && rawText)
    ? getRemainingBalanceFromRawText(rawText, today)
    : null;

  const normalized: ScheduleData = {
    loanName: parsed.loanName?.trim() || "Imported Loan",
    loanProvider: parsed.loanProvider?.trim() || null,
    loanAccountNumber: parsed.loanAccountNumber?.trim() || null,
    scheduleGeneratedOn: parsed.scheduleGeneratedOn?.trim() || null,
    rawScheduleText: rawText || undefined,
    principal: principalFromParsedSchedule || Math.max(0, roundMoney(parsed.principal || 0)),
    interestRate: Math.max(0, parsed.interestRate || 0),
    tenureMonths: effectiveSchedule.length || Math.max(0, Math.trunc(parsed.tenureMonths || 0)),
    emiAmount: effectiveSchedule.length > 0
      ? getRegularEmiAmount(effectiveSchedule)
      : Math.max(0, roundMoney(parsed.emiAmount || 0)),
    startDate: effectiveFirstRowDate ? effectiveFirstRow.date : (parsed.startDate || ""),
    remainingBalance: effectiveLatestDueRow
      ? effectiveLatestDueRow.balance
      : balanceFromRawText ?? Math.max(0, roundMoney(parsed.remainingBalance || 0)),
    totalScheduleRows: effectiveSchedule.length,
    prepayments,
    schedule: effectiveSchedule,
    emisPaid: effectiveLatestDueRow ? effectiveSchedule.findIndex((row) => row.month === effectiveLatestDueRow.month) + 1 : parsed.emisPaid,
    confidence: clamp(Math.round(parsed.confidence || 0), 1, 100),
  };

  if (effectiveSchedule.length === 0 && normalized.startDate) {
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
