"use client";

import { useState } from "react";
import { z } from "zod";
import styled, { keyframes } from "styled-components";
import {
  FinanceButton,
  FinanceButtonOutline,
  FinanceInput,
  FinanceLabel,
  FinanceErrorText,
} from "@/couple/_components/theme/styled-primitives";

const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required").max(100),
  targetAmount: z.number().positive("Target amount must be positive"),
  currentAmount: z.number().min(0, "Current amount cannot be negative"),
  deadline: z.string().optional(),
});

type GoalData = z.infer<typeof goalSchema>;

interface GoalFormProps {
  initialData?: Partial<GoalData>;
  onSubmit: (data: GoalData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
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

const ProgressBox = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
`;

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ProgressLabel = styled.span`
  font-size: 12px;
  color: #64748b;
`;

const ProgressPct = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #3b82f6;
`;

const ProgressTrack = styled.div`
  height: 4px;
  width: 100%;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;
`;

const fillAnim = keyframes`
  from { width: 0%; }
`;

const ProgressFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  animation: ${fillAnim} 0.6s ease-out;
`;

const RemainingText = styled.p`
  font-size: 12px;
  color: #94a3b8;
  margin: 8px 0 0;
`;

const OptionalHint = styled.span`
  color: #94a3b8;
`;

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

  const percentage =
    form.targetAmount > 0
      ? Math.min(
          Math.round((form.currentAmount / form.targetAmount) * 100),
          100,
        )
      : 0;

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
        <ProgressBox>
          <ProgressHeader>
            <ProgressLabel>Progress</ProgressLabel>
            <ProgressPct>{percentage}%</ProgressPct>
          </ProgressHeader>
          <ProgressTrack>
            <ProgressFill $pct={percentage} />
          </ProgressTrack>
          <RemainingText>
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(form.targetAmount - form.currentAmount)}{" "}
            remaining
          </RemainingText>
        </ProgressBox>
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
