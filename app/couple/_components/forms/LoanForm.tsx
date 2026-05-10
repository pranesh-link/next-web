"use client";

import { useState, useCallback } from "react";
import {
  FinanceInput,
  FinanceLabel,
  FinanceErrorText,
} from "@/couple/_components/theme/styled-primitives";
import LoanScheduleScanner from "@/couple/_components/loan/LoanScheduleScanner";
import type { ScannedLoanData } from "@/couple/_components/loan/LoanScheduleScanner";
import {
  AccountNumberBadge,
  FieldGroup,
  FormWrapper,
  ImportPdfButton,
  ScannerWrapper,
  TwoColGrid,
} from "./LoanForm.styled";
import { loanSchema, type LoanData, type LoanFormProps } from "./_LoanForm/types";
import { calculateEMI } from "./_LoanForm/utils";
import EmiSection from "./_LoanForm/EmiSection";
import SubmitActions from "./_LoanForm/SubmitActions";

/**
 * Controlled form for creating or editing a loan, with optional PDF schedule import.
 *
 * @param props - See {@link LoanFormProps}.
 * @returns A styled-components form. Calls `onSubmit` with validated data on success.
 * @remarks Client component. Mobile-first responsive. Supports importing loan
 * details from a repayment-schedule PDF via {@link LoanScheduleScanner}.
 */
