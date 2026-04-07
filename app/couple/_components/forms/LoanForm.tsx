"use client";

import { useState, useCallback } from "react";
import { z } from "zod";
import styled, { keyframes } from "styled-components";
import {
  FinanceButton,
  FinanceButtonOutline,
  FinanceInput,
  FinanceLabel,
  FinanceErrorText,
} from "@/couple/_components/theme/styled-primitives";
import LoanScheduleScanner from "@/couple/_components/loan/LoanScheduleScanner";
import type { ScannedLoanData } from "@/couple/_components/loan/LoanScheduleScanner";

const loanSchema = z.object({
  name: z.string().min(1, "Loan name is required").max(100),
  loanProvider: z.string().optional(),
  loanAccountNumber: z.string().optional(),
  principalAmount: z.number().positive("Principal must be positive"),
  interestRate: z
    .number()
    .min(0, "Interest rate cannot be negative")
    .max(100, "Interest rate too high"),
  tenureMonths: z.number().int().positive("Tenure must be at least 1 month"),
  emiAmount: z.number().min(0, "EMI cannot be negative"),
  startDate: z.string().min(1, "Start date is required"),
  remainingBalance: z
    .number()
    .min(0, "Remaining balance cannot be negative"),
});

type LoanData = z.infer<typeof loanSchema>;

interface LoanFormProps {
  initialData?: Partial<LoanData & { loanProvider?: string | null; loanAccountNumber?: string | null }>;
  onSubmit: (data: LoanData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate === 0) return principal / tenureMonths;
  const monthlyRate = annualRate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
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

const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media screen and (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const EmiRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

const EmiInputWrap = styled.div`
  flex: 1;
`;

const CalcButton = styled(FinanceButtonOutline)`
  flex-shrink: 0;
  white-space: nowrap;
  align-self: flex-end;
`;

const SummaryBox = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & + & {
    margin-top: 8px;
  }
`;

const SummaryLabel = styled.span`
  font-size: 13px;
  color: #64748b;
`;

const SummaryValue = styled.span<{ $danger?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => (p.$danger ? "#dc2626" : "#1e293b")};
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 4px;
`;

const ImportPdfButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08));
  border: 1px dashed rgba(59, 130, 246, 0.3);
  color: var(--accent-light, #60a5fa);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    border-color: rgba(59, 130, 246, 0.5);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.12));
  }
`;

const AccountNumberBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-light, #60a5fa);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.3px;
`;

const ScannerWrapper = styled.div`
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.03);
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
    setForm({
      name: data.loanName || form.name || "",
      loanProvider: data.loanProvider ?? form.loanProvider ?? undefined,
      loanAccountNumber: data.loanAccountNumber ?? form.loanAccountNumber ?? undefined,
      principalAmount: data.principal || form.principalAmount || 0,
      interestRate: data.interestRate || form.interestRate || 0,
      tenureMonths: data.tenureMonths || form.tenureMonths || 0,
      emiAmount: data.emiAmount || form.emiAmount || 0,
      startDate: data.startDate || form.startDate || new Date().toISOString().split("T")[0],
      remainingBalance: data.remainingBalance || data.principal || form.remainingBalance || 0,
    });
    setShowScanner(false);
    setErrors({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const totalPayable = form.emiAmount * form.tenureMonths;
  const totalInterest = totalPayable - form.principalAmount;

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
          📄 {initialData ? "Update from Repayment Schedule PDF" : "Import from Repayment Schedule PDF"}
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

      {/* EMI Amount + Calculate */}
      <FieldGroup>
        <FinanceLabel htmlFor="loan-emi">EMI Amount (₹)</FinanceLabel>
        <EmiRow>
          <EmiInputWrap>
            <FinanceInput
              id="loan-emi"
              type="number"
              min="0"
              step="1"
              value={form.emiAmount || ""}
              onChange={(e) =>
                updateField("emiAmount", parseFloat(e.target.value) || 0)
              }
              placeholder="0"
              disabled={isLoading}
            />
          </EmiInputWrap>
          <CalcButton
            type="button"
            onClick={handleCalculateEMI}
            disabled={
              isLoading ||
              form.principalAmount <= 0 ||
              form.tenureMonths <= 0
            }
          >
            Calculate EMI
          </CalcButton>
        </EmiRow>
        {errors.emiAmount && (
          <FinanceErrorText>{errors.emiAmount}</FinanceErrorText>
        )}
      </FieldGroup>

      {/* EMI Summary */}
      {form.emiAmount > 0 && form.tenureMonths > 0 && (
        <SummaryBox>
          <SummaryRow>
            <SummaryLabel>Total Payable</SummaryLabel>
            <SummaryValue>{formatCurrency(totalPayable)}</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Total Interest</SummaryLabel>
            <SummaryValue $danger={totalInterest > 0}>
              {formatCurrency(Math.max(totalInterest, 0))}
            </SummaryValue>
          </SummaryRow>
        </SummaryBox>
      )}

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
            "Save Loan"
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
