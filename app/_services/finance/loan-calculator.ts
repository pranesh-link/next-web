import type { LoanData, LoanInsight, PrepaymentSimulation } from './types';

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
