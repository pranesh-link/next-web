import type { Loan } from "../_utils";

export type LoanDerived = {
  emisPaid: number;
  repaidPct: number;
  nextEmi: Date;
  isUrgent: boolean;
  loanCompleted: boolean;
  endDateStr: string;
  emiLabel: string;
  nextEmiAmount: number;
  isVarying: boolean;
  hasManualPrepayment: boolean;
};

export function computeLoanDerived(loan: Loan): LoanDerived {
  const start = new Date(loan.startDate);
  const now = new Date();
  const monthsElapsed = Math.max(
    0,
    (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth()),
  );
  const emiDayPassed = now.getDate() >= start.getDate();
  const emisPaid = Math.min(
    monthsElapsed + (emiDayPassed ? 1 : 0),
    loan.tenureMonths,
  );

  const repaidPct =
    loan.principal > 0
      ? Math.round(
          ((loan.principal - loan.remainingBalance) / loan.principal) * 100,
        )
      : 0;

  const nextEmiOffset = emiDayPassed ? monthsElapsed + 1 : monthsElapsed;
  const nextEmi = new Date(start);
  nextEmi.setMonth(nextEmi.getMonth() + nextEmiOffset);
  const daysUntilNextEmi = Math.ceil(
    (nextEmi.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const isUrgent = daysUntilNextEmi <= 7 && daysUntilNextEmi >= 0;
  const loanCompleted = emisPaid >= loan.tenureMonths;

  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + loan.tenureMonths - 1);
  const endDateStr = endDate.toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  const schedule = loan.schedule;
  let emiLabel = "EMI";
  let nextEmiAmount = loan.emiAmount;
  let isVarying = false;
  if (schedule && schedule.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextEntry = schedule.find((e) => {
      const d = new Date(e.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    });
    nextEmiAmount = nextEntry ? nextEntry.emi : loan.emiAmount;

    if (schedule.length >= 2) {
      const rows = schedule.length > 2 ? schedule.slice(0, -1) : schedule;
      const firstEmi = rows[0].emi;
      isVarying = rows.some((r) => Math.abs(r.emi - firstEmi) > 1);
      if (isVarying) emiLabel = "Next EMI";
    }
  }

  const pp = Array.isArray(loan.prepayments) ? loan.prepayments : [];
  const hasManualPrepayment = pp.some((p) => p.source === "manual");

  return {
    emisPaid,
    repaidPct,
    nextEmi,
    isUrgent,
    loanCompleted,
    endDateStr,
    emiLabel,
    nextEmiAmount,
    isVarying,
    hasManualPrepayment,
  };
}
