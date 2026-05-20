import type { TransactionData, ExpenseBreakdown } from '../../types';

/**
 * Calculate expense breakdown by category.
 *
 * @param transactions - Array of expense transactions.
 * @returns Array of category breakdowns with percentages.
 */
export function calculateExpenseBreakdown(transactions: TransactionData[]): ExpenseBreakdown[] {
  const expenses = transactions.filter((t) => t.type === 'EXPENSE');
  const total = expenses.reduce((sum, t) => sum + t.amount, 0);

  if (total === 0) return [];

  const byCategory = new Map<string, number>();

  for (const t of expenses) {
    const current = byCategory.get(t.category) ?? 0;
    byCategory.set(t.category, current + t.amount);
  }

  return Array.from(byCategory.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount);
}
