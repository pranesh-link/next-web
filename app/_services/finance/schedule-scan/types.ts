/**
 * Shared types for the loan-schedule scanning pipeline.
 */

/**
 * A single prepayment / part-payment row extracted from a loan schedule.
 */
export type PrepaymentEntry = {
  date: string;
  amount: number;
  balanceAfter?: number;
};

/**
 * A single regular EMI row from an amortization schedule.
 */
export type ScheduleRow = {
  month: number;
  date: string;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
};

/**
 * Normalized loan-schedule payload returned by the scanner.
 */
export type ScheduleData = {
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
  rawScheduleText?: string;
  emisPaid?: number;
  confidence: number;
};

/**
 * Discriminated result envelope returned by {@link scanSchedule}.
 */
export type ScheduleScanResult =
  | { ok: true; status: number; body: { success: true; data: ScheduleData; method: string; model?: string } }
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; error: string; geminiError?: string };
