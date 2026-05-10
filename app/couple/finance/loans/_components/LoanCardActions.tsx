"use client";

import type { Loan } from "../_utils";
import { IconButton } from "../_styled";
import { CardActions } from "./LoanCard.styled";

type Props = {
  /** Loan being acted on. */
  loan: Loan;
  /** Open the edit modal for this loan. */
  onEdit: (loan: Loan) => void;
  /** Prompt to confirm deleting this loan by id. */
  onDeletePrompt: (id: string) => void;
};

/**
 * Render the edit and delete icon buttons inside a loan card header.
 *
 * @param props - {@link Props} containing the loan and click callbacks.
 * @returns The card-level edit/delete action row.
 */
export default function LoanCardActions({ loan, onEdit, onDeletePrompt }: Props) {
  return (
    <CardActions>
      <IconButton
        $variant="edit"
        onClick={() => onEdit(loan)}
        aria-label="Edit loan"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </IconButton>
      <IconButton
        $variant="delete"
        onClick={() => onDeletePrompt(loan.id)}
        aria-label="Delete loan"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </IconButton>
    </CardActions>
  );
}
