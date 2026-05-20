import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { CashFlowResult, HealthScoreResult } from '@next-web/shared/types';

interface DashboardData {
  cashFlow: CashFlowResult;
  healthScore: HealthScoreResult;
}

/** Fetch finance dashboard data. */
export function useFinanceDashboard() {
  return useQuery({
    queryKey: ['finance', 'dashboard'],
    queryFn: () => api<DashboardData>('/api/v1/finance/insights'),
  });
}
