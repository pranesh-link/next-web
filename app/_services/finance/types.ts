export interface TransactionData {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  date: Date | string;
  description?: string;
}

export interface AccountData {
  id: string;
  name: string;
  type: 'BANK' | 'CASH' | 'CREDIT_CARD';
  balance: number;
}

export interface BudgetData {
  id: string;
  category: string;
  limit: number;
  month: string;
  spent?: number;
}

export interface LoanData {
  id: string;
  name: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: Date | string;
  remainingBalance: number;
}

export interface GoalData {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date | string;
}

export interface CashFlowResult {
  income: number;
  expenses: number;
  netCashFlow: number;
  month: string;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface HealthScoreFactor {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

export interface HealthScoreResult {
  score: number;
  factors: HealthScoreFactor[];
}

export interface LoanInsight {
  totalInterestPayable: number;
  monthsRemaining: number;
  earlyPayoffSavings?: number;
  prepaymentAmount?: number;
}

export interface PrepaymentSimulation {
  originalInterest: number;
  newInterest: number;
  interestSaved: number;
  newTenure: number;
  originalTenure: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}
