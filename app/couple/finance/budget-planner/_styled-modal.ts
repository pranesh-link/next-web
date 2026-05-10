"use client";

/**
 * Styled atoms shared by the budget planner confirm modals.
 *
 * Used by the delete-plan modal, import-prev modal, and suggestions modal.
 * Imported through `_styled.ts` for consistency.
 */

import styled from "styled-components";
import { EASING } from "./_utils";

export const ConfirmBody = styled.div`
  text-align: center;
`;

export const ConfirmText = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 24px 0;
  line-height: 1.6;
`;

export const ConfirmActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

export const ConfirmButton = styled.button<{ $variant: "danger" | "cancel" | "primary" }>`
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  background: ${(p) =>
    p.$variant === "danger"
      ? "var(--danger)"
      : p.$variant === "primary"
        ? "var(--accent)"
        : "var(--surface)"};
  color: ${(p) =>
    p.$variant === "cancel" ? "var(--text)" : "#fff"};
  border: 1px solid
    ${(p) =>
      p.$variant === "danger"
        ? "var(--danger)"
        : p.$variant === "primary"
          ? "var(--accent)"
          : "var(--border)"};

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;
