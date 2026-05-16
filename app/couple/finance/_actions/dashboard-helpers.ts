import type { Loan } from "@prisma/client";

/** Account balance grouped by account type. */
export interface AccountBreakdownItem {
  type: string;
  count: number;
  total: number;
}

/** Top loan with next due date info. */
export interface LoanDetail {
  id: string;
  name: string;
  remainingBalance: number;
  emiAmount: number;
  interestRate: number;
  nextDueDate: string | null;
}

/** Monthly budget rollup. */
export interface BudgetRollup {
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  adherencePercent: number;
  overBudgetCount: number;
}

/** Dashboard alert with severity level. */
export interface DashboardAlert {
  type: string;
  severity: "warning" | "danger" | "info";
  message: string;
}

/**
 * Group account balances by type.
 *
 * @param accounts - Financial accounts.
 * @returns Breakdown by account type.
 */
export function computeAccountBreakdown(
  accounts: { type: string; balance: number }[],
): AccountBreakdownItem[] {
  const map: Record<string, AccountBreakdownItem> = {};
  for (const a of accounts) {
    if (!map[a.type]) map[a.type] = { type: a.type, count: 0, total: 0 };
    map[a.type].count++;
    map[a.type].total += a.balance;
  }
  return Object.values(map);
}

/**
 * Find next schedule entry date for a loan.
 *
 * @param loan - Loan with optional schedule JSON.
 * @returns ISO date string or null.
 */
function getNextScheduleDate(loan: Loan): string | null {
  const schedule = Array.isArray(loan.schedule)
    ? (loan.schedule as { date: string }[])
    : null;
  if (!schedule) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = schedule.find((e) => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() >= today.getTime();
  });
  return next?.date ?? null;
}

/**
 * Get the next EMI amount from a loan schedule.
 *
 * @param loan - Loan with optional schedule JSON.
 * @returns The next EMI amount, falling back to loan.emiAmount.
 */