export default function LoanForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: LoanFormProps) {
  const [form, setForm] = useState<LoanData>({
    name: initialData?.name ?? "",
    loanProvider: initialData?.loanProvider ?? undefined,
    loanAccountNumber: initialData?.loanAccountNumber ?? undefined,
    principalAmount: initialData?.principalAmount ?? 0,
    interestRate: initialData?.interestRate ?? 0,
    tenureMonths: initialData?.tenureMonths ?? 0,
    emiAmount: initialData?.emiAmount ?? 0,
    startDate:
      initialData?.startDate ?? new Date().toISOString().split("T")[0],
    remainingBalance: initialData?.remainingBalance ?? 0,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof LoanData, string>>
  >({});
  const [showScanner, setShowScanner] = useState(false);

  const handleScanComplete = useCallback((data: ScannedLoanData) => {
    setForm((prev) => ({
      name: data.loanName || prev.name || "",
      loanProvider: data.loanProvider ?? prev.loanProvider ?? undefined,
      loanAccountNumber:
        data.loanAccountNumber ?? prev.loanAccountNumber ?? undefined,
      principalAmount: data.principal || prev.principalAmount || 0,
      interestRate: data.interestRate || prev.interestRate || 0,
      tenureMonths: data.tenureMonths || prev.tenureMonths || 0,
      emiAmount: data.emiAmount || prev.emiAmount || 0,
      startDate:
        data.startDate ||
        prev.startDate ||
        new Date().toISOString().split("T")[0],
      remainingBalance:
        data.remainingBalance ||
        data.principal ||
        prev.remainingBalance ||
        0,
    }));
    setShowScanner(false);
    setErrors({});
  }, []);

  function updateField<K extends keyof LoanData>(
    key: K,
    value: LoanData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  const handleCalculateEMI = useCallback(() => {
    const emi = calculateEMI(
      form.principalAmount,
      form.interestRate,
      form.tenureMonths,
    );
    setForm((prev) => ({ ...prev, emiAmount: emi }));
  }, [form.principalAmount, form.interestRate, form.tenureMonths]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = loanSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoanData, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof LoanData;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    await onSubmit(result.data);
  }

  return (
    <FormWrapper onSubmit={handleSubmit} noValidate>
      {/* Import from PDF */}
      {showScanner ? (
        <ScannerWrapper>
          <LoanScheduleScanner
            onScanComplete={handleScanComplete}
            onClose={() => setShowScanner(false)}
          />
        </ScannerWrapper>
      ) : (
        <ImportPdfButton type="button" onClick={() => setShowScanner(true)}>
          📄{" "}
          {initialData
            ? "Update from Repayment Schedule PDF"
            : "Import from Repayment Schedule PDF"}
        </ImportPdfButton>
      )}

      {/* Loan Name */}
      <FieldGroup>
        <FinanceLabel htmlFor="loan-name">Loan Name</FinanceLabel>
        <FinanceInput
          id="loan-name"
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="e.g. Home Loan - SBI"
          disabled={isLoading}
        />
        {errors.name && <FinanceErrorText>{errors.name}</FinanceErrorText>}
      </FieldGroup>

      {/* Loan Account Number (read-only, shown when populated) */}
      {form.loanAccountNumber && (
        <FieldGroup>
          <FinanceLabel>Loan Account Number</FinanceLabel>
          <AccountNumberBadge>🔖 {form.loanAccountNumber}</AccountNumberBadge>
        </FieldGroup>
      )}

      {/* Loan Provider (read-only, shown when populated) */}
      {form.loanProvider && (
        <FieldGroup>
          <FinanceLabel>Lender / Provider</FinanceLabel>
          <AccountNumberBadge>🏦 {form.loanProvider}</AccountNumberBadge>
        </FieldGroup>
      )}

      {/* Principal Amount */}
      <FieldGroup>
        <FinanceLabel htmlFor="loan-principal">
          Principal Amount (₹)
        </FinanceLabel>
        <FinanceInput
          id="loan-principal"
          type="number"
          min="0"
          step="any"
          value={form.principalAmount || ""}
          onChange={(e) =>
            updateField("principalAmount", parseFloat(e.target.value) || 0)
          }
          placeholder="e.g. 2500000"
          disabled={isLoading}
        />
        {errors.principalAmount && (
          <FinanceErrorText>{errors.principalAmount}</FinanceErrorText>
        )}
      </FieldGroup>

      {/* Interest Rate & Tenure */}
      <TwoColGrid>
        <FieldGroup>
          <FinanceLabel htmlFor="loan-rate">Interest Rate (%)</FinanceLabel>
          <FinanceInput
            id="loan-rate"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={form.interestRate || ""}
            onChange={(e) =>
              updateField("interestRate", parseFloat(e.target.value) || 0)
            }
            placeholder="e.g. 8.5"
            disabled={isLoading}
          />
          {errors.interestRate && (
            <FinanceErrorText>{errors.interestRate}</FinanceErrorText>
          )}
        </FieldGroup>
        <FieldGroup>
          <FinanceLabel htmlFor="loan-tenure">Tenure (months)</FinanceLabel>
          <FinanceInput
            id="loan-tenure"
            type="number"
            min="1"
            step="1"
            value={form.tenureMonths || ""}
            onChange={(e) =>
              updateField("tenureMonths", parseInt(e.target.value) || 0)
            }
            placeholder="e.g. 240"
            disabled={isLoading}
          />
          {errors.tenureMonths && (
            <FinanceErrorText>{errors.tenureMonths}</FinanceErrorText>
          )}
        </FieldGroup>
      </TwoColGrid>

      {/* EMI Amount + Calculate + Summary */}
      <EmiSection
        emiAmount={form.emiAmount}
        tenureMonths={form.tenureMonths}
        principalAmount={form.principalAmount}
        emiError={errors.emiAmount}
        isLoading={isLoading}
        onChangeEmi={(v) => updateField("emiAmount", v)}
        onCalculate={handleCalculateEMI}
      />

      {/* Start Date */}
      <FieldGroup>
        <FinanceLabel htmlFor="loan-start">Start Date</FinanceLabel>
        <FinanceInput
          id="loan-start"
          type="date"
          value={form.startDate}
          onChange={(e) => updateField("startDate", e.target.value)}
          disabled={isLoading}
        />
        {errors.startDate && (
          <FinanceErrorText>{errors.startDate}</FinanceErrorText>
        )}
      </FieldGroup>

      {/* Remaining Balance */}
      <FieldGroup>
        <FinanceLabel htmlFor="loan-remaining">
          Remaining Balance (₹)
        </FinanceLabel>
        <FinanceInput
          id="loan-remaining"
          type="number"
          min="0"
          step="any"
          value={form.remainingBalance || ""}
          onChange={(e) =>
            updateField(
              "remainingBalance",
              parseFloat(e.target.value) || 0,
            )
          }
          placeholder="0"
          disabled={isLoading}
        />
        {errors.remainingBalance && (
          <FinanceErrorText>{errors.remainingBalance}</FinanceErrorText>
        )}
      </FieldGroup>

      {/* Actions */}
      <SubmitActions isLoading={isLoading} onCancel={onCancel} />
    </FormWrapper>
  );
}
