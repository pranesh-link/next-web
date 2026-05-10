export { EASING } from "@/couple/_constants/theme";

export type Prepayment = {
  date: string;
  amount: number;
  balanceAfter?: number;
  source?: "scanned" | "manual";
};

export type ScheduleEntry = {
  month: number;
  date: string;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
};

export type Loan = {
  id: string;
  name: string;
  loanProvider?: string | null;
  loanAccountNumber?: string | null;
  scheduleGeneratedOn?: string | null;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: string | Date;
  remainingBalance: number;
  prepayments?: Prepayment[] | null;
  schedule?: ScheduleEntry[] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type PrepaymentResult = {
  originalInterest: number;
  newInterest: number;
  interestSaved: number;
  newTenure: number;
  originalTenure: number;
};

export type ClosureScenario = {
  extraMonthlyAmount: number;
  newTotalEMI: number;
  monthsToClose: number;
  monthsSaved: number;
  closureDate: string;
  interestSaved: number;
};

export type InsightResult = {
  totalInterestPayable: number;
  monthsRemaining: number;
  earlyPayoffSavings?: number;
  prepaymentAmount?: number;
  scenarios?: ClosureScenario[];
};

export type Notification = {
  message: string;
  type: "success" | "error";
};

export { formatCurrency, formatDate } from "@/_lib/formatters";