export function getNextEmiAmount(loan: Loan): number {
  const schedule = Array.isArray(loan.schedule)
    ? (loan.schedule as { date: string; emi: number }[])
    : null;
  if (!schedule || schedule.length === 0) return loan.emiAmount;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = schedule.find((e) => {
    const d = new Date(e.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() >= today.getTime();
  });
  return next ? next.emi : loan.emiAmount;
}

/**
 * Get top loans by remaining balance with next due dates.
 *
 * @param loans - Active loans.
 * @param limit - Max loans to return.
 * @returns Loan details sorted by remaining balance descending.
 */
export function computeLoanDetails(loans: Loan[], limit = 3): LoanDetail[] {
  return [...loans]
    .sort((a, b) => b.remainingBalance - a.remainingBalance)
    .slice(0, limit)
    .map((l) => ({
      id: l.id,
      name: l.name,
      remainingBalance: l.remainingBalance,
      emiAmount: l.emiAmount,
      interestRate: l.interestRate,
      nextDueDate: getNextScheduleDate(l),
    }));
}

/**
 * Check if any loan EMI is due within a threshold.
 *
 * @param loans - Active loans.
 * @param withinDays - Days threshold.
 * @returns True if any EMI is due soon.
 */
export function hasEmiDueSoon(loans: Loan[], withinDays = 7): boolean {
  return loans.some((l) => {
    const nextDate = getNextScheduleDate(l);
    if (!nextDate) return false;
    const daysUntil = (new Date(nextDate).getTime() - Date.now()) / 86_400_000;
    return daysUntil >= 0 && daysUntil <= withinDays;
  });
}

/**
 * Compute budget rollup for the current month.
 *
 * @param totalBudgeted - Sum of budget limits.
 * @param totalSpent - Sum of actual spending.
 * @param overBudgetCount - Budgets exceeded.
 * @returns Rollup summary.
 */
export function computeBudgetRollup(
  totalBudgeted: number,
  totalSpent: number,
  overBudgetCount: number,
): BudgetRollup {
  return {
    totalBudgeted,
    totalSpent,
    remaining: totalBudgeted - totalSpent,
    adherencePercent:
      totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0,
    overBudgetCount,
  };
}

interface GoalBase {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date | string | null;
  progress: { percentage: number };
}

/** Goal extended with timeline and risk data. */
export interface GoalWithTimeline extends GoalBase {
  monthsLeft: number | null;
  monthlySavingsNeeded: number | null;
  isAtRisk: boolean;
}

/**
 * Add timeline and risk data to goals.
 *
 * @param goals - Goals with progress.
 * @param monthlyIncome - Monthly income for risk threshold.
 * @returns Goals with timeline and risk flags.
 */
export function computeGoalsTimeline(
  goals: GoalBase[],
  monthlyIncome: number,
): GoalWithTimeline[] {
  return goals.map((g) => {
    const remaining = g.targetAmount - g.currentAmount;
    let monthsLeft: number | null = null;
    let monthlySavingsNeeded: number | null = null;
    let isAtRisk = false;

    if (g.deadline) {
      const dl = new Date(g.deadline);
      const now = new Date();
      monthsLeft = Math.max(
        0,
        (dl.getFullYear() - now.getFullYear()) * 12 +
          dl.getMonth() -
          now.getMonth(),
      );
      monthlySavingsNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
      isAtRisk =
        remaining > 0 &&
        (monthsLeft <= 0 || monthlySavingsNeeded > monthlyIncome * 0.5);
    }

    return { ...g, monthsLeft, monthlySavingsNeeded, isAtRisk };
  });
}

interface AlertParams {
  totalBudgetLimit: number;
  totalBudgetSpent: number;
  emergencyFundMonths: number;
  hasExpenses: boolean;
  debtToIncomeRatio: number;
  atRiskGoalCount: number;
  emiDueSoon: boolean;
}

/**
 * Generate dashboard alerts from financial health indicators.
 *
 * @param params - Metrics to evaluate.
 * @returns Alerts sorted by severity (danger first).
 */
export function computeAlerts(params: AlertParams): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const {
    totalBudgetLimit,
    totalBudgetSpent,
    emergencyFundMonths,
    hasExpenses,
    debtToIncomeRatio,
    atRiskGoalCount,
    emiDueSoon,
  } = params;

  if (totalBudgetSpent > totalBudgetLimit && totalBudgetLimit > 0) {
    const over = totalBudgetSpent - totalBudgetLimit;
    alerts.push({
      type: "budget",
      severity: "danger",
      message: `Over budget by ₹${over.toLocaleString("en-IN")}`,
    });
  } else if (
    totalBudgetSpent >= totalBudgetLimit * 0.8 &&
    totalBudgetLimit > 0
  ) {
    const pct = Math.round((totalBudgetSpent / totalBudgetLimit) * 100);
    alerts.push({
      type: "budget",
      severity: "warning",
      message: `${pct}% of monthly budget used`,
    });
  }

  if (debtToIncomeRatio > 40) {
    alerts.push({
      type: "debt",
      severity: "danger",
      message: `Debt-to-income: ${debtToIncomeRatio.toFixed(0)}% (target < 40%)`,
    });
  }

  if (atRiskGoalCount > 0) {
    alerts.push({
      type: "goals",
      severity: "warning",
      message: `${atRiskGoalCount} goal${atRiskGoalCount > 1 ? "s" : ""} at risk of missing deadline`,
    });
  }

  if (emergencyFundMonths < 3 && hasExpenses) {
    alerts.push({
      type: "emergency",
      severity: "warning",
      message: `Emergency fund: ${emergencyFundMonths.toFixed(1)} months (aim for 6+)`,
    });
  }

  if (emiDueSoon) {
    alerts.push({
      type: "loan",
      severity: "info",
      message: "EMI payment due within 7 days",
    });
  }

  return alerts;
}
