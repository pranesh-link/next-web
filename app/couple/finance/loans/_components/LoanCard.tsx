"use client";

import { useEffect, useState } from "react";
import {
  formatCurrency,
  formatDate,
  type InsightResult,
  type Loan,
  type PrepaymentResult,
} from "../_utils";
import { ButtonRow, SmallButton } from "../_styled";
import PrepaymentSimulator from "./PrepaymentSimulator";
import LoanInsights from "./LoanInsights";
import LoanCardActions from "./LoanCardActions";
import LoanScheduleControls from "./LoanScheduleControls";
import {
  AccountBadge,
  CardMetaRow,
  DetailItem,
  DetailLabel,
  DetailValue,
  DetailsGrid,
  EmiTooltip,
  EmiTooltipBubble,
  LoanCardHeader,
  LoanCardWrap,
  LoanMeta,
  LoanName,
  LoanProviderText,
  MetaItem,
  MetaLabel,
  MetaValue,
  ProgressFill,
  ProgressLabel,
  ProgressMeta,
  ProgressPct,
  ProgressSection,
  ProgressTrack,
  RemainingLabel,
  RemainingRow,
  RemainingValue,
  ScheduleSourceNote,
  StartDate,
} from "./LoanCard.styled";
import { computeLoanDerived } from "./loan-card-derive";

type Props = {
  /** Loan being rendered. */
  loan: Loan;
  /** Open the edit modal for the loan. */
  onEdit: (loan: Loan) => void;
  /** Prompt to confirm deleting the loan by id. */
  onDeletePrompt: (id: string) => void;
  /** Loan id currently loading its schedule. */
  scheduleLoadingLoanId: string | null;
  /** Map of loan id → schedule load error message. */
  scheduleLoadErrors: Record<string, string>;
  /** Loan id whose schedule load is pending and can be retried. */
  pendingScheduleLoanId: string | null;
  /** Retry the pending schedule fetch. */
  onRetrySchedule: () => void;
  /** Toggle the inline schedule panel. */
  onToggleSchedule: (loanId: string) => void;
  /** Open the prepayments modal for the loan. */
  onOpenPrepaymentsModal: (loanId: string) => void;
  /** Loan id whose simulator is currently open. */
  simulatorLoanId: string | null;
  /** Bound prepayment amount input (string for controlled input). */
  prepaymentAmount: string;
  /** Update the prepayment amount input. */
  onPrepaymentAmountChange: (v: string) => void;
  /** True while simulating prepayment. */
  simulating: boolean;
  /** Result of the most recent prepayment simulation. */
  simResult: PrepaymentResult | null;
  /** Toggle the simulator panel. */
  onToggleSimulator: (loanId: string) => void;
  /** Run the prepayment simulation. */
  onSimulate: () => void;
  /** Loan id whose insights panel is currently open. */
  insightsLoanId: string | null;
  /** True while loading insights. */
  insightsLoading: boolean;
  /** Loaded insight payload. */
  insightsData: InsightResult | null;
  /** Toggle the insights panel. */
  onToggleInsights: (loanId: string) => void;
};

/**
 * Render a single loan card with details, progress, schedule controls, and
 * inline simulator/insights panels.
 *
 * @param props - {@link Props} carrying the loan and all parent callbacks
 *   for schedule, prepayments, simulator, and insights interactions.
 * @returns The loan card element.
 */
