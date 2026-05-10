/** Region for loan-tip selection. */
export type TipRegion = "in" | "global";

/** A single row in the parsed amortization schedule. */
export type ScheduleRow = {
  month: number;
  date: string;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
};

/** A part-prepayment record extracted from the schedule. */
export type Prepayment = {
  date: string;
  amount: number;
  balanceAfter?: number;
  source?: "scanned";
};

/** Result returned by the schedule scan server action. */
export type ScannedLoanData = {
  loanName?: string;
  loanProvider?: string | null;
  loanAccountNumber?: string | null;
  scheduleGeneratedOn?: string | null;
  principal?: number;
  interestRate?: number;
  tenureMonths?: number;
  emiAmount?: number;
  startDate?: string | null;
  remainingBalance?: number;
  schedule?: ScheduleRow[];
  totalScheduleRows?: number;
  prepayments?: Prepayment[];
  emisPaid?: number;
  confidence?: number;
  /** Transport-only: raw table text for Phase 2 chunked extraction. */
  rawScheduleText?: string;
  error?: string;
};
