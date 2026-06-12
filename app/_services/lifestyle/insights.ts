/**
 * Deterministic wellness insights — no AI, no network.
 *
 * Two pure functions: {@link computeTrend} produces summary statistics
 * over a metric history, and {@link buildWellnessSuggestions} runs a
 * fixed rule chain over the trend + current state to surface coaching
 * messages.
 */
import type { BodyMetricRow } from "./body-metric-service";
import type { BmiCategory } from "./bmi";
import {
  computeSlopePerWeek,
  computeStreaks,
  dayKey,
  nearestPriorTo,
  toNumber,
} from "./insights-trend";

/** A single coaching suggestion surfaced to the UI. */
export interface WellnessSuggestion {
  icon: string;
  text: string;
  type: "warning" | "info" | "success" | "danger";
}

/** Aggregate statistics derived from a metric history. */
export interface WellnessTrend {
  deltaWeek: number;
  deltaMonth: number;
  slopePerWeek: number;
  lowest: BodyMetricRow | null;
  highest: BodyMetricRow | null;
  currentStreak: number;
  longestStreak: number;
  daysTracked: number;
}

/** Tunable thresholds used by {@link buildWellnessSuggestions}. */
export interface WellnessThresholds {
  fastGainPerWeek: number;
  fastLossPerWeek: number;
  stableSlopeAbs: number;
  stableMinDays: number;
  streakMinDays: number;
  targetGapMinKg: number;
  targetReachedAbsKg: number;
  meaningfulSampleSize: number;
  earlyDataMaxDays: number;
}

/** Default thresholds applied when callers do not override them. */
export const DEFAULT_WELLNESS_THRESHOLDS: WellnessThresholds = {
  fastGainPerWeek: 0.5,
  fastLossPerWeek: 0.75,
  stableSlopeAbs: 0.1,
  stableMinDays: 14,
  streakMinDays: 7,
  targetGapMinKg: 2,
  targetReachedAbsKg: 1,
  meaningfulSampleSize: 30,
  earlyDataMaxDays: 7,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Compute summary statistics over a body metric history.
 *
 * @param metrics - Metric rows in any order; copied before sorting.
 * @returns Aggregate {@link WellnessTrend}.
 */
export function computeTrend(metrics: BodyMetricRow[]): WellnessTrend {
  if (metrics.length === 0) {
    return {
      deltaWeek: 0,
      deltaMonth: 0,
      slopePerWeek: 0,
      lowest: null,
      highest: null,
      currentStreak: 0,
      longestStreak: 0,
      daysTracked: 0,
    };
  }
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.measuredOn).getTime() - new Date(b.measuredOn).getTime(),
  );
  let lowest = sorted[0];
  let highest = sorted[0];
  for (const m of sorted) {
    if (toNumber(m.weightInKg) < toNumber(lowest.weightInKg)) lowest = m;
    if (toNumber(m.weightInKg) > toNumber(highest.weightInKg)) highest = m;
  }
  const daysTracked = new Set(sorted.map((m) => dayKey(m.measuredOn))).size;
  const current = sorted[sorted.length - 1];
  const currentWeight = toNumber(current.weightInKg);
  const weekTarget = new Date(new Date(current.measuredOn).getTime() - 7 * MS_PER_DAY);
  const monthTarget = new Date(new Date(current.measuredOn).getTime() - 30 * MS_PER_DAY);
  const weekRef = nearestPriorTo(sorted, weekTarget);
  const monthRef = nearestPriorTo(sorted, monthTarget);
  const deltaWeek = weekRef ? currentWeight - toNumber(weekRef.weightInKg) : 0;
  const deltaMonth = monthRef ? currentWeight - toNumber(monthRef.weightInKg) : 0;
  const slopePerWeek = computeSlopePerWeek(sorted);
  const { currentStreak, longestStreak } = computeStreaks(sorted);
  return {
    deltaWeek,
    deltaMonth,
    slopePerWeek,
    lowest,
    highest,
    currentStreak,
    longestStreak,
    daysTracked,
  };
}

function pushCategoryRule(
  out: WellnessSuggestion[],
  currentCategory: BmiCategory,
): void {
  if (currentCategory === "obese") {
    out.push({
      icon: "🚨",
      type: "danger",
      text: "BMI in the obese range — consult a doctor and aim for sustainable 0.25-0.5 kg/week loss.",
    });
  } else if (currentCategory === "overweight") {
    out.push({
      icon: "⚠️",
      type: "warning",
      text: "BMI in the overweight range — small daily walks and 200-300 kcal deficit can move you toward healthy.",
    });
  } else if (currentCategory === "underweight") {
    out.push({
      icon: "⚠️",
      type: "warning",
      text: "BMI in the underweight range — increase calorie-dense whole foods and strength training.",
    });
  } else if (currentCategory === "healthy") {
    out.push({
      icon: "✅",
      type: "success",
      text: "BMI in the healthy range. Keep tracking weekly to maintain it.",
    });
  }
}

