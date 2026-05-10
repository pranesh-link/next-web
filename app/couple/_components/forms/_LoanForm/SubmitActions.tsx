"use client";

import {
  FinanceButton,
  FinanceButtonOutline,
} from "@/couple/_components/theme/styled-primitives";
import { ActionRow, Spinner } from "../LoanForm.styled";

/**
 * Props for {@link SubmitActions}.
 */
export interface SubmitActionsProps {
  /** When true, disables both buttons and shows a spinner on the submit. */
  isLoading?: boolean;
  /** Optional cancel handler; renders the Cancel button when provided. */
  onCancel?: () => void;
}

/**
 * Render the submit + optional cancel button row used at the bottom of the loan form.
 *
 * @param props - See {@link SubmitActionsProps}.
 * @returns A flex row containing a primary submit button and an optional outline cancel button.
 */
export default function SubmitActions({
  isLoading,
  onCancel,
}: SubmitActionsProps) {
  return (
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
  );
}
