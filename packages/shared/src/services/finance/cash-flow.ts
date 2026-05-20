import type { TransactionData, CashFlowResult, MonthlyTrend } from '../../types';

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

function formatMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Calculate monthly cash flow for a given month.
 *
 * @param transactions - Array of transaction data.
 * @param month - Target month in YYYY-MM format. Defaults to current month.
 * @returns Cash flow breakdown for the month.
 */
export function calculateMonthlyCashFlow(
  transactions: TransactionData[],
  month?: string,
): CashFlowResult {
  const target = month ?? formatMonth(new Date());

  const filtered = transactions.filter((t) => {
    const d = toDate(t.date);
    return formatMonth(d) === target;
  });

  let income = 0;
  let expenses = 0;

  for (const t of filtered) {
    if (t.type === 'INCOME') {
      income += t.amount;
    } else {
      expenses += t.amount;
    }
  }

  return { income, expenses, netCashFlow: income - expenses, month: target };
}

/**
 * Calculate monthly trends over a range of transactions.
 *
 * @param transactions - Array of transaction data.
 * @param months - Number of months to look back. Defaults to 6.
 * @returns Array of monthly trend data.
 */
export function calculateMonthlyTrends(
  transactions: TransactionData[],
  months = 6,
): MonthlyTrend[] {
  const trends: MonthlyTrend[] = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = formatMonth(d);
    const result = calculateMonthlyCashFlow(transactions, month);
    trends.push({ month, income: result.income, expenses: result.expenses, netCashFlow: result.netCashFlow });
  }

  return trends;
}
