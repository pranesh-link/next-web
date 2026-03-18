import type { TransactionData, CashFlowResult, MonthlyTrend } from './types';

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

function formatMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

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

  return {
    income,
    expenses,
    netCashFlow: income - expenses,
    month: target,
  };
}

export function calculateMonthlyTrends(
  transactions: TransactionData[],
  months: number = 6,
): MonthlyTrend[] {
  if (transactions.length === 0) {
    return [];
  }

  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);

  const grouped = new Map<string, { income: number; expenses: number }>();

  for (const t of transactions) {
    const d = toDate(t.date);
    if (d < cutoff) continue;

    const key = formatMonth(d);
    const entry = grouped.get(key) ?? { income: 0, expenses: 0 };

    if (t.type === 'INCOME') {
      entry.income += t.amount;
    } else {
      entry.expenses += t.amount;
    }

    grouped.set(key, entry);
  }

  const trends: MonthlyTrend[] = [];

  for (const [month, { income, expenses }] of grouped) {
    trends.push({
      month,
      income,
      expenses,
      savings: income - expenses,
    });
  }

  trends.sort((a, b) => a.month.localeCompare(b.month));

  return trends;
}
