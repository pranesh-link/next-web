import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { BudgetData } from '@next-web/shared/types';

/** Fetch budgets. */
export function useBudgets() {
  return useQuery({
    queryKey: ['finance', 'budgets'],
    queryFn: () => api<BudgetData[]>('/api/v1/finance/budgets'),
  });
}
