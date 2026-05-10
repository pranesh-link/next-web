import {
  DEFAULT_WELLNESS_THRESHOLDS,
  buildWellnessSuggestions,
  computeTrend,
} from "../insights";
import type { BodyMetricRow } from "../body-metric-service";

function metric(date: string, weightInKg: number): BodyMetricRow {
  return {
    id: `m-${date}`,
    userId: "u1",
    subjectId: "u1",
    coupleId: null,
    measuredOn: new Date(`${date}T00:00:00Z`),
    weightInKg: weightInKg as unknown as BodyMetricRow["weightInKg"],
    heightInCm: 170 as unknown as BodyMetricRow["heightInCm"],
    bmi: 22 as unknown as BodyMetricRow["bmi"],
    bmiCategory: "healthy",
    note: null,
    createdAt: new Date(`${date}T00:00:00Z`),
    updatedAt: new Date(`${date}T00:00:00Z`),
  };
}

function texts(suggestions: ReturnType<typeof buildWellnessSuggestions>): string[] {
  return suggestions.map((s) => s.text);
}

const ZERO_TREND = {
  deltaWeek: 0,
  deltaMonth: 0,
  slopePerWeek: 0,
  lowest: null,
  highest: null,
  currentStreak: 0,
  longestStreak: 0,
  daysTracked: 0,
};

describe("insights — buildWellnessSuggestions rule chain", () => {
  it("should emit obese rule", () => {
    const out = buildWellnessSuggestions([], ZERO_TREND, null, 32, "obese");
    expect(texts(out)).toContain(
      "BMI in the obese range — consult a doctor and aim for sustainable 0.25-0.5 kg/week loss.",
    );
  });
  it("should emit overweight rule", () => {
    const out = buildWellnessSuggestions([], ZERO_TREND, null, 27, "overweight");
    expect(texts(out)).toContain(
      "BMI in the overweight range — small daily walks and 200-300 kcal deficit can move you toward healthy.",
    );
  });
  it("should emit underweight rule", () => {
    const out = buildWellnessSuggestions([], ZERO_TREND, null, 17, "underweight");
    expect(texts(out)).toContain(
      "BMI in the underweight range — increase calorie-dense whole foods and strength training.",
    );
  });
  it("should emit healthy rule", () => {
    const out = buildWellnessSuggestions([], ZERO_TREND, null, 22, "healthy");
    expect(texts(out)).toContain(
      "BMI in the healthy range. Keep tracking weekly to maintain it.",
    );
  });

  it("should emit fast-gain rule when slope > 0.5", () => {
    const out = buildWellnessSuggestions(
      [],
      { ...ZERO_TREND, slopePerWeek: 0.6 },
      null,
      22,
      "healthy",
    );
    expect(texts(out)).toContain(
      "Weight rising > 0.5 kg/week — review portion sizes and weekend snacking.",
    );
  });
  it("should emit fast-loss rule when slope < -0.75", () => {
    const out = buildWellnessSuggestions(
      [],
      { ...ZERO_TREND, slopePerWeek: -1 },
      null,
      22,
      "healthy",
    );
    expect(texts(out)).toContain(
      "Weight dropping > 0.75 kg/week — fast loss is hard to sustain. Aim for 0.25-0.5 kg/week.",
    );
  });
  it("should emit stable rule for low slope and >14 days tracked", () => {
    const out = buildWellnessSuggestions(
      [],
      { ...ZERO_TREND, slopePerWeek: 0.05, daysTracked: 20 },
      null,
      22,
      "healthy",
    );
    expect(texts(out)).toContain("Weight stable for 2+ weeks — great consistency.");
  });

  it("should emit streak rule when currentStreak >= 7", () => {
    const out = buildWellnessSuggestions(
      [metric("2026-05-01", 70)],
      { ...ZERO_TREND, currentStreak: 9 },
      null,
      22,
      "healthy",
    );
    expect(texts(out)).toContain(
      "9-day logging streak! Consistency drives results.",
    );
  });
  it("should emit broken-streak rule when currentStreak === 0 and metrics exist", () => {
    const out = buildWellnessSuggestions(
      [metric("2026-05-01", 70)],
      { ...ZERO_TREND, currentStreak: 0 },
      null,
      22,
      "healthy",
    );
    expect(texts(out)).toContain("Log today's weight to keep your streak going.");
  });

  it("should emit target-gap rule when current > target + 2", () => {
    const out = buildWellnessSuggestions(
      [metric("2026-05-01", 80)],
      ZERO_TREND,
      { targetWeightInKg: 70 },
      27,
      "overweight",
    );
    expect(texts(out)).toContain(
      "10.0 kg from your target — small daily wins compound.",
    );
  });
  it("should emit target-reached rule when within 1kg", () => {
    const out = buildWellnessSuggestions(
      [metric("2026-05-01", 70.5)],
      ZERO_TREND,
      { targetWeightInKg: 70 },
      22,
      "healthy",
    );
    expect(texts(out)).toContain("You've reached your target weight!");
  });

  it("should emit early-data rule when daysTracked < 7", () => {
    const out = buildWellnessSuggestions(
      [],
      { ...ZERO_TREND, daysTracked: 3 },
      null,
      22,
      "healthy",
    );
    expect(texts(out)).toContain(
      "Log daily for at least a week to see meaningful trends.",
    );
  });
  it("should emit meaningful-sample rule when metrics.length >= 30", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      metric(`2026-04-${String(i + 1).padStart(2, "0")}`, 70),
    );
    const out = buildWellnessSuggestions(
      many,
      { ...ZERO_TREND, daysTracked: 30 },
      null,
      22,
      "healthy",
    );
    expect(texts(out)).toContain(
      "30+ data points — your trend chart is statistically meaningful.",
    );
  });

  it("should accept threshold overrides", () => {
    const out = buildWellnessSuggestions(
      [],
      { ...ZERO_TREND, slopePerWeek: 0.3 },
      null,
      22,
      "healthy",
      { ...DEFAULT_WELLNESS_THRESHOLDS, fastGainPerWeek: 0.2 },
    );
    expect(texts(out)).toContain(
      "Weight rising > 0.5 kg/week — review portion sizes and weekend snacking.",
    );
  });
});