export default function LoanCard({
  loan,
  onEdit,
  onDeletePrompt,
  scheduleLoadingLoanId,
  scheduleLoadErrors,
  pendingScheduleLoanId,
  onRetrySchedule,
  onToggleSchedule,
  onOpenPrepaymentsModal,
  simulatorLoanId,
  prepaymentAmount,
  onPrepaymentAmountChange,
  simulating,
  simResult,
  onToggleSimulator,
  onSimulate,
  insightsLoanId,
  insightsLoading,
  insightsData,
  onToggleInsights,
}: Props) {
  const [varyingEmiTipOpen, setVaryingEmiTipOpen] = useState(false);

  useEffect(() => {
    if (!varyingEmiTipOpen) return;
    const close = () => setVaryingEmiTipOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [varyingEmiTipOpen]);

  const d = computeLoanDerived(loan);
  const ppCount =
    loan.prepayments && Array.isArray(loan.prepayments)
      ? loan.prepayments.length
      : 0;

  return (
    <LoanCardWrap>
      <LoanCardHeader>
        <LoanName>{loan.name}</LoanName>
        <LoanCardActions loan={loan} onEdit={onEdit} onDeletePrompt={onDeletePrompt} />
      </LoanCardHeader>

      {(loan.loanAccountNumber || loan.loanProvider) && (
        <LoanMeta>
          {loan.loanAccountNumber && (
            <AccountBadge title="Loan Account Number">
              🔖 {loan.loanAccountNumber}
            </AccountBadge>
          )}
          {loan.loanProvider && (
            <LoanProviderText>{loan.loanProvider}</LoanProviderText>
          )}
        </LoanMeta>
      )}

      <DetailsGrid>
        <DetailItem>
          <DetailLabel>Principal</DetailLabel>
          <DetailValue>{formatCurrency(loan.principal)}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Interest Rate</DetailLabel>
          <DetailValue>{loan.interestRate}%</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Tenure</DetailLabel>
          <DetailValue>{loan.tenureMonths} months</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>Ends</DetailLabel>
          <DetailValue>{d.endDateStr}</DetailValue>
        </DetailItem>
        <DetailItem>
          <DetailLabel>{d.emiLabel}</DetailLabel>
          <DetailValue $color="var(--accent-light)">
            {formatCurrency(d.nextEmiAmount)}
            {d.isVarying && (
              <EmiTooltip
                onClick={(e) => {
                  e.stopPropagation();
                  setVaryingEmiTipOpen((prev) => !prev);
                }}
              >
                ℹ️
                {varyingEmiTipOpen && (
                  <EmiTooltipBubble>
                    This loan has varying EMIs. The amount shown is your next
                    scheduled payment.
                  </EmiTooltipBubble>
                )}
              </EmiTooltip>
            )}
          </DetailValue>
        </DetailItem>
      </DetailsGrid>

      <LoanScheduleControls
        loan={loan}
        scheduleLoadingLoanId={scheduleLoadingLoanId}
        scheduleLoadErrors={scheduleLoadErrors}
        pendingScheduleLoanId={pendingScheduleLoanId}
        onRetrySchedule={onRetrySchedule}
        onToggleSchedule={onToggleSchedule}
        onOpenPrepaymentsModal={onOpenPrepaymentsModal}
        ppCount={ppCount}
      />

      <ProgressSection>
        <ProgressMeta>
          <ProgressLabel>Repaid</ProgressLabel>
          <ProgressPct>{d.repaidPct}%</ProgressPct>
        </ProgressMeta>
        <ProgressTrack>
          <ProgressFill $width={d.repaidPct} />
        </ProgressTrack>
      </ProgressSection>

      <RemainingRow>
        <RemainingLabel>Principal Outstanding</RemainingLabel>
        <RemainingValue>{formatCurrency(loan.remainingBalance)}</RemainingValue>
      </RemainingRow>

      <CardMetaRow>
        <MetaItem>
          <MetaLabel>Next EMI</MetaLabel>
          <MetaValue $urgent={d.isUrgent && !d.loanCompleted}>
            {d.loanCompleted
              ? "✅ Completed"
              : `${formatDate(d.nextEmi)}${d.isUrgent ? " ⚠️" : ""}`}
          </MetaValue>
        </MetaItem>
        <MetaItem>
          <MetaLabel>EMIs Paid</MetaLabel>
          <MetaValue>
            {d.emisPaid}/{loan.tenureMonths}
          </MetaValue>
        </MetaItem>
      </CardMetaRow>

      <StartDate>Started {formatDate(loan.startDate)}</StartDate>
      {loan.scheduleGeneratedOn && (
        <ScheduleSourceNote>
          Based on repayment schedule dated {formatDate(loan.scheduleGeneratedOn)}
        </ScheduleSourceNote>
      )}
      {d.hasManualPrepayment && (
        <ScheduleSourceNote $accent>
          ⚡ Balance adjusted by manual prepayments
        </ScheduleSourceNote>
      )}

      <ButtonRow>
        <SmallButton
          $variant={simulatorLoanId === loan.id ? "accent" : "outline"}
          onClick={() => onToggleSimulator(loan.id)}
        >
          {simulatorLoanId === loan.id
            ? "Close Simulator"
            : "Prepayment Simulator"}
        </SmallButton>
        <SmallButton
          $variant={insightsLoanId === loan.id ? "accent" : "outline"}
          onClick={() => onToggleInsights(loan.id)}
        >
          {insightsLoanId === loan.id ? "Hide Insights" : "Insights"}
        </SmallButton>
      </ButtonRow>

      {simulatorLoanId === loan.id && (
        <PrepaymentSimulator
          prepaymentAmount={prepaymentAmount}
          onPrepaymentAmountChange={onPrepaymentAmountChange}
          simulating={simulating}
          onSimulate={onSimulate}
          simResult={simResult}
        />
      )}

      {insightsLoanId === loan.id && (
        <LoanInsights loading={insightsLoading} data={insightsData} />
      )}
    </LoanCardWrap>
  );
}
