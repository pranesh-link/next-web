import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { GoalData } from '@next-web/shared/types';

/** Fetch savings goals. */
export function useGoals() {
  return useQuery({
    queryKey: ['finance', 'goals'],
    queryFn: () => api<GoalData[]>('/api/v1/finance/goals'),
  });
}