describe("insights — computeTrend", () => {
  it("should return zeros for empty list", () => {
    const t = computeTrend([]);
    expect(t).toEqual({
      deltaWeek: 0,
      deltaMonth: 0,
      slopePerWeek: 0,
      lowest: null,
      highest: null,
      currentStreak: 0,
      longestStreak: 0,
      daysTracked: 0,
    });
  });

  it("should handle a single entry", () => {
    const t = computeTrend([metric("2026-05-01", 70)]);
    expect(t.daysTracked).toBe(1);
    expect(t.slopePerWeek).toBe(0);
    expect(t.lowest?.id).toBe("m-2026-05-01");
    expect(t.highest?.id).toBe("m-2026-05-01");
  });

  it("should detect a gain trend", () => {
    const t = computeTrend([
      metric("2026-05-01", 70),
      metric("2026-05-08", 70.5),
      metric("2026-05-15", 71),
    ]);
    expect(t.slopePerWeek).toBeCloseTo(0.5, 5);
  });

  it("should detect a loss trend", () => {
    const t = computeTrend([
      metric("2026-05-01", 71),
      metric("2026-05-08", 70.5),
      metric("2026-05-15", 70),
    ]);
    expect(t.slopePerWeek).toBeCloseTo(-0.5, 5);
  });

  it("should detect a stable plateau", () => {
    const t = computeTrend([
      metric("2026-05-01", 70),
      metric("2026-05-06", 70),
      metric("2026-05-11", 70),
      metric("2026-05-16", 70),
      metric("2026-05-21", 70),
    ]);
    expect(t.slopePerWeek).toBeCloseTo(0, 5);
    expect(t.daysTracked).toBe(5);
  });

  it("should report currentStreak=0 when most recent entry is not today", () => {
    const t = computeTrend([
      metric("2026-05-01", 70),
      metric("2026-05-02", 70),
      metric("2026-05-03", 70),
    ]);
    expect(t.currentStreak).toBe(0);
    expect(t.longestStreak).toBe(3);
  });

  it("should compute longestStreak ignoring gaps", () => {
    const t = computeTrend([
      metric("2026-05-01", 70),
      metric("2026-05-02", 70),
      metric("2026-05-04", 70),
      metric("2026-05-05", 70),
      metric("2026-05-06", 70),
    ]);
    expect(t.longestStreak).toBe(3);
  });

  it("should compute a full streak ending today", () => {
    const today = new Date();
    const days: BodyMetricRow[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i),
      );
      days.push(metric(d.toISOString().slice(0, 10), 70));
    }
    const t = computeTrend(days);
    expect(t.currentStreak).toBe(3);
  });
});
