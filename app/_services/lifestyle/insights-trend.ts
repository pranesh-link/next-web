/**
 * Pure helpers powering {@link computeTrend} in `insights.ts`.
 *
 * Kept separate so `insights.ts` stays under the 300-line cap and so
 * the streak / slope math can be unit-tested in isolation.
 */
import type { BodyMetricRow } from "./body-metric-service";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Render a UTC `YYYY-MM-DD` key for a date.
 *
 * @param date - The date to bucket.
 * @returns ISO date portion at UTC midnight.
 */
export function dayKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  )
    .toISOString()
    .slice(0, 10);
}

/**
 * Today's UTC day key — extracted so tests can override via `Date.now`.
 *
 * @returns Current `YYYY-MM-DD` at UTC midnight.
 */
export function todayKey(): string {
  return dayKey(new Date());
}

/**
 * Coerce a Prisma `Decimal` (or number) to a plain JS number.
 *
 * @param value - Raw value from a metric row.
 * @returns Numeric representation.
 */
export function toNumber(value: BodyMetricRow["weightInKg"]): number {
  return typeof value === "number" ? value : Number(value);
}

/**
 * Find the metric whose `measuredOn` is closest to `target`.
 *
 * @param metrics - Sorted or unsorted history.
 * @param target - Reference timestamp.
 * @return The nearest metric, or `null` for an empty list.
 */
export function nearestPriorTo(
  metrics: BodyMetricRow[],
  target: Date,
): BodyMetricRow | null {
  let best: BodyMetricRow | null = null;
  let bestDiff = Infinity;
  for (const m of metrics) {
    const diff = Math.abs(new Date(m.measuredOn).getTime() - target.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      best = m;
    }
  }
  return best;
}

/**
 * Linear regression slope of weight over time, expressed as kg / week.
 *
 * Considers up to the last 30 samples. Returns 0 when fewer than two
 * samples are available or the time axis is degenerate.
 *
 * @param samples - Metric history sorted ascending by `measuredOn`.
 * @returns Slope in kilograms per week.
 */
export function computeSlopePerWeek(samples: BodyMetricRow[]): number {
  if (samples.length < 2) return 0;
  const tail = samples.slice(-30);
  const t0 = new Date(tail[0].measuredOn).getTime();
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (const m of tail) {
    const x = (new Date(m.measuredOn).getTime() - t0) / (7 * MS_PER_DAY);
    const y = toNumber(m.weightInKg);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  const n = tail.length;
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

/**
 * Compute the longest run of consecutive day entries and the current
 * streak (which is `0` unless the most recent entry is today).
 *
 * @param metrics - Metric history sorted ascending by `measuredOn`.
 * @returns `{ currentStreak, longestStreak }`.
 */
export function computeStreaks(metrics: BodyMetricRow[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (metrics.length === 0) return { currentStreak: 0, longestStreak: 0 };
  const uniqueKeys = Array.from(new Set(metrics.map((m) => dayKey(m.measuredOn))));
  uniqueKeys.sort();

  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniqueKeys.length; i++) {
    const prev = new Date(`${uniqueKeys[i - 1]}T00:00:00Z`).getTime();
    const cur = new Date(`${uniqueKeys[i]}T00:00:00Z`).getTime();
    if (cur - prev === MS_PER_DAY) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  const lastKey = uniqueKeys[uniqueKeys.length - 1];
  let current = 0;
  if (lastKey === todayKey()) {
    current = 1;
    for (let i = uniqueKeys.length - 2; i >= 0; i--) {
      const prev = new Date(`${uniqueKeys[i]}T00:00:00Z`).getTime();
      const next = new Date(`${uniqueKeys[i + 1]}T00:00:00Z`).getTime();
      if (next - prev === MS_PER_DAY) current += 1;
      else break;
    }
  }
  return { currentStreak: current, longestStreak: longest };
}
