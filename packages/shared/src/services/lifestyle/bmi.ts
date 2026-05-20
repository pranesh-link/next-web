import type { BMIFormData, BmiCategory } from '../../types';

/**
 * Round a number to a given number of decimal places.
 *
 * @param value - Number to round.
 * @param decimals - Number of decimal places. Defaults to 1.
 * @returns Rounded number.
 */
function round(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Compute BMI from height (cm) and weight (kg).
 *
 * @param formData - Object with heightInCm and weightInKg (string or number).
 * @returns BMI rounded to one decimal place.
 */
export function getBMI(formData: BMIFormData): number {
  const height = Number(formData.heightInCm) / 100;
  const weight = Number(formData.weightInKg);
  if (height <= 0 || weight <= 0) return 0;
  return round(weight / (height * height));
}

/**
 * Determine BMI category from a numeric BMI value.
 *
 * @param bmi - Numeric BMI value.
 * @returns Category classification.
 */
export function categoryFromBmi(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'healthy';
  if (bmi < 30) return 'overweight';
  return 'obese';
}
