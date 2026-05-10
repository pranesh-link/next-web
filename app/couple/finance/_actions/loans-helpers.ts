import type { LoanData } from "@/_services/finance";

/**
 * Convert a Prisma `Loan` row into the {@link LoanData} shape consumed by the loan calculation services.
 *
 * @param loan - The persisted loan row, optionally including a `prepayments` JSON field.
 * @returns A {@link LoanData} object suitable for passing to the loan service helpers.
 */
export function toLoanData(loan: {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: Date;
  remainingBalance: number;
  prepayments?: unknown;
}): LoanData {
  return {
    id: loan.id,
    name: loan.name,
    principal: loan.principal,
    interestRate: loan.interestRate,
    tenureMonths: loan.tenureMonths,
    emiAmount: loan.emiAmount,
    startDate: loan.startDate,
    remainingBalance: loan.remainingBalance,
    ...(Array.isArray(loan.prepayments) ? { prepayments: loan.prepayments as LoanData["prepayments"] } : {}),
  };
}
