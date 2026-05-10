"use client";

import {
  CalcButton,
  EmiInputWrap,
  EmiRow,
  FieldGroup,
  SummaryBox,
  SummaryLabel,
  SummaryRow,
  SummaryValue,
} from "../LoanForm.styled";
import {
  FinanceErrorText,
  FinanceInput,
  FinanceLabel,
} from "@/couple/_components/theme/styled-primitives";
import { formatCurrency } from "./utils";

/**
 * Props for {@link EmiSection}.
 */
export interface EmiSectionProps {
  /** Current EMI amount (₹). */
  emiAmount: number;
  /** Tenure in months — drives total payable computation. */
  tenureMonths: number;
  /** Principal amount — required to enable the calculate button. */
  principalAmount: number;
  /** Validation error string for the EMI field, if any. */
  emiError?: string;
  /** When true, all inputs are disabled. */
  isLoading?: boolean;
  /** Called when the EMI input changes. */
  onChangeEmi: (next: number) => void;
  /** Called when the user clicks "Calculate EMI". */
  onCalculate: () => void;
}

/**
 * EMI input + Calculate button + computed totals summary.
 *
 * @param props - See {@link EmiSectionProps}.
 * @returns A field group with the EMI input, calculator button, and a totals card.
 */
export default function EmiSection({
  emiAmount,
  tenureMonths,
  principalAmount,
  emiError,
  isLoading,
  onChangeEmi,
  onCalculate,
}: EmiSectionProps) {
  const totalPayable = emiAmount * tenureMonths;
  const totalInterest = totalPayable - principalAmount;

  return (
    <>
      <FieldGroup>
        <FinanceLabel htmlFor="loan-emi">EMI Amount (₹)</FinanceLabel>
        <EmiRow>
          <EmiInputWrap>
            <FinanceInput
              id="loan-emi"
              type="number"
              min="0"
              step="1"
              value={emiAmount || ""}
              onChange={(e) =>
                onChangeEmi(parseFloat(e.target.value) || 0)
              }
              placeholder="0"
              disabled={isLoading}
            />
          </EmiInputWrap>
          <CalcButton
            type="button"
            onClick={onCalculate}
            disabled={
              isLoading || principalAmount <= 0 || tenureMonths <= 0
            }
          >
            Calculate EMI
          </CalcButton>
        </EmiRow>
        {emiError && <FinanceErrorText>{emiError}</FinanceErrorText>}
      </FieldGroup>

      {emiAmount > 0 && tenureMonths > 0 && (
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
    </>
  );
}
