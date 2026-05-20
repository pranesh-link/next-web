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
  type: 'SAVINGS_ACCOUNT' | 'CREDIT_ACCOUNT' | 'CREDIT_CARD' | 'RECURRING_DEPOSIT' | 'FIXED_DEPOSIT';
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
  prepayments?: { date: string; amount: number; balanceAfter?: number }[];
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
  overallScore: number;
  factors: HealthScoreFactor[];
  rating: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface LoanInsight {
  label: string;
  value: string;
  type: 'info' | 'warning' | 'success';
}

export interface PrepaymentSimulation {
  extraPayment: number;
  newTenureMonths: number;
  interestSaved: number;
  totalSavings: number;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  netCashFlow: number;
}

export interface AmortizationEntry {
  month: number;
  date: string;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface ClosureScenario {
  label: string;
  amount: number;
  interestSaved: number;
  monthsSaved: number;
}

export type BmiCategory = 'underweight' | 'healthy' | 'overweight' | 'obese';

export interface BMIFormData {
  heightInCm: string | number;
  weightInKg: string | number;
}

export type AccountType = 'SAVINGS_ACCOUNT' | 'CREDIT_ACCOUNT' | 'CREDIT_CARD' | 'RECURRING_DEPOSIT' | 'FIXED_DEPOSIT';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type AssetType = 'GOLD' | 'SILVER' | 'STOCK' | 'MUTUAL_FUND';
export type InvestmentMode = 'LUMPSUM' | 'SIP';
export type DepositType = 'RECURRING_DEPOSIT' | 'FIXED_DEPOSIT';
export type BudgetPlanMode = 'monthly' | 'yearly';