function pushSlopeRules(
  out: WellnessSuggestion[],
  trend: WellnessTrend,
  t: WellnessThresholds,
): void {
  if (trend.slopePerWeek > t.fastGainPerWeek) {
    out.push({
      icon: "📈",
      type: "warning",
      text: "Weight rising > 0.5 kg/week — review portion sizes and weekend snacking.",
    });
  }
  if (trend.slopePerWeek < -t.fastLossPerWeek) {
    out.push({
      icon: "📉",
      type: "warning",
      text: "Weight dropping > 0.75 kg/week — fast loss is hard to sustain. Aim for 0.25-0.5 kg/week.",
    });
  }
  if (
    Math.abs(trend.slopePerWeek) <= t.stableSlopeAbs &&
    trend.daysTracked > t.stableMinDays
  ) {
    out.push({
      icon: "🎯",
      type: "success",
      text: "Weight stable for 2+ weeks — great consistency.",
    });
  }
}

function pushStreakRules(
  out: WellnessSuggestion[],
  metrics: BodyMetricRow[],
  trend: WellnessTrend,
  t: WellnessThresholds,
): void {
  if (trend.currentStreak >= t.streakMinDays) {
    out.push({
      icon: "🔥",
      type: "success",
      text: `${trend.currentStreak}-day logging streak! Consistency drives results.`,
    });
  }
  if (trend.currentStreak === 0 && metrics.length > 0) {
    out.push({
      icon: "📅",
      type: "info",
      text: "Log today's weight to keep your streak going.",
    });
  }
}

function pushTargetRules(
  out: WellnessSuggestion[],
  metrics: BodyMetricRow[],
  profile: { targetWeightInKg?: number | null } | null,
  t: WellnessThresholds,
): void {
  const target = profile?.targetWeightInKg ?? null;
  const latest = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  if (target == null || !latest) return;
  const currentWeight = toNumber(latest.weightInKg);
  if (currentWeight > target + t.targetGapMinKg) {
    out.push({
      icon: "🎯",
      type: "info",
      text: `${(currentWeight - target).toFixed(1)} kg from your target — small daily wins compound.`,
    });
  }
  if (Math.abs(currentWeight - target) <= t.targetReachedAbsKg) {
    out.push({
      icon: "🏆",
      type: "success",
      text: "You've reached your target weight!",
    });
  }
}

function pushDataVolumeRules(
  out: WellnessSuggestion[],
  metrics: BodyMetricRow[],
  trend: WellnessTrend,
  t: WellnessThresholds,
): void {
  if (trend.daysTracked < t.earlyDataMaxDays) {
    out.push({
      icon: "💡",
      type: "info",
      text: "Log daily for at least a week to see meaningful trends.",
    });
  }
  if (metrics.length >= t.meaningfulSampleSize) {
    out.push({
      icon: "📊",
      type: "success",
      text: "30+ data points — your trend chart is statistically meaningful.",
    });
  }
}

/**
 * Build the wellness coaching suggestions for the current state.
 *
 * Rules fire independently — multiple suggestions may be returned and
 * are emitted in the documented rule order.
 *
 * @param metrics - Full metric history for the subject.
 * @param trend - Pre-computed {@link WellnessTrend}.
 * @param profile - Subject's body profile (only `targetWeightInKg` is read).
 * @param currentBmi - Current BMI value (reserved for future rules).
 * @param currentCategory - Current canonical category.
 * @param thresholds - Optional override; defaults to {@link DEFAULT_WELLNESS_THRESHOLDS}.
 * @returns Ordered list of suggestions (possibly empty).
 */
export function buildWellnessSuggestions(
  metrics: BodyMetricRow[],
  trend: WellnessTrend,
  profile: { targetWeightInKg?: number | null } | null,
  currentBmi: number,
  currentCategory: BmiCategory,
  thresholds: WellnessThresholds = DEFAULT_WELLNESS_THRESHOLDS,
): WellnessSuggestion[] {
  void currentBmi;
  const out: WellnessSuggestion[] = [];
  pushCategoryRule(out, currentCategory);
  pushSlopeRules(out, trend, thresholds);
  pushStreakRules(out, metrics, trend, thresholds);
  pushTargetRules(out, metrics, profile, thresholds);
  pushDataVolumeRules(out, metrics, trend, thresholds);
  return out;
}
