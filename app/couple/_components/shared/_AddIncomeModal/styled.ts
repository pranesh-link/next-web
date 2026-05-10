"use client";

import styled from "styled-components";

/** Vertical spacing wrapper for a single labelled form control. */
export const FormGroup = styled.div`
  margin-bottom: 16px;
`;

/** Block-level label for form inputs. */
export const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
`;

/** Themed text/number/date input used inside the income modal. */
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

/** Right-aligned action button row at the bottom of the modal. */
export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
`;

/** Modal action button. Pass `$primary` for the accent-coloured variant. */
export const ModalButton = styled.button<{ $primary?: boolean }>`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
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

/** Inline error message displayed under the form. */
export const ErrorText = styled.p`
  color: #ef4444;
  font-size: 13px;
  margin: 8px 0 0;
`;

/** Horizontal row pairing a checkbox with its label. */
export const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/** Themed checkbox input. */
export const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
`;

/** Label paired with {@link Checkbox}. */
export const CheckboxLabel = styled.label`
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
`;

/** Amber alert shown when reassigning the salary account. */
export const WarningAlert = styled.div`
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #b45309;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-top: 8px;
`;

/** Empty-state copy shown when the user has no accounts yet. */
export const EmptyMessage = styled.p`
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
`;
