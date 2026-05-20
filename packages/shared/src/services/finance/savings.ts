import type { GoalData } from '../../types';

/**
 * Calculate savings rate as a percentage.
 *
 * @param income - Total income.
 * @param expenses - Total expenses.
 * @returns Savings rate percentage.
 */
export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  return ((income - expenses) / income) * 100;
}

/**
 * Calculate progress towards a savings goal.
 *
 * @param goal - Goal data object.
 * @returns Progress info including percentage, remaining amount, and on-track status.
 */
export function calculateGoalProgress(goal: GoalData): {
  percentage: number;
  remaining: number;
  onTrack: boolean;
  monthsToGoal?: number;
} {
  const { targetAmount, currentAmount, deadline } = goal;

  if (targetAmount <= 0) {
    return { percentage: 100, remaining: 0, onTrack: true };
  }

  const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
  const remaining = Math.max(targetAmount - currentAmount, 0);

  if (!deadline) {
    return { percentage, remaining, onTrack: remaining === 0 };
  }

  const deadlineDate = deadline instanceof Date ? deadline : new Date(deadline);
  const now = new Date();

  const monthsLeft =
    (deadlineDate.getFullYear() - now.getFullYear()) * 12 +
    (deadlineDate.getMonth() - now.getMonth());

  if (remaining === 0) {
    return { percentage, remaining, onTrack: true, monthsToGoal: 0 };
  }

  if (monthsLeft <= 0) {
    return { percentage, remaining, onTrack: false, monthsToGoal: 0 };
  }

  const monthlySavingsNeeded = remaining / monthsLeft;
  const avgMonthlySaved = currentAmount > 0
    ? currentAmount / Math.max(1, Math.abs(monthsLeft) || 1)
    : 0;

  const onTrack = avgMonthlySaved >= monthlySavingsNeeded || remaining === 0;

  return { percentage, remaining, onTrack, monthsToGoal: monthsLeft };
}
