export { formatActionError } from "./_shared";

/**
 * Frequency at which a recurring-deposit installment is due.
 */
export type InstallmentFrequency = "MONTHLY" | "QUARTERLY" | "HALF_YEARLY" | "YEARLY";

const FREQUENCY_MONTHS: Record<InstallmentFrequency, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  YEARLY: 12,
};

/**
 * Format a {@link Date} as `YYYY-MM`.
 *
 * @param date - The date to format.
 * @returns The month key in `YYYY-MM` form.
 */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Coerce a string-or-Date into a {@link Date}.
 *
 * @param value - A `Date` instance or a string parseable by `new Date(...)`.
 * @returns The resulting `Date`.
 */
export function parseDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Strip the time component from a date so comparisons are day-aligned.
 *
 * @param date - The source date.
 * @returns A new `Date` at 00:00 local time on the same day.
 */
export function toStartOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getFrequencyMonths(frequency: InstallmentFrequency | null | undefined): number {
  return FREQUENCY_MONTHS[frequency ?? "MONTHLY"];
}

function addMonthsWithDayClamp(baseDate: Date, monthsToAdd: number, targetDayOfMonth: number): Date {
  const source = parseDate(baseDate);
  const targetYear = source.getFullYear();
  const targetMonth = source.getMonth() + monthsToAdd;
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(targetDayOfMonth, lastDayOfTargetMonth);
  return new Date(targetYear, targetMonth, day);
}

function getScheduledInstallmentDate(
  startDate: Date,
  installmentNumber: number,
  frequency: InstallmentFrequency,
): Date {
  const normalizedStartDate = toStartOfDay(parseDate(startDate));
  const monthsToAdd = (installmentNumber - 1) * getFrequencyMonths(frequency);
  return addMonthsWithDayClamp(normalizedStartDate, monthsToAdd, normalizedStartDate.getDate());
}

/**
 * Compute the next scheduled installment date on or after `asOfDate`.
 *
 * @param input - Schedule descriptor (start date, total installments, frequency, optional `asOfDate`).
 * @returns The next due date, or `null` when no further installments remain.
 */
export function getNextScheduledInstallmentDate(input: {
  startDate: Date;
  totalInstallments?: number | null;
  installmentFrequency?: InstallmentFrequency | null;
  asOfDate?: Date;
}): Date | null {
  const totalInstallments = input.totalInstallments ?? 0;
  if (totalInstallments <= 0) return null;

  const frequency = input.installmentFrequency ?? "MONTHLY";
  const asOfDate = toStartOfDay(input.asOfDate ?? new Date());

  for (let installmentNumber = 1; installmentNumber <= totalInstallments; installmentNumber += 1) {
    const dueDate = getScheduledInstallmentDate(input.startDate, installmentNumber, frequency);
    if (dueDate >= asOfDate) {
      return dueDate;
    }
  }
  return null;
}

/**
 * Count how many installments should have been paid on or before `asOfDate`.
 *
 * @param input - Schedule descriptor (start date, total installments, frequency, optional `asOfDate`).
 * @returns The expected number of paid installments, capped at `totalInstallments`.
 */
export function getExpectedInstallmentsTillDate(input: {
  startDate: Date;
  totalInstallments?: number | null;
  installmentFrequency?: InstallmentFrequency | null;
  asOfDate?: Date;
}): number {
  const totalInstallments = input.totalInstallments ?? 0;
  if (totalInstallments <= 0) return 0;

  const frequency = input.installmentFrequency ?? "MONTHLY";
  const asOfDate = toStartOfDay(input.asOfDate ?? new Date());

  let expected = 0;
  for (let installmentNumber = 1; installmentNumber <= totalInstallments; installmentNumber += 1) {
    const dueDate = getScheduledInstallmentDate(input.startDate, installmentNumber, frequency);
    if (dueDate <= asOfDate) {
      expected = installmentNumber;
      continue;
    }
    break;
  }
  return Math.min(expected, totalInstallments);
}

/**
 * Compute the maturity amount for a deposit instrument.
 *
 * For RDs the value is the future value of an annuity-due using the supplied
 * monthly installment, total installments, and interest rate. For FDs the
 * value is the principal compounded monthly across the tenure.
 *
 * @param input - Deposit parameters (type, principal, rate, tenure, optional installment fields).
 * @returns The maturity amount rounded to two decimals.
 */
export function calculateMaturityAmount(input: {
  type: "RECURRING_DEPOSIT" | "FIXED_DEPOSIT";
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  installmentAmount?: number;
  totalInstallments?: number;
}) {
  const monthlyRate = input.interestRate / 1200;

  if (input.type === "RECURRING_DEPOSIT") {
    const installment = input.installmentAmount ?? 0;
    const installments = input.totalInstallments ?? input.tenureMonths;

    if (installment <= 0 || installments <= 0) {
      return Number(input.principalAmount.toFixed(2));
    }
    if (monthlyRate === 0) {
      return Number((installment * installments).toFixed(2));
    }
    const fv = installment * ((Math.pow(1 + monthlyRate, installments) - 1) / monthlyRate) * (1 + monthlyRate);
    return Number(fv.toFixed(2));
  }

  const fv = input.principalAmount * Math.pow(1 + monthlyRate, input.tenureMonths);
  return Number(fv.toFixed(2));
}
