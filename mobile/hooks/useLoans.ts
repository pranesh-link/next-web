import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { LoanData } from '@next-web/shared/types';

/** Fetch loans. */
export function useLoans() {
  return useQuery({
    queryKey: ['finance', 'loans'],
    queryFn: () => api<LoanData[]>('/api/v1/finance/loans'),
  });
}
