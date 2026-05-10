"use client";

import {
  AddButton,
  EmptyIcon,
  EmptyText,
  EmptyWrapper,
  Wrapper,
} from "./styled";

/**
 * Empty state shown when there are no transactions to display.
 */
export function EmptyState() {
  return (
    <Wrapper>
      <EmptyWrapper>
        <EmptyIcon
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </EmptyIcon>
        <EmptyText>No transactions yet</EmptyText>
        <AddButton type="button">Add your first transaction</AddButton>
      </EmptyWrapper>
    </Wrapper>
  );
}
