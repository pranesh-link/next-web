/**
 * Calculate the equated monthly instalment (EMI) for a loan.
 *
 * @param principal - Principal amount in INR.
 * @param annualRate - Annual interest rate as a percentage (e.g. `8.5`).
 * @param tenureMonths - Total tenure in months.
 * @returns EMI rounded to two decimals; `0` when inputs are non-positive.
 */
export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate === 0) return principal / tenureMonths;
  const monthlyRate = annualRate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

export { formatCurrency } from "@/_lib/formatters";
