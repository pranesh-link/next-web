"use client";

/**
 * Styled atoms for the create/edit account modal on the accounts list page.
 *
 * Groups form group, label, inputs, action buttons, alerts, and the inline
 * salary/emergency/nickname badges used inside the modal and account cards.
 * Imported through `_styled.ts` for consistency.
 */

import styled from "styled-components";
import { EASING } from "./_utils";
import { AccountCard } from "./_styled-card";

export const FormGroup = styled.div`
  margin-bottom: 16px;
`;

export const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
`;

export const TypeDisplay = styled.div`
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.10);
  background: #f8fafc;
  color: #1a1a2e;
  font-family: inherit;
  font-size: 14px;
  display: flex;
  align-items: center;
`;

export const ModalInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
`;

export const ErrorText = styled.p`
  color: #ef4444;
  font-size: 13px;
  margin: 8px 0 0;
`;

export const ModalButton = styled.button<{ $primary?: boolean }>`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  white-space: nowrap;
  background: ${(p) => (p.$primary ? "var(--accent)" : "var(--surface)")};
  color: ${(p) => (p.$primary ? "#ffffff" : "var(--text)")};

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

export const CheckboxLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
`;

export const WarningAlert = styled.div`
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #b45309;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
`;

export const SalaryBadge = styled.span`
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #92400e;
  background: rgba(251, 191, 36, 0.11);
  padding: 1px 5px;
  border-radius: 4px;
`;

export const EmergencyBadge = styled.span`
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #047857;
  background: rgba(16, 185, 129, 0.11);
  padding: 1px 5px;
  border-radius: 4px;
`;

export const NicknameBadge = styled.span`
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.11);
  padding: 1px 5px;
  border-radius: 4px;
`;

export const PinButton = styled.button<{ $pinned: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px;
  border-radius: 8px;
  border: none;
  background: ${(p) => (p.$pinned ? "rgba(59, 130, 246, 0.14)" : "transparent")};
  cursor: pointer;
  font-size: 13px;
  opacity: ${(p) => (p.$pinned ? 1 : 0.55)};
  transition: all 0.15s ${EASING};
  z-index: 2;

  &:hover {
    opacity: 1;
    transform: scale(1.08);
    background: rgba(59, 130, 246, 0.14);
  }
`;

export const AddIncomeBtn = styled.button`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  background: rgba(251, 191, 36, 0.08);
  color: #b45309;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  &:hover {
    background: rgba(251, 191, 36, 0.15);
  }
`;

export const PinnedCard = styled(AccountCard)`
  border-color: rgba(59, 130, 246, 0.3);
`;
