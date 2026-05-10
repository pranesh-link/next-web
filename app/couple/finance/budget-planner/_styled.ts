"use client";

/**
 * Public styled-component entry point for the budget planner page.
 *
 * Houses keyframes, page wrapper, section card, inputs, line-item rows,
 * action buttons, and totals atoms. Re-exports confirm-modal atoms from
 * `_styled-modal.ts` so existing imports continue to work after the split.
 */

import styled, { keyframes } from "styled-components";
import { EASING } from "./_utils";

/* ── Keyframes ──────────────────────────────────────── */

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Layout ─────────────────────────────────────────── */

export const PageWrapper = styled.div`
  padding: 32px;
  max-width: 100%;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const SectionCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  transition: all 0.3s ${EASING};

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 16px 0;
  letter-spacing: -0.3px;
`;

export const MutedText = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
  text-align: center;
  padding: 16px 0;
`;

/* ── Inputs / selects ───────────────────────────────── */

export const FinanceInput = styled.input`
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 15px;
  font-family: inherit;
  color: var(--text);
  transition: border-color 0.2s ${EASING};
  min-width: 0;
  flex: 1;
  max-width: 300px;

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: var(--text-muted);
  }

  @media (max-width: 480px) {
    max-width: 100%;
  }
`;

export const FinanceSelect = styled.select`
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 15px;
  font-family: inherit;
  color: var(--text);
  transition: border-color 0.2s ${EASING};
  min-width: 0;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

export const IncomeHint = styled.p`
  font-size: 13px;
  color: var(--text-muted);
  margin: 8px 0 0 0;
  font-style: italic;
`;

/* ── Line Items ─────────────────────────────────────── */

export const LineItemGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

export const LineItemRow = styled.div<{ $paid?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  animation: ${fadeIn} 0.3s ${EASING};
  min-width: 0;
  opacity: ${(p) => (p.$paid ? 0.85 : 1)};

  ${(p) =>
    p.$paid &&
    `
    & input, & select {
      background: rgba(34, 197, 94, 0.05) !important;
      border-color: rgba(34, 197, 94, 0.25) !important;
      cursor: not-allowed !important;
      color: var(--text-muted) !important;
    }
  `}

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

export const LineItemField = styled.div<{ $flex?: number }>`
  flex: ${(p) => p.$flex ?? 1};
  min-width: 0;

  @media (max-width: 768px) {
    flex-basis: ${(p) => (p.$flex && p.$flex >= 2 ? "100%" : "calc(50% - 5px)")};
  }
`;

export const RemoveButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
  transition: all 0.2s ${EASING};

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: var(--danger);
  }
`;

export const MarkPaidButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
  transition: all 0.2s ${EASING};

  &:hover:not(:disabled) {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

export const UndoButton = styled.button`
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  white-space: nowrap;

  &:hover {
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.3);
    color: var(--danger);
  }
`;

export const ExpenseActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

export const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--accent);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: rgba(59, 130, 246, 0.05);
    border-color: var(--accent);
  }
`;

export const TotalRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  margin-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
`;

export * from "./_styled-modal";
