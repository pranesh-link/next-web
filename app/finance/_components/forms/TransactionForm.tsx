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

const CATEGORIES = [
  "Food",
  "Rent",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Salary",
  "Freelance",
  "Investment",
  "EMI",
  "Utilities",
  "Other",
] as const;

const transactionSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required").max(200),
  date: z.string().min(1, "Date is required"),
});

type TransactionData = z.infer<typeof transactionSchema>;

interface Account {
  id: string;
  name: string;
}

interface TransactionFormProps {
  accounts: Account[];
  initialData?: Partial<TransactionData>;
  onSubmit: (data: TransactionData) => Promise<void>;
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

const RadioGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 4px;
`;

const RadioLabel = styled.label<{ $variant?: "income" | "expense" }>`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: ${(p) =>
    p.$variant === "income"
      ? "#16a34a"
      : p.$variant === "expense"
        ? "#dc2626"
        : "#64748b"};
`;

const RadioCircle = styled.span<{ $checked?: boolean; $color?: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid
    ${(p) => (p.$checked ? p.$color || "#3b82f6" : "#d1d5db")};
  transition: border-color 0.2s ease, background 0.2s ease;

  &::after {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${(p) =>
      p.$checked ? p.$color || "#3b82f6" : "transparent"};
    transition: background 0.2s ease;
  }
`;

const HiddenRadio = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
`;

const StyledTextarea = styled.textarea`
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #1e293b;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  width: 100%;
  font-family: inherit;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }

  &::placeholder {
    color: #9ca3af;
  }
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

export default function TransactionForm({
  accounts,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: TransactionFormProps) {
  const [form, setForm] = useState<TransactionData>({
    accountId: initialData?.accountId ?? "",
    amount: initialData?.amount ?? 0,
    type: initialData?.type ?? "EXPENSE",
    category: initialData?.category ?? "",
    description: initialData?.description ?? "",
    date: initialData?.date ?? new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof TransactionData, string>>
  >({});

  function updateField<K extends keyof TransactionData>(
    key: K,
    value: TransactionData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = transactionSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof TransactionData, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof TransactionData;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    await onSubmit(result.data);
  }

  return (
    <FormWrapper onSubmit={handleSubmit}>
      {/* Account */}
      <FieldGroup>
        <FinanceLabel htmlFor="txn-account">Account</FinanceLabel>
        <FinanceSelect
          id="txn-account"
          value={form.accountId}
          onChange={(e) => updateField("accountId", e.target.value)}
          disabled={isLoading}
        >
          <option value="">Select account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </FinanceSelect>
        {errors.accountId && (
          <FinanceErrorText>{errors.accountId}</FinanceErrorText>
        )}
      </FieldGroup>

      {/* Type */}
      <FieldGroup>
        <FinanceLabel as="span">Type</FinanceLabel>
        <RadioGroup>
          {(["INCOME", "EXPENSE"] as const).map((t) => {
            const isIncome = t === "INCOME";
            const color = isIncome ? "#16a34a" : "#dc2626";
            return (
              <RadioLabel
                key={t}
                $variant={isIncome ? "income" : "expense"}
              >
                <HiddenRadio
                  type="radio"
                  name="txnType"
                  value={t}
                  checked={form.type === t}
                  onChange={() => updateField("type", t)}
                  disabled={isLoading}
                />
                <RadioCircle $checked={form.type === t} $color={color} />
                {isIncome ? "Income" : "Expense"}
              </RadioLabel>
            );
          })}
        </RadioGroup>
        {errors.type && <FinanceErrorText>{errors.type}</FinanceErrorText>}
      </FieldGroup>

      {/* Amount */}
      <FieldGroup>
        <FinanceLabel htmlFor="txn-amount">Amount (₹)</FinanceLabel>
        <FinanceInput
          id="txn-amount"
          type="number"
          min="0"
          step="0.01"
          value={form.amount || ""}
          onChange={(e) =>
            updateField("amount", parseFloat(e.target.value) || 0)
          }
          placeholder="0"
          disabled={isLoading}
        />
        {errors.amount && (
          <FinanceErrorText>{errors.amount}</FinanceErrorText>
        )}
      </FieldGroup>

      {/* Category */}
      <FieldGroup>
        <FinanceLabel htmlFor="txn-category">Category</FinanceLabel>
        <FinanceSelect
          id="txn-category"
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

      {/* Description */}
      <FieldGroup>
        <FinanceLabel htmlFor="txn-desc">Description</FinanceLabel>
        <StyledTextarea
          id="txn-desc"
          rows={3}
          value={form.description}
          onChange={(e) => updateField("description", e.target.value)}
          placeholder="What was this transaction for?"
          disabled={isLoading}
        />
        {errors.description && (
          <FinanceErrorText>{errors.description}</FinanceErrorText>
        )}
      </FieldGroup>

      {/* Date */}
      <FieldGroup>
        <FinanceLabel htmlFor="txn-date">Date</FinanceLabel>
        <FinanceInput
          id="txn-date"
          type="date"
          value={form.date}
          onChange={(e) => updateField("date", e.target.value)}
          disabled={isLoading}
        />
        {errors.date && <FinanceErrorText>{errors.date}</FinanceErrorText>}
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
            "Save Transaction"
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
