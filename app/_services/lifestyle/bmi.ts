/**
 * Pure BMI helpers for the Lifestyle/Wellness module.
 *
 * Standalone — no CMS, Redux, or AppContext coupling. All ranges and
 * labels are passed as plain function parameters by the caller.
 */
import { round } from "@/_utils/common";
import { validateRegex } from "@/_utils/form";
import { FormFieldValueType, IFormField } from "@/_store/profile/types";

/**
 * A BMI band used for gauge rendering and category derivation.
 *
 * `name` is the canonical category key used by {@link categoryFromBmi}
 * (e.g. `"underweight"`, `"healthy"`, `"overweight"`, `"obese"`). `id`
 * and `label` are display-only and may differ between callers.
 */
export interface BMIRange {
  id?: string;
  name?: string;
  min?: number;
  max?: number;
  label?: string;
  prefixedPercentile: number;
  isHealthyRange?: boolean;
  color?: string;
}

/** Canonical BMI category buckets used across the lifestyle module. */
export type BmiCategory = "underweight" | "healthy" | "overweight" | "obese";

/** Numeric form data accepted by {@link getBMI}. */
export interface BMIFormData {
  heightInCm: string | number;
  weightInKg: string | number;
}

/** Permissible numeric range used by {@link validateBMIFieldInputForRanges}. */
export interface MinMax {
  min: number;
  max: number;
}

/**
 * Compute BMI from height (cm) and weight (kg) form values.
 *
 * @param formData - Raw form data; values may be strings or numbers.
 * @returns BMI rounded to one decimal place.
 */
export function getBMI(formData: BMIFormData): number {
  const height = round(Number(formData.heightInCm) / 100, 2);
  const weight = Number(formData.weightInKg);
  return round(weight / Math.pow(height, 2), 1);
}

/**
 * Find the {@link BMIRange} that contains the given BMI value.
 *
 * Falls back to the first range when no band matches.
 *
 * @param bmiRanges - Ordered list of bands.
 * @param bmi - The BMI value to classify.
 * @returns The matching range (or the first range as a fallback).
 */
export function getCurrentBMIRange(bmiRanges: BMIRange[], bmi: number): BMIRange {
  let bmiRange = bmiRanges[0];
  for (let i = 0; i < bmiRanges.length; i++) {
    const { min, max } = bmiRanges[i];
    if (!min && max && bmi <= max) {
      bmiRange = bmiRanges[i];
      break;
    } else if (min && !max && bmi >= min) {
      bmiRange = bmiRanges[i];
      break;
    } else if (min && max) {
      if (bmi >= min && bmi <= max) {
        bmiRange = bmiRanges[i];
        break;
      }
    }
  }
  return bmiRange;
}

/**
 * Compute the gauge needle position for a BMI within its current band.
 *
 * @param currentBMIRange - The band the BMI falls in.
 * @param bmi - The BMI value.
 * @returns Fraction in `[0, 1]` to position the gauge needle.
 */
export function getBMIRangePercentForGauge(
  currentBMIRange: BMIRange,
  bmi: number,
): number {
  const { prefixedPercentile, min = 0, max = 100 } = currentBMIRange;
  const percentByBMIFraction = (20 / (max - min)) * (bmi - min);
  const percentage = Math.round(prefixedPercentile + percentByBMIFraction);
  return percentage / 100;
}

function getIdealWeights(
  formData: BMIFormData,
  healthyBMIRange: BMIRange,
  bmi: number,
) {
  const height = round(Number(formData.heightInCm) / 100, 2);
  const { min = 0, max = 0 } = healthyBMIRange;
  const lowestWeight = round(min * Math.pow(height, 2), 1);
  const highestWeight = round(max * Math.pow(height, 2), 1);
  let nearestWeight = 0;
  if (bmi < min) nearestWeight = lowestWeight;
  else if (bmi > max) nearestWeight = highestWeight;
  return { nearestWeight, lowestWeight, highestWeight };
}

