export type {
  TransactionData,
  AccountData,
  BudgetData,
  LoanData,
  GoalData,
  CashFlowResult,
  ExpenseBreakdown,
  HealthScoreFactor,
  HealthScoreResult,
  LoanInsight,
  PrepaymentSimulation,
  MonthlyTrend,
  AmortizationEntry,
} from './types';

export { calculateMonthlyCashFlow, calculateMonthlyTrends } from './cash-flow';
export { calculateSavingsRate, calculateGoalProgress } from './savings';
export { calculateExpenseBreakdown } from './expense-breakdown';
export { calculateFinancialHealthScore } from './health-score';
export {
  calculateEMI,
  calculateTotalInterest,
  calculateRemainingInterest,
  simulatePrepayment,
  getLoanInsights,
  generateAmortizationSchedule,
} from './loan-calculator';
