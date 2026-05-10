/**
 * Static configuration for the wellness tracker.
 *
 * BMI bands follow WHO defaults. Each band carries the canonical category
 * key consumed by `categoryFromBmi` and the colour used for the gauge,
 * trend chart, and band pills.
 */
import { DEFAULT_WELLNESS_THRESHOLDS } from "@/_services/lifestyle/insights";

/** Canonical BMI category buckets shown by the wellness tracker. */
export type BandKey = "underweight" | "healthy" | "overweight" | "obese";

/** Shape of a single BMI band entry in {@link BMI_BANDS}. */
export interface BmiBand {
  key: BandKey;
  label: string;
  min: number;
  max: number;
  color: string;
}

/**
 * Ordered BMI bands rendered across the gauge, legend, and charts.
 *
 * Ranges are inclusive on both ends. The colour palette is shared with
 * {@link BAND_COLORS} so callers may look up by key.
 */
export const BMI_BANDS: readonly BmiBand[] = [
  { key: "underweight", label: "Underweight", min: 0, max: 18.4, color: "#3b82f6" },
  { key: "healthy", label: "Healthy", min: 18.5, max: 24.9, color: "#22c55e" },
  { key: "overweight", label: "Overweight", min: 25, max: 29.9, color: "#f59e0b" },
  { key: "obese", label: "Obese", min: 30, max: 100, color: "#ef4444" },
] as const;

/** Lookup table from {@link BandKey} to its band colour. */
export const BAND_COLORS: Record<BandKey, string> = BMI_BANDS.reduce(
  (acc, band) => {
    acc[band.key] = band.color;
    return acc;
  },
  {} as Record<BandKey, string>,
);

/** Descriptive insight text shown when a BMI band pill is tapped. */
export const BAND_INSIGHTS: Record<BandKey, { title: string; description: string; recommendation: string }> = {
  underweight: {
    title: "Underweight (BMI < 18.5)",
    description: "A BMI below 18.5 may indicate insufficient nutrition, which can weaken immunity, reduce bone density, and affect energy levels.",
    recommendation: "Focus on nutrient-dense meals, consider consulting a dietitian, and incorporate strength training to build lean mass.",
  },
  healthy: {
    title: "Healthy (BMI 18.5–24.9)",
    description: "A BMI in this range is associated with the lowest risk of weight-related health issues. Maintain your current lifestyle habits.",
    recommendation: "Keep up balanced nutrition, regular physical activity, and adequate sleep to stay in this range.",
  },
  overweight: {
    title: "Overweight (BMI 25–29.9)",
    description: "A BMI between 25 and 29.9 increases risk of cardiovascular disease, type 2 diabetes, and joint problems.",
    recommendation: "Aim for a modest calorie deficit, increase daily movement, and reduce processed food intake to trend toward the healthy range.",
  },
  obese: {
    title: "Obese (BMI ≥ 30)",
    description: "A BMI of 30 or above significantly raises risk for heart disease, stroke, diabetes, and certain cancers.",
    recommendation: "Consult a healthcare professional for a personalised plan. Small, consistent changes to diet and activity yield the best long-term results.",
  },
};

/**
 * Re-export of the default wellness rule thresholds so consumers can
 * import all wellness constants from a single module.
 */
export const WELLNESS_THRESHOLDS = DEFAULT_WELLNESS_THRESHOLDS;

/** Initial empty form values for the BMI calculator. */
export const DEFAULT_FORM = {
  heightInCm: "",
  weightInKg: "",
} as const;
