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
} from "@/finance/_components/theme/styled-primitives";

const ACCOUNT_TYPES = ["BANK", "CASH", "CREDIT_CARD"] as const;

const ACCOUNT_TYPE_LABELS: Record<(typeof ACCOUNT_TYPES)[number], string> = {
  BANK: "Bank Account",
  CASH: "Cash",
  CREDIT_CARD: "Credit Card",
};

const accountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(100),
  type: z.enum(ACCOUNT_TYPES, { error: "Account type is required" }),
  balance: z.number({ error: "Balance must be a number" }),
});

type AccountData = z.infer<typeof accountSchema>;

interface AccountFormProps {
  initialData?: Partial<AccountData>;
  onSubmit: (data: AccountData) => Promise<void>;
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

export default function AccountForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: AccountFormProps) {
  const [form, setForm] = useState<AccountData>({
    name: initialData?.name ?? "",
    type: initialData?.type ?? "BANK",
    balance: initialData?.balance ?? 0,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof AccountData, string>>
  >({});

  function updateField<K extends keyof AccountData>(
    key: K,
    value: AccountData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = accountSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof AccountData, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof AccountData;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    await onSubmit(result.data);
  }

  return (
    <FormWrapper onSubmit={handleSubmit}>
      {/* Name */}
      <FieldGroup>
        <FinanceLabel htmlFor="acc-name">Account Name</FinanceLabel>
        <FinanceInput
          id="acc-name"
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="e.g. HDFC Savings"
          disabled={isLoading}
        />
        {errors.name && <FinanceErrorText>{errors.name}</FinanceErrorText>}
      </FieldGroup>

      {/* Type */}
      <FieldGroup>
        <FinanceLabel htmlFor="acc-type">Account Type</FinanceLabel>
        <FinanceSelect
          id="acc-type"
          value={form.type}
          onChange={(e) =>
            updateField("type", e.target.value as AccountData["type"])
          }
          disabled={isLoading}
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACCOUNT_TYPE_LABELS[t]}
            </option>
          ))}
        </FinanceSelect>
        {errors.type && <FinanceErrorText>{errors.type}</FinanceErrorText>}
      </FieldGroup>

      {/* Balance */}
      <FieldGroup>
        <FinanceLabel htmlFor="acc-balance">Balance (₹)</FinanceLabel>
        <FinanceInput
          id="acc-balance"
          type="number"
          step="0.01"
          value={form.balance || ""}
          onChange={(e) =>
            updateField("balance", parseFloat(e.target.value) || 0)
          }
          placeholder="0"
          disabled={isLoading}
        />
        {errors.balance && (
          <FinanceErrorText>{errors.balance}</FinanceErrorText>
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
            "Save Account"
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
