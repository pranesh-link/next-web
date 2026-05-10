"use client";

import styled from "styled-components";
import type { Loan } from "../_utils";
import { ButtonRow, SmallButton } from "../_styled";

const ScheduleButtonRow = styled(ButtonRow)`
  margin-bottom: 10px;
`;

type Props = {
  /** Loan whose schedule controls are rendered. */
  loan: Loan;
  /** Loan id currently loading its schedule (for the spinner state). */
  scheduleLoadingLoanId: string | null;
  /** Map of loan id → load-error message; presence enables retry UI. */
  scheduleLoadErrors: Record<string, string>;
  /** Loan id whose schedule load is pending and can be retried. */
  pendingScheduleLoanId: string | null;
  /** Retry the pending schedule fetch. */
  onRetrySchedule: () => void;
  /** Toggle the schedule panel for the given loan. */
  onToggleSchedule: (loanId: string) => void;
  /** Open the prepayments modal for the given loan. */
  onOpenPrepaymentsModal: (loanId: string) => void;
  /** Number of recorded prepayments for badge display. */
  ppCount: number;
};

/**
 * Render the schedule + prepayments button row for a loan card.
 *
 * Handles the loading, error/retry, and idle states for the schedule button
 * and shows a prepayments count badge when prepayments exist.
 *
 * @param props - {@link Props} for schedule controls.
 * @returns The button row with schedule and prepayments controls.
 */
export default function LoanScheduleControls({
  loan,
  scheduleLoadingLoanId,
  scheduleLoadErrors,
  pendingScheduleLoanId,
  onRetrySchedule,
  onToggleSchedule,
  onOpenPrepaymentsModal,
  ppCount,
}: Props) {
  return (
    <ScheduleButtonRow>
      {scheduleLoadingLoanId === loan.id ? (
        <SmallButton $variant="orange" disabled>
          Loading schedule…
        </SmallButton>
      ) : scheduleLoadErrors[loan.id] ? (
        <>
          <SmallButton
            $variant="orange"
            onClick={() => {
              if (pendingScheduleLoanId === loan.id) onRetrySchedule();
            }}
          >
            ↺ Retry Schedule
          </SmallButton>
          <SmallButton
            $variant="orange"
            onClick={() => onToggleSchedule(loan.id)}
          >
            EMI Schedule
          </SmallButton>
        </>
      ) : (
        <SmallButton
          $variant="orange"
          onClick={() => onToggleSchedule(loan.id)}
        >
          EMI Schedule
        </SmallButton>
      )}
      <SmallButton
        $variant="green"
        onClick={() => onOpenPrepaymentsModal(loan.id)}
      >
        Prepayments{ppCount > 0 ? ` (${ppCount})` : ""}
      </SmallButton>
    </ScheduleButtonRow>
  );
}
