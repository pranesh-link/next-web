"use client";

import { useState } from "react";
import {
  FinanceButton,
  FinanceButtonOutline,
  FinanceInput,
  FinanceLabel,
  FinanceErrorText,
} from "@/couple/_components/theme/styled-primitives";
import {
  ActionRow,
  FieldGroup,
  FormWrapper,
  OptionalHint,
  Spinner,
} from "./GoalForm.styled";
import { goalSchema, type GoalData, type GoalFormProps } from "./_GoalForm/types";
import ProgressPreview from "./_GoalForm/ProgressPreview";

/**
 * Controlled form for creating or editing a savings goal.
 *
 * @param props - See {@link GoalFormProps}.
 * @returns A styled-components form. Calls `onSubmit` with validated data on success.
 * @remarks Client component. Mobile-first responsive. Empty `deadline` is normalised to `undefined` before validation.
 */
export default function GoalForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: GoalFormProps) {
  const [form, setForm] = useState<GoalData>({
    name: initialData?.name ?? "",
    targetAmount: initialData?.targetAmount ?? 0,
    currentAmount: initialData?.currentAmount ?? 0,
    deadline: initialData?.deadline ?? "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof GoalData, string>>
  >({});

  function updateField<K extends keyof GoalData>(
    key: K,
    value: GoalData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = { ...form };
    if (!parsed.deadline) {
      parsed.deadline = undefined;
    }
    const result = goalSchema.safeParse(parsed);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof GoalData, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof GoalData;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    await onSubmit(result.data);
  }

  return (
    <FormWrapper onSubmit={handleSubmit}>
      {/* Goal Name */}
      <FieldGroup>
        <FinanceLabel htmlFor="goal-name">Goal Name</FinanceLabel>
        <FinanceInput
          id="goal-name"
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="e.g. Emergency Fund"
          disabled={isLoading}
        />
        {errors.name && <FinanceErrorText>{errors.name}</FinanceErrorText>}
      </FieldGroup>

      {/* Target Amount */}
      <FieldGroup>
        <FinanceLabel htmlFor="goal-target">Target Amount (₹)</FinanceLabel>
        <FinanceInput
          id="goal-target"
          type="number"
          min="0"
          step="1000"
          value={form.targetAmount || ""}
          onChange={(e) =>
            updateField("targetAmount", parseFloat(e.target.value) || 0)
          }
          placeholder="e.g. 500000"
          disabled={isLoading}
        />
        {errors.targetAmount && (
          <FinanceErrorText>{errors.targetAmount}</FinanceErrorText>
        )}
      </FieldGroup>

      {/* Current Amount */}
      <FieldGroup>
        <FinanceLabel htmlFor="goal-current">Current Amount (₹)</FinanceLabel>
        <FinanceInput
          id="goal-current"
          type="number"
          min="0"
          step="100"
          value={form.currentAmount || ""}
          onChange={(e) =>
            updateField("currentAmount", parseFloat(e.target.value) || 0)
          }
          placeholder="0"
          disabled={isLoading}
        />
        {errors.currentAmount && (
          <FinanceErrorText>{errors.currentAmount}</FinanceErrorText>
        )}
      </FieldGroup>

      {/* Progress Preview */}
      {form.targetAmount > 0 && (
        <ProgressPreview
          targetAmount={form.targetAmount}
          currentAmount={form.currentAmount}
        />
      )}

      {/* Deadline */}
      <FieldGroup>
        <FinanceLabel htmlFor="goal-deadline">
          Deadline <OptionalHint>(optional)</OptionalHint>
        </FinanceLabel>
        <FinanceInput
          id="goal-deadline"
          type="date"
          value={form.deadline ?? ""}
          onChange={(e) => updateField("deadline", e.target.value)}
          disabled={isLoading}
        />
        {errors.deadline && (
          <FinanceErrorText>{errors.deadline}</FinanceErrorText>
        )}
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
            "Save Goal"
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
