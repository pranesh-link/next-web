"use client";

import { useState } from "react";
import {
  FinanceButton,
  FinanceButtonOutline,
  FinanceInput,
  FinanceSelect,
  FinanceLabel,
  FinanceErrorText,
} from "@/couple/_components/theme/styled-primitives";
import {
  ActionRow,
  FieldGroup,
  FormWrapper,
  Spinner,
  StyledTextarea,
} from "./TransactionForm.styled";
import {
  CATEGORIES,
  transactionSchema,
  type TransactionData,
  type TransactionFormProps,
} from "./_TransactionForm/types";
import TypeRadioGroup from "./_TransactionForm/TypeRadioGroup";

/**
 * Controlled form for creating or editing a financial transaction.
 *
 * @param props - See {@link TransactionFormProps}.
 * @returns A styled-components form. Calls `onSubmit` with validated data on success.
 * @remarks Client component. Mobile-first responsive.
 */
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
        <TypeRadioGroup
          value={form.type}
          onChange={(t) => updateField("type", t)}
          disabled={isLoading}
        />
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
