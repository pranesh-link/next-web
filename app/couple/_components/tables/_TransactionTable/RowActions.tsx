"use client";

import { ActionButton, ActionsCell } from "./styled";

/** Props for {@link RowActions}. */
interface RowActionsProps {
  /** Transaction id (passed to handlers). */
  id: string;
  /** Transaction description (used for aria-labels). */
  description: string;
  /** Optional edit handler. */
  onEdit?: (id: string) => void;
  /** Optional delete handler. */
  onDelete?: (id: string) => void;
}

/**
 * Render the edit/delete icon-button cluster for a transaction row.
 *
 * @param props - See {@link RowActionsProps}.
 */
export function RowActions({ id, description, onEdit, onDelete }: RowActionsProps) {
  return (
    <ActionsCell>
      {onEdit && (
        <ActionButton
          $variant="edit"
          type="button"
          onClick={() => onEdit(id)}
          aria-label={`Edit transaction: ${description}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </ActionButton>
      )}
      {onDelete && (
        <ActionButton
          $variant="delete"
          type="button"
          onClick={() => onDelete(id)}
          aria-label={`Delete transaction: ${description}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </ActionButton>
      )}
    </ActionsCell>
  );
}
