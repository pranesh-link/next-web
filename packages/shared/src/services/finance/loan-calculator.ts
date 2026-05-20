import type { LoanData, LoanInsight, PrepaymentSimulation, AmortizationEntry, ClosureScenario } from '../../types';

/**
 * Calculate EMI for a loan.
 *
 * @param principal - Loan principal amount.
 * @param annualRate - Annual interest rate (percentage).
 * @param tenureMonths - Loan tenure in months.
 * @returns Monthly EMI amount.
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate === 0) return principal / tenureMonths;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Calculate total interest paid over loan lifetime.
 *
 * @param emiAmount - Monthly EMI.
 * @param tenureMonths - Total tenure in months.
 * @param principal - Original principal amount.
 * @returns Total interest amount.
 */
export function calculateTotalInterest(emiAmount: number, tenureMonths: number, principal: number): number {
  if (emiAmount <= 0 || tenureMonths <= 0) return 0;
  return emiAmount * tenureMonths - principal;
}

/**
 * Calculate remaining interest to be paid.
 *
 * @param emiAmount - Monthly EMI.
 * @param remainingMonths - Remaining months.
 * @param remainingBalance - Current outstanding balance.
 * @returns Remaining interest amount.
 */
export function calculateRemainingInterest(emiAmount: number, remainingMonths: number, remainingBalance: number): number {
  if (emiAmount <= 0 || remainingMonths <= 0) return 0;
  return emiAmount * remainingMonths - remainingBalance;
}

function calculateTenureForBalance(balance: number, emi: number, annualRate: number): number {
  if (balance <= 0 || emi <= 0) return 0;
  if (annualRate === 0) return Math.ceil(balance / emi);
  const monthlyRate = annualRate / 12 / 100;
  if (emi <= balance * monthlyRate) return Infinity;
  return Math.ceil(Math.log(emi / (emi - balance * monthlyRate)) / Math.log(1 + monthlyRate));
}

/**
 * Simulate prepayment impact on loan.
 *
 * @param loan - Current loan data.
 * @param extraPayment - Additional payment amount.
 * @returns Simulation results showing savings.
 */
export function simulatePrepayment(loan: LoanData, extraPayment: number): PrepaymentSimulation {
  const { remainingBalance, interestRate, emiAmount } = loan;
  const currentRemaining = calculateTenureForBalance(remainingBalance, emiAmount, interestRate);
  const newBalance = Math.max(0, remainingBalance - extraPayment);
  const newTenureMonths = calculateTenureForBalance(newBalance, emiAmount, interestRate);
  const currentInterest = calculateRemainingInterest(emiAmount, currentRemaining, remainingBalance);
  const newInterest = calculateRemainingInterest(emiAmount, newTenureMonths, newBalance);
  const interestSaved = Math.max(0, currentInterest - newInterest);

  return { extraPayment, newTenureMonths, interestSaved, totalSavings: interestSaved + extraPayment - extraPayment };
}

/**
 * Get insights for a loan.
 *
 * @param loan - Loan data to analyze.
 * @returns Array of loan insights.
 */
export function getLoanInsights(loan: LoanData): LoanInsight[] {
  const insights: LoanInsight[] = [];
  const totalInterest = calculateTotalInterest(loan.emiAmount, loan.tenureMonths, loan.principal);
  const interestPercentage = (totalInterest / loan.principal) * 100;

  insights.push({
    label: 'Total Interest',
    value: `${interestPercentage.toFixed(1)}% of principal`,
    type: interestPercentage > 50 ? 'warning' : 'info',
  });

  if (loan.remainingBalance < loan.principal * 0.2) {
    insights.push({ label: 'Almost Done', value: 'Less than 20% balance remaining', type: 'success' });
  }

  return insights;
}

/**
 * Generate amortization schedule for a loan.
 *
 * @param principal - Loan principal.
 * @param annualRate - Annual interest rate.
 * @param tenureMonths - Tenure in months.
 * @param startDate - Loan start date.
 * @returns Array of amortization entries.
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startDate: Date | string,
): AmortizationEntry[] {
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyRate = annualRate / 12 / 100;
  const schedule: AmortizationEntry[] = [];
  let balance = principal;
  const start = startDate instanceof Date ? startDate : new Date(startDate);

  for (let i = 1; i <= tenureMonths && balance > 0; i++) {
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(emi - interest, balance);
    balance = Math.max(0, balance - principalPaid);
    const date = new Date(start.getFullYear(), start.getMonth() + i, 1);

    schedule.push({
      month: i,
      date: date.toISOString().slice(0, 10),
      emi: Math.round(emi * 100) / 100,
      principal: Math.round(principalPaid * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Get early closure scenarios for a loan.
 *
 * @param loan - Loan data.
 * @returns Array of closure scenario options.
 */
export function getEarlyClosureScenarios(loan: LoanData): ClosureScenario[] {
  const scenarios: ClosureScenario[] = [];
  const currentRemaining = calculateTenureForBalance(loan.remainingBalance, loan.emiAmount, loan.interestRate);
  const currentInterest = calculateRemainingInterest(loan.emiAmount, currentRemaining, loan.remainingBalance);

  const amounts = [loan.remainingBalance * 0.25, loan.remainingBalance * 0.5, loan.remainingBalance];

  const labels = ['25% prepayment', '50% prepayment', 'Full closure'];

  for (let i = 0; i < amounts.length; i++) {
    const amount = amounts[i];
    const newBalance = Math.max(0, loan.remainingBalance - amount);
    const newTenure = calculateTenureForBalance(newBalance, loan.emiAmount, loan.interestRate);
    const newInterest = calculateRemainingInterest(loan.emiAmount, newTenure, newBalance);

    scenarios.push({
      label: labels[i],
      amount: Math.round(amount),
      interestSaved: Math.round(Math.max(0, currentInterest - newInterest)),
      monthsSaved: Math.max(0, currentRemaining - newTenure),
    });
  }

  return scenarios;
}
