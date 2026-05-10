"use client";

import { useState } from "react";
import { z } from "zod";
import styled, { keyframes } from "styled-components";
import {
  FinanceButton,
  FinanceButtonOutline,
  FinanceInput,
  FinanceSelect,
  FinanceLabel,
  FinanceErrorText,
} from "@/couple/_components/theme/styled-primitives";
import { budgetSchema as canonicalBudgetSchema } from "@/_lib/validations/finance";

const CATEGORIES = [
  "Food",
  "Rent",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "EMI",
  "Utilities",
  "Other",
] as const;

/**
 * Form-side schema for BudgetForm. Built from the canonical
 * {@link canonicalBudgetSchema}: renames `limit` to `monthlyLimit` and accepts a
 * free-form `month` string (the form-level UI handles month selection).
 */
const budgetSchema = canonicalBudgetSchema
  .omit({ limit: true, month: true })
  .extend({
    monthlyLimit: z.number().positive("Monthly limit must be positive"),
    month: z.string().min(1, "Month is required"),
  });

/**
 * Validated BudgetForm data inferred from the form-side {@link budgetSchema}.
 */
type BudgetData = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  initialData?: Partial<BudgetData>;
  onSubmit: (data: BudgetData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/* ── Styled Components ── */

const FormWrapper = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media screen and (max-width: 480px) {
    gap: 16px;
  }
`;

const FieldGroup = styled.div``;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 4px;
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const Spinner = styled.svg`
  width: 16px;
  height: 16px;
  margin-right: 8px;
  animation: ${spin} 0.7s linear infinite;
`;

/* ── Component ── */

export default function BudgetForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: BudgetFormProps) {
  const [form, setForm] = useState<BudgetData>({
    category: initialData?.category ?? "",
    monthlyLimit: initialData?.monthlyLimit ?? 0,
    month: initialData?.month ?? getCurrentMonth(),
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof BudgetData, string>>
  >({});

  function updateField<K extends keyof BudgetData>(
    key: K,
    value: BudgetData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = budgetSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof BudgetData, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof BudgetData;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    await onSubmit(result.data);
  }

  return (
    <FormWrapper onSubmit={handleSubmit}>
      {/* Category */}
      <FieldGroup>
        <FinanceLabel htmlFor="budget-category">Category</FinanceLabel>
        <FinanceSelect
          id="budget-category"
          value={form.category}
          onChange={(e) => updateField("category", e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </FinanceSelect>
        {errors.category && (
          <FinanceErrorText>{errors.category}</FinanceErrorText>
        )}
      </FieldGroup>

      {/* Monthly Limit */}
      <FieldGroup>
        <FinanceLabel htmlFor="budget-limit">Monthly Limit (₹)</FinanceLabel>
        <FinanceInput
          id="budget-limit"
          type="number"
          min="0"
          step="100"
          value={form.monthlyLimit || ""}
          onChange={(e) =>
            updateField("monthlyLimit", parseFloat(e.target.value) || 0)
          }
          placeholder="e.g. 5000"
          disabled={isLoading}
        />
        {errors.monthlyLimit && (
          <FinanceErrorText>{errors.monthlyLimit}</FinanceErrorText>
        )}
      </FieldGroup>

      {/* Month */}
      <FieldGroup>
        <FinanceLabel htmlFor="budget-month">Month</FinanceLabel>
        <FinanceInput
          id="budget-month"
          type="month"
          value={form.month}
          onChange={(e) => updateField("month", e.target.value)}
          disabled={isLoading}
        />
        {errors.month && <FinanceErrorText>{errors.month}</FinanceErrorText>}
      </FieldGroup>

      {/* Actions */}
      <ActionRow>
        <FinanceButton type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  opacity="0.25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  opacity="0.75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </Spinner>
              Saving…
            </>
          ) : (
            "Save Budget"
          )}
        </FinanceButton>
        {onCancel && (
          <FinanceButtonOutline
            type="button"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </FinanceButtonOutline>
        )}
      </ActionRow>
    </FormWrapper>
  );
}
