import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { TransactionData } from '@next-web/shared/types';

/** Fetch transactions. */
export function useTransactions() {
  return useQuery({
    queryKey: ['finance', 'transactions'],
    queryFn: () => api<TransactionData[]>('/api/v1/finance/transactions'),
  });
}
