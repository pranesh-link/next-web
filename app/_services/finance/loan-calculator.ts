import type { LoanData, LoanInsight, PrepaymentSimulation, AmortizationEntry, ClosureScenario } from './types';

export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;

  if (annualRate === 0) {
    return principal / tenureMonths;
  }

  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export function calculateTotalInterest(
  emiAmount: number,
  tenureMonths: number,
  principal: number,
): number {
  if (emiAmount <= 0 || tenureMonths <= 0) return 0;
  return emiAmount * tenureMonths - principal;
}

export function calculateRemainingInterest(
  emiAmount: number,
  remainingMonths: number,
  remainingBalance: number,
): number {
  if (emiAmount <= 0 || remainingMonths <= 0) return 0;
  return emiAmount * remainingMonths - remainingBalance;
}

function calculateTenureForBalance(
  balance: number,
  emi: number,
  annualRate: number,
): number {
  if (balance <= 0 || emi <= 0) return 0;

  if (annualRate === 0) {
    return Math.ceil(balance / emi);
  }

  const monthlyRate = annualRate / 12 / 100;

  if (emi <= balance * monthlyRate) {
    return Infinity;
  }

  return Math.ceil(
    Math.log(emi / (emi - balance * monthlyRate)) / Math.log(1 + monthlyRate),
  );
}

export function simulatePrepayment(
  loan: LoanData,
  prepaymentAmount: number,
  reduceEMI: boolean = false,
): PrepaymentSimulation {
  const { principal, interestRate, tenureMonths, emiAmount, remainingBalance } = loan;

  const newBalance = Math.max(0, remainingBalance - prepaymentAmount);

  const currentRemainingMonths = calculateTenureForBalance(
    remainingBalance,
    emiAmount,
    interestRate,
  );

  const originalTotalInterest = calculateRemainingInterest(
    emiAmount,
    currentRemainingMonths,
    remainingBalance,
  );

  let newTenure: number;
  let newTotalInterest: number;

  if (newBalance === 0) {
    newTenure = 0;
    newTotalInterest = 0;
  } else if (reduceEMI) {
    const newEMI = calculateEMI(newBalance, interestRate, currentRemainingMonths);
    newTenure = currentRemainingMonths;
    newTotalInterest = calculateRemainingInterest(
      newEMI,
      currentRemainingMonths,
      newBalance,
    );
  } else {
    newTenure = calculateTenureForBalance(newBalance, emiAmount, interestRate);
    newTotalInterest = calculateRemainingInterest(emiAmount, newTenure, newBalance);
  }

  const originalFullInterest = calculateTotalInterest(emiAmount, tenureMonths, principal);

  return {
    originalInterest: originalFullInterest,
    newInterest: newTotalInterest,
    interestSaved: originalTotalInterest - newTotalInterest,
    newTenure,
    originalTenure: tenureMonths,
  };
}

export function getLoanInsights(loan: LoanData): LoanInsight {
  const { principal, interestRate, tenureMonths, emiAmount, remainingBalance } = loan;

  const totalInterestPayable = calculateTotalInterest(
    emiAmount,
    tenureMonths,
    principal,
  );

  const monthsRemaining = calculateTenureForBalance(
    remainingBalance,
    emiAmount,
    interestRate,
  );

  const prepaymentAmount = emiAmount;
  const simulation = simulatePrepayment(loan, prepaymentAmount);

  return {
    totalInterestPayable,
    monthsRemaining,
    prepaymentAmount,
    earlyPayoffSavings: simulation.interestSaved,
  };
}

export function generateAmortizationSchedule(
  loan: LoanData,
): AmortizationEntry[] {
  const { principal, interestRate, tenureMonths, emiAmount, startDate } = loan;
  const monthlyRate = interestRate / 12 / 100;
  const schedule: AmortizationEntry[] = [];

  let balance = principal;
  let totalPrincipalPaid = 0;
  let totalInterestPaid = 0;
  const start = new Date(startDate);

  for (let m = 1; m <= tenureMonths; m++) {
    const interestPortion = balance * monthlyRate;
    const principalPortion = Math.min(emiAmount - interestPortion, balance);
    balance = Math.max(0, balance - principalPortion);
    totalPrincipalPaid += principalPortion;
    totalInterestPaid += interestPortion;

    const date = new Date(start);
    date.setMonth(date.getMonth() + (m - 1));

    schedule.push({
      month: m,
      date: date.toISOString().split('T')[0],
      emi: m === tenureMonths ? principalPortion + interestPortion : emiAmount,
      principal: principalPortion,
      interest: interestPortion,
      balance,
      totalPrincipalPaid,
      totalInterestPaid,
    });

    if (balance <= 0) break;
  }

  return schedule;
}

export function getNextEmi(
  schedule: AmortizationEntry[],
  today: Date = new Date(),
): AmortizationEntry | null {
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  for (const entry of schedule) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    if (entryDate.getTime() >= todayStart.getTime()) return entry;
  }

  return null;
}

export function hasVaryingEmi(schedule: AmortizationEntry[]): boolean {
  if (schedule.length < 2) return false;

  // Exclude final row (often a smaller closing EMI)
  const rows = schedule.length > 2 ? schedule.slice(0, -1) : schedule;
  const firstEmi = rows[0].emi;

  return rows.some((row) => Math.abs(row.emi - firstEmi) > 1);
}

export function getEarlyClosureScenarios(
  loan: LoanData,
  extraAmounts: number[],
): ClosureScenario[] {
  const { emiAmount, remainingBalance, interestRate } = loan;

  const baseMonthsRemaining = calculateTenureForBalance(
    remainingBalance,
    emiAmount,
    interestRate,
  );

  const baseRemainingInterest = calculateRemainingInterest(
    emiAmount,
    baseMonthsRemaining,
    remainingBalance,
  );

  const today = new Date();

  return extraAmounts
    .map((extra) => {
      const newTotalEMI = emiAmount + extra;
      const monthsToClose = calculateTenureForBalance(
        remainingBalance,
        newTotalEMI,
        interestRate,
      );

      if (!Number.isFinite(monthsToClose) || monthsToClose <= 0) return null;

      const newRemainingInterest = calculateRemainingInterest(
        newTotalEMI,
        monthsToClose,
        remainingBalance,
      );

      const monthsSaved = Math.max(0, baseMonthsRemaining - monthsToClose);
      const interestSaved = Math.max(0, baseRemainingInterest - newRemainingInterest);

      const closureDate = new Date(today);
      closureDate.setMonth(closureDate.getMonth() + monthsToClose);
      const formattedDate = closureDate.toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      });

      return {
        extraMonthlyAmount: extra,
        newTotalEMI,
        monthsToClose,
        monthsSaved,
        closureDate: formattedDate,
        interestSaved,
      } satisfies ClosureScenario;
    })
    .filter((s): s is ClosureScenario => s !== null && s.monthsSaved > 0);
}
