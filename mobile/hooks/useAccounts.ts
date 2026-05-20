import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { AccountData } from '@next-web/shared/types';

/** Fetch all financial accounts. */
export function useAccounts() {
  return useQuery({
    queryKey: ['finance', 'accounts'],
    queryFn: () => api<AccountData[]>('/api/v1/finance/accounts'),
  });
}
