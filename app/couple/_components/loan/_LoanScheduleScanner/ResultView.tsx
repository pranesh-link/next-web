"use client";

import {
  ConfidenceBadge,
  PrepaymentAmount,
  PrepaymentBalance,
  PrepaymentDate,
  PrepaymentRow,
  PrepaymentSection,
  PrepaymentTitle,
  PrepaymentTotal,
  ResultCard,
  ResultLabel,
  ResultRow,
  ResultTitle,
  ResultValue,
  ScheduleInfo,
} from "./styled-result";
import { type ScannedLoanData } from "./types";
import { formatCurrency, getConfidenceLevel } from "./utils";

/** Props for {@link LoanResultView}. */
interface LoanResultViewProps {
  /** Parsed loan-schedule result. */
  result: ScannedLoanData;
}

/**
 * Render the parsed loan details card after a successful schedule scan.
 *
 * @param props - See {@link LoanResultViewProps}.
 */
export function LoanResultView({ result }: LoanResultViewProps) {
  return (
    <ResultCard>
      <ResultTitle>
        Extracted Loan Details
        {result.confidence != null && (
          <ConfidenceBadge $level={getConfidenceLevel(result.confidence)}>
            {result.confidence}% confidence
          </ConfidenceBadge>
        )}
      </ResultTitle>
      {result.loanName && (
        <ResultRow>
          <ResultLabel>Loan Name</ResultLabel>
          <ResultValue>{result.loanName}</ResultValue>
        </ResultRow>
      )}
      {result.principal != null && (
        <ResultRow>
          <ResultLabel>Principal</ResultLabel>
          <ResultValue>{formatCurrency(result.principal)}</ResultValue>
        </ResultRow>
      )}
      {result.interestRate != null && (
        <ResultRow>
          <ResultLabel>Interest Rate</ResultLabel>
          <ResultValue>{result.interestRate}%</ResultValue>
        </ResultRow>
      )}
      {result.tenureMonths != null && (
        <ResultRow>
          <ResultLabel>Tenure</ResultLabel>
          <ResultValue>{result.tenureMonths} months</ResultValue>
        </ResultRow>
      )}
      {result.emiAmount != null && (
        <ResultRow>
          <ResultLabel>EMI Amount</ResultLabel>
          <ResultValue>{formatCurrency(result.emiAmount)}</ResultValue>
        </ResultRow>
      )}
      {result.startDate && (
        <ResultRow>
          <ResultLabel>Start Date</ResultLabel>
          <ResultValue>{result.startDate}</ResultValue>
        </ResultRow>
      )}
      {result.schedule && result.schedule.length > 0 && (
        <ScheduleInfo>
          {result.schedule.length} EMI installments extracted
        </ScheduleInfo>
      )}
      {!result.schedule &&
        result.totalScheduleRows != null &&
        result.totalScheduleRows > 0 && (
          <ScheduleInfo>
            {result.totalScheduleRows} EMI installments found
          </ScheduleInfo>
        )}
      {result.emisPaid != null && result.emisPaid > 0 && (
        <ResultRow>
          <ResultLabel>EMIs Paid</ResultLabel>
          <ResultValue>
            {result.emisPaid}
            {result.tenureMonths ? ` / ${result.tenureMonths}` : ""}
          </ResultValue>
        </ResultRow>
      )}
      {result.remainingBalance != null && result.remainingBalance > 0 && (
        <ResultRow>
          <ResultLabel>Outstanding Balance</ResultLabel>
          <ResultValue>{formatCurrency(result.remainingBalance)}</ResultValue>
        </ResultRow>
      )}
      {result.prepayments && result.prepayments.length > 0 && (
        <PrepaymentSection>
          <PrepaymentTitle>
            Part Prepayments ({result.prepayments.length})
          </PrepaymentTitle>
          {result.prepayments.map((pp, i) => (
            <PrepaymentRow key={i}>
              <PrepaymentDate>{pp.date}</PrepaymentDate>
              <PrepaymentAmount>{formatCurrency(pp.amount)}</PrepaymentAmount>
              {pp.balanceAfter != null && (
                <PrepaymentBalance>
                  Bal: {formatCurrency(pp.balanceAfter)}
                </PrepaymentBalance>
              )}
            </PrepaymentRow>
          ))}
          <PrepaymentTotal>
            Total Prepaid:{" "}
            {formatCurrency(
              result.prepayments.reduce((s, p) => s + p.amount, 0),
            )}
          </PrepaymentTotal>
        </PrepaymentSection>
      )}
    </ResultCard>
  );
}
