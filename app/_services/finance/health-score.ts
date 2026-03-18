import type { HealthScoreResult, HealthScoreFactor } from './types';

interface HealthScoreParams {
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyFundMonths: number;
  budgetAdherence: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreSavingsRate(rate: number): { score: number; detail: string } {
  const clamped = clamp(rate, 0, 100);

  if (clamped >= 25) {
    return { score: 100, detail: `Excellent savings rate of ${clamped.toFixed(1)}%` };
  }

  const score = (clamped / 25) * 100;

  if (clamped >= 15) {
    return { score, detail: `Good savings rate of ${clamped.toFixed(1)}%, aim for 25%+` };
  }

  if (clamped >= 5) {
    return { score, detail: `Low savings rate of ${clamped.toFixed(1)}%, target at least 15%` };
  }

  return { score, detail: `Very low savings rate of ${clamped.toFixed(1)}%, prioritize saving` };
}

function scoreDebtToIncome(ratio: number): { score: number; detail: string } {
  const clamped = clamp(ratio, 0, 100);

  if (clamped <= 30) {
    const score = 100 - (clamped / 30) * 20;
    return { score, detail: `Healthy debt-to-income ratio of ${clamped.toFixed(1)}%` };
  }

  if (clamped <= 50) {
    const score = 80 - ((clamped - 30) / 20) * 50;
    return { score, detail: `Moderate debt-to-income ratio of ${clamped.toFixed(1)}%, consider reducing debt` };
  }

  const score = Math.max(0, 30 - ((clamped - 50) / 50) * 30);
  return { score, detail: `High debt-to-income ratio of ${clamped.toFixed(1)}%, debt reduction is critical` };
}

function scoreEmergencyFund(months: number): { score: number; detail: string } {
  const clamped = Math.max(0, months);

  if (clamped >= 6) {
    return { score: 100, detail: `Strong emergency fund of ${clamped.toFixed(1)} months` };
  }

  if (clamped >= 3) {
    const score = 50 + ((clamped - 3) / 3) * 50;
    return { score, detail: `Adequate emergency fund of ${clamped.toFixed(1)} months, build to 6+` };
  }

  const score = (clamped / 3) * 50;
  return { score, detail: `Insufficient emergency fund of ${clamped.toFixed(1)} months, aim for 3-6 months` };
}

function scoreBudgetAdherence(adherence: number): { score: number; detail: string } {
  const clamped = clamp(adherence, 0, 100);
  const score = clamped;

  if (clamped >= 90) {
    return { score, detail: `Excellent budget discipline at ${clamped.toFixed(1)}%` };
  }

  if (clamped >= 70) {
    return { score, detail: `Good budget adherence at ${clamped.toFixed(1)}%, minor overspending in some areas` };
  }

  if (clamped >= 50) {
    return { score, detail: `Fair budget adherence at ${clamped.toFixed(1)}%, review spending habits` };
  }

  return { score, detail: `Poor budget adherence at ${clamped.toFixed(1)}%, significant overspending detected` };
}

export function calculateFinancialHealthScore(
  params: HealthScoreParams,
): HealthScoreResult {
  const { savingsRate, debtToIncomeRatio, emergencyFundMonths, budgetAdherence } = params;

  const savings = scoreSavingsRate(savingsRate);
  const debt = scoreDebtToIncome(debtToIncomeRatio);
  const emergency = scoreEmergencyFund(emergencyFundMonths);
  const budget = scoreBudgetAdherence(budgetAdherence);

  const factors: HealthScoreFactor[] = [
    { name: 'Savings Rate', score: savings.score, weight: 0.3, detail: savings.detail },
    { name: 'Debt-to-Income', score: debt.score, weight: 0.25, detail: debt.detail },
    { name: 'Emergency Fund', score: emergency.score, weight: 0.25, detail: emergency.detail },
    { name: 'Budget Adherence', score: budget.score, weight: 0.2, detail: budget.detail },
  ];

  const weightedScore = factors.reduce(
    (total, factor) => total + factor.score * factor.weight,
    0,
  );

  return {
    score: Math.round(clamp(weightedScore, 0, 100)),
    factors,
  };
}
