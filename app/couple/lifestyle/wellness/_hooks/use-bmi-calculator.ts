"use client";

import { useCallback, useMemo, useState } from "react";
import { categoryFromBmi, getBMI, type BmiCategory } from "@/_services/lifestyle/bmi";
import { BMI_BANDS, type BmiBand } from "../_constants";

/** Field names accepted by the calculator's `onChange` handler. */
export type BmiField = "heightInCm" | "weightInKg";

/** String-form values held by the calculator. */
export interface BmiFormData {
  heightInCm: string;
  weightInKg: string;
}

/** Per-field validation error message (empty when valid). */
export interface BmiFieldError {
  heightInCm: string;
  weightInKg: string;
}

/** Return shape of {@link useBmiCalculator}. */
export interface UseBmiCalculatorReturn {
  formData: BmiFormData;
  fieldError: BmiFieldError;
  bmi: number;
  category: BmiCategory | null;
  currentBand: BmiBand | null;
  onChange: (field: BmiField, value: string) => void;
  reset: () => void;
}

/**
 * Permitted numeric input — up to three integer digits with up to two
 * optional decimal places. Empty strings are allowed (cleared field).
 */
const NUMBER_RE = /^\d{1,3}(\.\d{1,2})?$/;

const EMPTY_FORM: BmiFormData = { heightInCm: "", weightInKg: "" };

/**
 * Validate a single field value against {@link NUMBER_RE}.
 *
 * @param value - The raw field input.
 * @returns Empty string when valid; an error message otherwise.
 */
function validateField(value: string): string {
  if (value === "") return "";
  return NUMBER_RE.test(value) ? "" : "Enter a number (up to 2 decimals)";
}

/**
 * Pure form-state hook for the BMI calculator.
 *
 * Holds height and weight as strings (so empty inputs survive a round
 * trip), exposes per-field validation, and derives the current BMI,
 * canonical category, and matching {@link BmiBand}. Does not perform
 * any data fetching.
 *
 * @param initial - Optional initial form values.
 * @returns Form state plus derived BMI / category / band.
 *
 * @example
 * ```tsx
 * const { formData, bmi, category, onChange, reset } = useBmiCalculator();
 * ```
 */
export function useBmiCalculator(
  initial?: { heightInCm?: string; weightInKg?: string },
): UseBmiCalculatorReturn {
  const [formData, setFormData] = useState<BmiFormData>(() => ({
    heightInCm: initial?.heightInCm ?? "",
    weightInKg: initial?.weightInKg ?? "",
  }));

  const fieldError = useMemo<BmiFieldError>(
    () => ({
      heightInCm: validateField(formData.heightInCm),
      weightInKg: validateField(formData.weightInKg),
    }),
    [formData.heightInCm, formData.weightInKg],
  );

  const bmi = useMemo<number>(() => {
    const { heightInCm, weightInKg } = formData;
    if (
      heightInCm === "" ||
      weightInKg === "" ||
      fieldError.heightInCm ||
      fieldError.weightInKg
    ) {
      return 0;
    }
    const value = getBMI({ heightInCm, weightInKg });
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [formData, fieldError.heightInCm, fieldError.weightInKg]);

  const category = useMemo<BmiCategory | null>(
    () => (bmi > 0 ? categoryFromBmi(bmi) : null),
    [bmi],
  );

  const currentBand = useMemo<BmiBand | null>(
    () => (category ? (BMI_BANDS.find((b) => b.key === category) ?? null) : null),
    [category],
  );

  const onChange = useCallback((field: BmiField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => {
    setFormData(EMPTY_FORM);
  }, []);

  return { formData, fieldError, bmi, category, currentBand, onChange, reset };
}
