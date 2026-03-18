import type { TransactionData, ExpenseBreakdown } from './types';

export function calculateExpenseBreakdown(
  transactions: TransactionData[],
): ExpenseBreakdown[] {
  const expenses = transactions.filter((t) => t.type === 'EXPENSE');

  if (expenses.length === 0) return [];

  const categoryTotals = new Map<string, number>();

  for (const t of expenses) {
    categoryTotals.set(t.category, (categoryTotals.get(t.category) ?? 0) + t.amount);
  }

  const totalExpenses = Array.from(categoryTotals.values()).reduce(
    (sum, val) => sum + val,
    0,
  );

  if (totalExpenses === 0) return [];

  const breakdown: ExpenseBreakdown[] = [];

  for (const [category, amount] of categoryTotals) {
    breakdown.push({
      category,
      amount,
      percentage: (amount / totalExpenses) * 100,
    });
  }

  breakdown.sort((a, b) => b.amount - a.amount);

  return breakdown;
}