/**
 * Build the suggestion config rendered next to the gauge.
 *
 * @param label - i18n labels with `ideal`, `increase`, `reduce` keys.
 * @param formData - Current form values (height/weight).
 * @param bmi - The current BMI.
 * @param healthyBMIRange - The band considered healthy.
 * @param isCurrentBMIHealthy - Whether the BMI sits in the healthy band.
 * @returns Direction label, ideal weight bounds, and delta to ideal.
 */
export function getWeightSuggestConfig(
  label: Record<string, string>,
  formData: BMIFormData,
  bmi: number,
  healthyBMIRange: BMIRange,
  isCurrentBMIHealthy: boolean,
) {
  if (bmi) {
    const {
      nearestWeight: nearestIdealWeight,
      highestWeight,
      lowestWeight,
    } = getIdealWeights(formData, healthyBMIRange, bmi);
    const diffToIdealWeight = round(
      Number(formData.weightInKg) - nearestIdealWeight,
      2,
    );
    const weightDirection = isCurrentBMIHealthy
      ? label.ideal
      : diffToIdealWeight < 0
        ? label.increase
        : label.reduce;
    return {
      weightDirection,
      idealWeightRanges: { min: lowestWeight, max: highestWeight },
      diffToIdealWeight,
    };
  }
  return {
    weightDirection: label.reduce,
    idealWeightRanges: { min: 0, max: 100 },
    diffToIdealWeight: 0,
  };
}

/**
 * Validate a BMI form field against its configured regex.
 *
 * @param value - Raw field value.
 * @param currentFieldConfig - Optional field config carrying a regex.
 * @returns Empty string when valid, or `"regexError"` otherwise.
 */
export function validateBMIFields(
  value: FormFieldValueType,
  currentFieldConfig?: IFormField,
): string {
  let isRegexValid = true;
  if (currentFieldConfig?.regex) {
    isRegexValid = validateRegex(
      value as number,
      currentFieldConfig.regex,
      true,
    );
  }
  return isRegexValid ? "" : "regexError";
}

/**
 * Check whether a numeric input falls within a permissible range.
 *
 * @param value - Raw string input.
 * @param permissibleRanges - Inclusive `{ min, max }` bounds.
 * @returns `true` when within range, `false` otherwise.
 */
export function validateBMIFieldInputForRanges(
  value: string,
  permissibleRanges: MinMax,
): boolean {
  const formattedValue = Number(value);
  return (
    formattedValue >= permissibleRanges.min &&
    formattedValue <= permissibleRanges.max
  );
}

function defaultCategoryFromThresholds(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "healthy";
  if (bmi < 30) return "overweight";
  return "obese";
}

const NAME_TO_CATEGORY: Record<string, BmiCategory> = {
  underweight: "underweight",
  healthy: "healthy",
  normal: "healthy",
  healthyweight: "healthy",
  overweight: "overweight",
  obese: "obese",
  severeobese: "obese",
};

/**
 * Derive the canonical {@link BmiCategory} for a BMI value.
 *
 * When `bmiRanges` is provided the matching band's `name` (case-insensitive)
 * is mapped to a category. When omitted or unmapped, the WHO threshold
 * defaults apply: `<18.5` underweight, `<25` healthy, `<30` overweight,
 * `≥30` obese.
 *
 * @param bmi - The BMI value.
 * @param bmiRanges - Optional bands to consult.
 * @returns The canonical category bucket.
 */
export function categoryFromBmi(bmi: number, bmiRanges?: BMIRange[]): BmiCategory {
  if (!bmiRanges || bmiRanges.length === 0) {
    return defaultCategoryFromThresholds(bmi);
  }
  const range = getCurrentBMIRange(bmiRanges, bmi);
  const key = (range.name ?? "").toLowerCase().replace(/[\s_-]/g, "");
  return NAME_TO_CATEGORY[key] ?? defaultCategoryFromThresholds(bmi);
}
