import type { HealthScoreResult, HealthScoreFactor } from '../../types';

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
  if (clamped >= 25) return { score: 100, detail: `Excellent savings rate of ${clamped.toFixed(1)}%` };
  const score = (clamped / 25) * 100;
  if (clamped >= 15) return { score, detail: `Good savings rate of ${clamped.toFixed(1)}%, aim for 25%+` };
  if (clamped >= 5) return { score, detail: `Low savings rate of ${clamped.toFixed(1)}%, target at least 15%` };
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
  const clamped = clamp(months, 0, 12);
  if (clamped >= 6) return { score: 100, detail: `${clamped.toFixed(1)} months of emergency fund coverage` };
  const score = (clamped / 6) * 100;
  if (clamped >= 3) return { score, detail: `${clamped.toFixed(1)} months coverage, aim for 6+ months` };
  return { score, detail: `Only ${clamped.toFixed(1)} months coverage, build up emergency fund` };
}

function scoreBudgetAdherence(adherence: number): { score: number; detail: string } {
  const clamped = clamp(adherence, 0, 100);
  if (clamped >= 90) return { score: 100, detail: `Excellent budget adherence at ${clamped.toFixed(0)}%` };
  const score = (clamped / 90) * 100;
  if (clamped >= 70) return { score, detail: `Good budget adherence at ${clamped.toFixed(0)}%` };
  return { score, detail: `Budget adherence needs improvement at ${clamped.toFixed(0)}%` };
}

function getRating(score: number): HealthScoreResult['rating'] {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Calculate overall financial health score.
 *
 * @param params - Financial metrics to evaluate.
 * @returns Health score result with overall score, factors, and rating.
 */
export function calculateFinancialHealthScore(params: HealthScoreParams): HealthScoreResult {
  const { savingsRate, debtToIncomeRatio, emergencyFundMonths, budgetAdherence } = params;

  const savingsResult = scoreSavingsRate(savingsRate);
  const debtResult = scoreDebtToIncome(debtToIncomeRatio);
  const emergencyResult = scoreEmergencyFund(emergencyFundMonths);
  const budgetResult = scoreBudgetAdherence(budgetAdherence);

  const factors: HealthScoreFactor[] = [
    { name: 'Savings Rate', score: savingsResult.score, weight: 0.3, detail: savingsResult.detail },
    { name: 'Debt Management', score: debtResult.score, weight: 0.25, detail: debtResult.detail },
    { name: 'Emergency Fund', score: emergencyResult.score, weight: 0.25, detail: emergencyResult.detail },
    { name: 'Budget Adherence', score: budgetResult.score, weight: 0.2, detail: budgetResult.detail },
  ];

  const overallScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);

  return { overallScore: Math.round(overallScore), factors, rating: getRating(overallScore) };
}
